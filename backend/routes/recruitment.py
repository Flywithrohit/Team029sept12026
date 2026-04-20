from flask import Blueprint, request, jsonify, current_app, send_from_directory
from backend.extensions import db
from backend.models import User, JobRequirement, Candidate, DailyLog
from sqlalchemy.orm import joinedload

from backend.utils.decorators import role_required
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
import re
from datetime import datetime

recruitment_bp = Blueprint('recruitment', __name__)

# Security: only permit common safe attachments
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper to maintain daily recruiter logs
def _get_or_create_daily_log(user_id, log_date):
    log = DailyLog.query.filter_by(user_id=user_id, date=log_date).first()
    if not log:
        log = DailyLog(
            user_id=user_id,
            date=log_date,
            profiles_sourced=0,
            profiles_shared=0,
            comments=''
        )
        db.session.add(log)
    return log

# Credit recruiter with actions for their daily summary
def _increment_daily_activity(user_id, sourced_delta=0, shared_delta=0):
    if not user_id:
        return
    today = datetime.utcnow().date()
    log = _get_or_create_daily_log(user_id, today)
    log.profiles_sourced = (log.profiles_sourced or 0) + sourced_delta
    log.profiles_shared = (log.profiles_shared or 0) + shared_delta

# Compile activity and status reports for recruiters and management
def _build_recruitment_reports():
    recruiters = User.query.filter_by(role='Recruitment Executive').all()
    requirements = JobRequirement.query.options(
        joinedload(JobRequirement.assigned_recruiter),
        joinedload(JobRequirement.candidates)
    ).order_by(JobRequirement.created_at.desc()).all()
    recruiter_summary = []

    for recruiter in recruiters:
        # Tally metrics from personal daily logs
        daily_logs = DailyLog.query.filter_by(user_id=recruiter.id).all()
        activity_days = len(daily_logs)
        recruiter_pipeline_candidates = []
        for req in requirements:
            if req.assigned_recruiter and req.assigned_recruiter.id == recruiter.id:
                recruiter_pipeline_candidates.extend(req.candidates or [])

        sourced = sum(log.profiles_sourced or 0 for log in daily_logs)
        shared = sum(log.profiles_shared or 0 for log in daily_logs)
        # Snapshot current candidate funnel for recruiter
        shortlisted = len([c for c in recruiter_pipeline_candidates if c.status in ['Screened', 'Shortlisted', 'Interviewed', 'Selected']])
        interviewed = len([c for c in recruiter_pipeline_candidates if c.status in ['Interviewed', 'Selected']])
        selected = len([c for c in recruiter_pipeline_candidates if c.status == 'Selected'])
        rejected = len([c for c in recruiter_pipeline_candidates if c.status == 'Rejected'])
        closed = selected + rejected

        recruiter_summary.append({
            'recruiter_name': recruiter.full_name,
            'stats': {
                'activity_days': activity_days,
                'sourced': sourced,
                'shared': shared,
                'shortlisted': shortlisted,
                'interviewed': interviewed,
                'selected': selected,
                'rejected': rejected,
                'closed': closed
            }
        })

    requirement_summary = []
    for req in requirements:
        req_candidates = req.candidates or []
        profiles_shared = len(req_candidates)
        # Tally candidate pipeline per job
        shortlisted = len([c for c in req_candidates if c.status in ['Screened', 'Shortlisted', 'Interviewed', 'Selected']])
        interviewed = len([c for c in req_candidates if c.status in ['Interviewed', 'Selected']])
        selected = len([c for c in req_candidates if c.status == 'Selected'])
        rejected = len([c for c in req_candidates if c.status == 'Rejected'])
        open_pipeline = len([c for c in req_candidates if c.status in ['Available', 'Screened', 'Interviewed', 'On Hold']])

        requirement_summary.append({
            'requirement_id': req.id,
            'date': req.created_at.strftime('%Y-%m-%d'),
            'client_company': req.client_company,
            'role_title': req.role_title,
            'location': req.location,
            'recruiter_name': req.assigned_recruiter.full_name if req.assigned_recruiter else 'Unassigned',
            'positions_count': req.positions_count,
            'profiles_shared': profiles_shared,
            'shortlisted': shortlisted,
            'interviewed': interviewed,
            'selected': selected,
            'rejected': rejected,
            'open_pipeline': open_pipeline,
            'requirement_status': req.status
        })

    return {
        'recruiter_summary': recruiter_summary,
        'requirement_summary': requirement_summary
    }

# List all open and closed job requirements
@recruitment_bp.route('/requirements', methods=['GET'])
@jwt_required()
def get_requirements():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Execs only see active jobs; management sees all
    if user.role in ['Admin', 'Manager']:
        requirements = JobRequirement.query.options(joinedload(JobRequirement.assigned_recruiter)).order_by(JobRequirement.created_at.desc()).all()
    else:
        requirements = JobRequirement.query.filter_by(status='Open').options(joinedload(JobRequirement.assigned_recruiter)).order_by(JobRequirement.created_at.desc()).all()
    
    result = []
    for req in requirements:
        result.append({
            'id': req.id,
            'client_company': req.client_company,
            'role_title': req.role_title,
            'location': req.location,
            'positions_count': req.positions_count,
            'status': req.status,
            'created_at': req.created_at.strftime('%Y-%m-%d'),
            'recruiter_name': req.assigned_recruiter.full_name if req.assigned_recruiter else 'Unassigned',
            'jd_file_path': req.jd_file_path
        })
    return jsonify(result), 200

# Post a new job requirement (with JD upload)
@recruitment_bp.route('/requirements', methods=['POST'])
@role_required(['Admin', 'Manager'])
def create_requirement():
    data = request.form
    file = request.files.get('jd_file')
    # Sanitize inputs
    required_fields = ['client_company', 'role_title', 'location', 'positions_count']
    if not all(k in data for k in required_fields):
        return jsonify({'message': 'Missing required fields'}), 400

    jd_filename = None
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        jd_filename = f"jd_{timestamp}_{filename}"
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], jd_filename))

    new_req = JobRequirement(
        client_company=data.get('client_company'),
        role_title=data.get('role_title'),
        location=data.get('location'),
        positions_count=data.get('positions_count'),
        recruiter_id=data.get('recruiter_id') or None, 
        jd_file_path=jd_filename,
        status='Open'
    )
    
    db.session.add(new_req)
    db.session.commit()
    return jsonify({'message': 'Job requirement created successfully', 'id': new_req.id}), 201

# Update JD status or assigned recruiter
@recruitment_bp.route('/requirements/<int:id>', methods=['PUT'])
@role_required(['Admin', 'Manager'])
def update_requirement(id):
    req = JobRequirement.query.get_or_404(id)
    data = request.get_json()
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if 'status' in data:
        # Only admin should close or cancel JDs manually
        if user.role != 'Admin':
            return jsonify({'message': 'Only admin can update requirement status'}), 403
        req.status = data['status']
    if 'recruiter_id' in data:
        req.recruiter_id = data['recruiter_id']
        
    db.session.commit()
    return jsonify({'message': 'Job requirement updated successfully'}), 200

# Delete a job requirement
@recruitment_bp.route('/requirements/<int:id>', methods=['DELETE'])
@role_required(['Admin', 'Manager'])
def delete_requirement(id):
    req = JobRequirement.query.get_or_404(id)
    db.session.delete(req)
    db.session.commit()
    return jsonify({'message': 'Job requirement deleted successfully'}), 200

# Map candidate Model to API friendly structure
def _serialize_candidate(cand):
    return {
        'id': cand.id,
        'name': cand.name,
        'email': cand.email,
        'phone': cand.phone,
        'location': cand.location,
        'company_name': cand.company_name,
        'profile_name': cand.profile_name,
        'qualification': cand.qualification,
        'total_experience': cand.total_experience,
        'relevant_experience': cand.relevant_experience,
        'current_ctc': cand.current_ctc,
        'expected_ctc': cand.expected_ctc,
        'in_hand_salary': cand.in_hand_salary,
        'notice_period': cand.notice_period,
        'status': cand.status or 'Available',
        'resume_file_path': cand.resume_file_path,
        'job_role': cand.job_requirement.role_title if cand.job_requirement else None,
        'job_client_company': cand.job_requirement.client_company if cand.job_requirement else None,
        'job_location': cand.job_requirement.location if cand.job_requirement else None,
        'assigned_recruiter_name': cand.job_requirement.assigned_recruiter.full_name if cand.job_requirement and cand.job_requirement.assigned_recruiter else 'Unassigned',
        'job_requirement_id': cand.job_requirement_id,
    }

# List of all candidates with role filtering
@recruitment_bp.route('/candidates', methods=['GET'])
@jwt_required()
def get_candidates():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Main team sees all; others only their sourced leads
    if user.role in ['Admin', 'Manager', 'Recruitment Executive']:
        candidates = Candidate.query.options(joinedload(Candidate.job_requirement)).order_by(Candidate.id.desc()).all()
    else:
        candidates = Candidate.query.filter_by(sourced_by=current_user_id).options(joinedload(Candidate.job_requirement)).order_by(Candidate.id.desc()).all()
        
    result = [_serialize_candidate(c) for c in candidates]
    return jsonify(result), 200

# Single candidate detail
@recruitment_bp.route('/candidates/<int:id>', methods=['GET'])
@jwt_required()
def get_candidate_detail(id):
    cand = Candidate.query.options(joinedload(Candidate.job_requirement)).get_or_404(id)
    return jsonify(_serialize_candidate(cand)), 200

# Add a single candidate manually
@recruitment_bp.route('/candidates', methods=['POST'])
@jwt_required()
def add_candidate():
    current_user_id = get_jwt_identity()
    data = request.form
    file = request.files.get('resume_file')
    
    resume_filename = None
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        resume_filename = f"resume_{timestamp}_{filename}"
        file.save(os.path.join(current_app.config['UPLOAD_FOLDER'], resume_filename))

    new_cand = Candidate(
        sourced_by=current_user_id,
        name=data.get('name'),
        email=data.get('email'),
        phone=data.get('phone'),
        location=data.get('location'),
        company_name=data.get('company_name'),
        profile_name=data.get('profile_name'),
        qualification=data.get('qualification'),
        total_experience=data.get('total_experience') or None,
        relevant_experience=data.get('relevant_experience') or None,
        current_ctc=data.get('current_ctc') or None,
        expected_ctc=data.get('expected_ctc') or None,
        in_hand_salary=data.get('in_hand_salary') or None,
        notice_period=data.get('notice_period'),
        job_requirement_id=data.get('job_requirement_id') or None,
        resume_file_path=resume_filename,
        # Default to shared if job is pre-mapped
        status='Shared' if data.get('job_requirement_id') else 'Available'
    )
    
    db.session.add(new_cand)
    # Give recruiter credit in daily log
    _increment_daily_activity(
        current_user_id,
        sourced_delta=1,
        shared_delta=1 if data.get('job_requirement_id') else 0
    )
    db.session.commit()
    return jsonify({'message': 'Candidate added successfully', 'id': new_cand.id}), 201

# Bulk upload from spreadsheet (csv/xlsx)
@recruitment_bp.route('/candidates/upload-excel', methods=['POST'])
@jwt_required()
def upload_candidates_excel():
    current_user_id = get_jwt_identity()
    file = request.files.get('file')

    if not file or not file.filename:
        return jsonify({'message': 'No file provided'}), 400

    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ('xlsx', 'csv'):
        return jsonify({'message': 'Only .xlsx and .csv files are accepted'}), 400

    rows = []
    try:
        # Load file content based on extension
        if ext == 'xlsx':
            import openpyxl
            wb = openpyxl.load_workbook(file, data_only=True)
            ws = wb.active
            headers = [str(cell.value or '').strip() for cell in ws[1]]
            for row in ws.iter_rows(min_row=2, values_only=True):
                row_dict = {}
                for i, val in enumerate(row):
                    if i < len(headers):
                        row_dict[headers[i]] = val
                rows.append(row_dict)
        else:
            import csv, io
            content = file.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            for row in reader:
                rows.append({k.strip(): v for k, v in row.items()})
    except Exception as e:
        return jsonify({'message': f'Failed to parse file: {str(e)}'}), 400

    # User friendly synonym map to handle various header names
    COL_MAP = {
        'sr no': None,
        'name': 'name',
        'email id': 'email', 'email': 'email', 'email i\'d': 'email',
        'contact no': 'phone', 'contact no.': 'phone', 'phone': 'phone',
        'location': 'location',
        'company name': 'company_name',
        'profile name': 'profile_name', 'profile title': 'profile_name', 'role': 'profile_name',
        'qualification': 'qualification',
        'total experience': 'total_experience', 'total exp': 'total_experience',
        'relevant experience': 'relevant_experience', 'rel exp': 'relevant_experience',
        'inhand salary': 'in_hand_salary', 'in hand salary': 'in_hand_salary',
        'ctc salary': 'current_ctc', 'ctc': 'current_ctc',
        'expected salary': 'expected_ctc', 'exp salary': 'expected_ctc', 'exp. salary': 'expected_ctc',
        'notice period': 'notice_period',
    }

    # Extract clean floats from messy text strings
    def parse_float(val):
        if val is None:
            return None
        if isinstance(val, (int, float)):
            return float(val)
        
        s_val = str(val).lower().replace(',', '').strip()
        match = re.search(r'(\d+(?:\.\d+)?)', s_val)
        if match:
            try:
                return float(match.group(1))
            except ValueError:
                return None
        return None

    imported = 0
    skipped = 0

    for row in rows:
        mapped = {}
        for key, val in row.items():
            if key is None:
                continue
            # Logic: sanitize header for lookup in COL_MAP
            key_str = str(key).encode('ascii', 'ignore').decode('ascii')
            norm = " ".join(key_str.lower().split()).strip()
            
            if norm in COL_MAP and COL_MAP[norm]:
                mapped[COL_MAP[norm]] = val

        name = str(mapped.get('name') or '').strip()
        email = str(mapped.get('email') or '').strip()
        phone = str(mapped.get('phone') or '').strip()

        if not name and not email:
            continue

        # Prevent duplicates based on email or phone
        existing = None
        if email:
            existing = Candidate.query.filter_by(email=email).first()
        if not existing and phone:
            existing = Candidate.query.filter_by(phone=phone).first()

        if existing:
            # Upsert logic: only update if value is present in sheet
            existing.name = name or existing.name
            existing.location = str(mapped.get('location') or '').strip() or existing.location
            existing.company_name = str(mapped.get('company_name') or '').strip() or existing.company_name
            existing.profile_name = str(mapped.get('profile_name') or '').strip() or existing.profile_name
            existing.qualification = str(mapped.get('qualification') or '').strip() or existing.qualification
            total_exp = parse_float(mapped.get('total_experience'))
            if total_exp is not None: existing.total_experience = total_exp
            
            rel_exp = parse_float(mapped.get('relevant_experience'))
            if rel_exp is not None: existing.relevant_experience = rel_exp
            
            in_hand = parse_float(mapped.get('in_hand_salary'))
            if in_hand is not None: existing.in_hand_salary = in_hand
            
            ctc = parse_float(mapped.get('current_ctc'))
            if ctc is not None: existing.current_ctc = ctc
            
            exp_ctc = parse_float(mapped.get('expected_ctc'))
            if exp_ctc is not None: existing.expected_ctc = exp_ctc
            
            existing.notice_period = str(mapped.get('notice_period') or '').strip() or existing.notice_period
            imported += 1
            continue

        # Standard new record creation
        cand = Candidate(
            sourced_by=current_user_id,
            name=name or None,
            email=email or None,
            phone=phone or None,
            location=str(mapped.get('location') or '').strip() or None,
            company_name=str(mapped.get('company_name') or '').strip() or None,
            profile_name=str(mapped.get('profile_name') or '').strip() or None,
            qualification=str(mapped.get('qualification') or '').strip() or None,
            total_experience=parse_float(mapped.get('total_experience')),
            relevant_experience=parse_float(mapped.get('relevant_experience')),
            current_ctc=parse_float(mapped.get('current_ctc')),
            expected_ctc=parse_float(mapped.get('expected_ctc')),
            in_hand_salary=parse_float(mapped.get('in_hand_salary')),
            notice_period=str(mapped.get('notice_period') or '').strip() or None,
            status='Available'
        )
        db.session.add(cand)
        imported += 1

    db.session.commit()

    return jsonify({
        'message': f'{imported} candidates imported successfully. {skipped} duplicate records skipped.',
        'imported': imported,
        'skipped': skipped
    }), 201

# Update candidate status or job mapping
@recruitment_bp.route('/candidates/<int:id>', methods=['PUT'])
@role_required(['Admin', 'Manager', 'Recruitment Executive'])
def update_candidate(id):
    cand = Candidate.query.get_or_404(id)
    data = request.get_json()
    previous_requirement_id = cand.job_requirement_id
    updatable = ['name', 'email', 'phone', 'location', 'company_name', 'profile_name',
                 'qualification', 'total_experience', 'relevant_experience', 'current_ctc',
                 'expected_ctc', 'in_hand_salary', 'notice_period', 'status', 'job_requirement_id']
    for field in updatable:
        if field in data:
            setattr(cand, field, data[field])

    # Log shared action credit if mapping for the first time
    if previous_requirement_id is None and cand.job_requirement_id is not None:
        current_user_id = get_jwt_identity()
        _increment_daily_activity(current_user_id, shared_delta=1)

    db.session.commit()
    return jsonify({'message': 'Candidate updated successfully'}), 200

# Basic recruitment KPIs
@recruitment_bp.route('/stats', methods=['GET'])
@role_required(['Admin', 'Manager'])
def get_stats():
    total_reqs = JobRequirement.query.count()
    open_reqs = JobRequirement.query.filter_by(status='Open').count()
    total_cands = Candidate.query.count()
    
    cands = Candidate.query.all()
    status_counts = {}
    for c in cands:
        status_counts[c.status] = status_counts.get(c.status, 0) + 1
        
    return jsonify({
        'total_requirements': total_reqs,
        'open_requirements': open_reqs,
        'total_candidates': total_cands,
        'candidate_status_breakdown': status_counts
    }), 200

# Full dashboard report data
@recruitment_bp.route('/reports', methods=['GET'])
@role_required(['Admin', 'Manager', 'Recruitment Executive'])
def get_reports():
    return jsonify(_build_recruitment_reports()), 200

# Download attachments
@recruitment_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

# View historical productivity logs
@recruitment_bp.route('/daily-logs', methods=['GET'])
@jwt_required()
def get_daily_logs():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Execs see only their own; management sees team breakdown
    if user.role in ['Admin', 'Manager']:
        logs = DailyLog.query.options(joinedload(DailyLog.employee_log)).order_by(DailyLog.date.desc()).all()
    else:
        logs = DailyLog.query.filter_by(user_id=current_user_id).options(joinedload(DailyLog.employee_log)).order_by(DailyLog.date.desc()).all()
        
    result = []
    for log in logs:
        log_user = log.employee_log
        result.append({
            'id': log.id,
            'recruiter_name': log_user.full_name if log_user else 'Unknown',
            'date': log.date.strftime('%Y-%m-%d'),
            'profiles_sourced': log.profiles_sourced,
            'profiles_shared': log.profiles_shared,
            'comments': log.comments
        })
    return jsonify(result), 200

# Log daily activity manually
@recruitment_bp.route('/daily-logs', methods=['POST'])
@jwt_required()
def create_daily_log():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        log_date = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid date format'}), 400
        
    new_log = DailyLog(
        user_id=current_user_id,
        date=log_date,
        profiles_sourced=data.get('profiles_sourced', 0),
        profiles_shared=data.get('profiles_shared', 0),
        comments=data.get('comments')
    )
    
    db.session.add(new_log)
    db.session.commit()
    return jsonify({'message': 'Daily log submitted successfully'}), 201
