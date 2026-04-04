from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models import User, Salary, Leave, Candidate, JobRequirement, DailyLog
from sqlalchemy.orm import joinedload
from flask_jwt_extended import get_jwt_identity
from datetime import datetime

from backend.utils.decorators import role_required
from backend.utils.passwords import validate_password
from werkzeug.security import generate_password_hash

admin_bp = Blueprint('admin', __name__)


def _build_recruitment_reports():
    recruiters = User.query.filter_by(role='Recruitment Executive').all()
    requirements = JobRequirement.query.options(
        joinedload(JobRequirement.assigned_recruiter),
        joinedload(JobRequirement.candidates)
    ).order_by(JobRequirement.created_at.desc()).all()
    recruiter_summary = []

    for recruiter in recruiters:
        daily_logs = DailyLog.query.filter_by(user_id=recruiter.id).all()
        activity_days = len(daily_logs)
        recruiter_pipeline_candidates = []
        for req in requirements:
            if req.assigned_recruiter and req.assigned_recruiter.id == recruiter.id:
                recruiter_pipeline_candidates.extend(req.candidates or [])

        sourced = sum(log.profiles_sourced or 0 for log in daily_logs)
        shared = sum(log.profiles_shared or 0 for log in daily_logs)
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

@admin_bp.route('/users', methods=['GET'])
@role_required(['Admin', 'Manager'])
def get_users():
    users = User.query.order_by(User.created_at.desc()).all()
    result = []
    for user in users:
        result.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'full_name': user.full_name,
            'created_at': user.created_at.strftime('%Y-%m-%d'),
            'profile_picture': user.profile_picture,
            'is_verified': user.is_verified,
            'verification_status': user.verification_status
        })
    return jsonify(result), 200

@admin_bp.route('/users', methods=['POST'])
@role_required(['Admin', 'Manager'])
def create_user():
    data = request.get_json()
    current_user = User.query.get(int(get_jwt_identity()))
    requested_role = data.get('role')
    
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({'message': 'Username already exists'}), 400
    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'Email already exists'}), 400
    if requested_role == 'Admin':
        return jsonify({'message': 'A new Admin account cannot be created. This CRM allows only one Admin.'}), 400
    if current_user and current_user.role == 'Manager' and requested_role == 'Manager':
        return jsonify({'message': 'Managers cannot create other Manager accounts'}), 403
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')
    if password != confirm_password:
        return jsonify({'message': 'Passwords do not match'}), 400
    is_valid, errors = validate_password(password, data.get('username', ''), data.get('email', ''))
    if not is_valid:
        return jsonify({'message': errors[0], 'errors': errors}), 400

    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        role=requested_role,
        full_name=data.get('full_name'),
        password_hash=generate_password_hash(password),
        is_verified=True,
        verification_status='Approved'
    )
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully', 'id': new_user.id}), 201

@admin_bp.route('/users/<int:id>/verification', methods=['PUT'])
@role_required(['Admin'])
def update_user_verification(id):
    user = User.query.get_or_404(id)
    data = request.get_json() or {}
    status = data.get('verification_status')

    if status not in ['Pending', 'Approved']:
        return jsonify({'message': 'Invalid verification status'}), 400

    user.verification_status = status
    user.is_verified = status == 'Approved'

    db.session.commit()
    return jsonify({'message': 'Verification status updated successfully'}), 200

@admin_bp.route('/users/<int:id>', methods=['PUT'])
@role_required(['Admin'])
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.get_json()
    
    if 'role' in data:
        if user.role == 'Admin' or data['role'] == 'Admin':
            return jsonify({'message': 'Admin role cannot be reassigned or changed'}), 400
        user.role = data['role']
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'email' in data:
        if data['email'] != user.email and User.query.filter_by(email=data['email']).first():
             return jsonify({'message': 'Email already exists'}), 400
        user.email = data['email']
        
    db.session.commit()
    return jsonify({'message': 'User updated successfully'}), 200

@admin_bp.route('/users/<int:id>', methods=['DELETE'])
@role_required(['Admin'])
def delete_user(id):
    user = User.query.get_or_404(id)
    if user.role == 'Admin':
        return jsonify({'message': 'The Admin account cannot be deleted'}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200

@admin_bp.route('/logs', methods=['GET'])
@role_required(['Admin'])
def get_logs():
    return jsonify([
        {'timestamp': '2023-10-27 10:00:00', 'level': 'INFO', 'message': 'System started'},
        {'timestamp': '2023-10-27 10:05:00', 'level': 'INFO', 'message': 'Database connected'}
    ]), 200


@admin_bp.route('/salaries', methods=['GET'])
@role_required(['Admin', 'Manager'])
def get_salaries():
    salaries = Salary.query.options(joinedload(Salary.employee)).order_by(Salary.year.desc(), Salary.month.desc()).all()
    result = []
    for s in salaries:
        result.append({
            'id': s.id,
            'employee_name': s.employee.full_name,
            'username': s.employee.username,
            'month': s.month,
            'year': s.year,
            'base_salary': s.base_salary,
            'incentives': s.incentives,
            'deductions': s.deductions,
            'net_pay': s.net_pay,
            'payment_status': s.payment_status
        })
    return jsonify(result), 200

@admin_bp.route('/salaries', methods=['POST'])
@role_required(['Admin', 'Manager'])
def create_salary():
    data = request.get_json()
    
    base = float(data.get('base_salary', 0))
    incentives = float(data.get('incentives', 0))
    deductions = float(data.get('deductions', 0))
    net_pay = base + incentives - deductions
    
    new_salary = Salary(
        user_id=data.get('user_id'),
        month=data.get('month'),
        year=data.get('year'),
        base_salary=base,
        incentives=incentives,
        deductions=deductions,
        net_pay=net_pay,
        payment_status=data.get('payment_status', 'Pending')
    )
    
    db.session.add(new_salary)
    db.session.commit()
    return jsonify({'message': 'Salary record created successfully', 'id': new_salary.id}), 201

@admin_bp.route('/leaves', methods=['GET'])
@role_required(['Admin', 'Manager'])
def get_all_leaves():
    status = request.args.get('status')
    if status:
        leaves = Leave.query.filter_by(status=status).options(joinedload(Leave.employee)).order_by(Leave.start_date.desc()).all()
    else:
        # Desc order keeps Pending ahead of Approved/Rejected with the current status values.
        leaves = Leave.query.options(joinedload(Leave.employee)).order_by(Leave.status.desc(), Leave.start_date.desc()).all()
        
    result = []
    for leave in leaves:
        approver = User.query.get(leave.approved_by) if leave.approved_by else None
        result.append({
            'id': leave.id,
            'employee_name': leave.employee.full_name,
            'type': leave.leave_type,
            'start_date': leave.start_date.strftime('%Y-%m-%d'),
            'end_date': leave.end_date.strftime('%Y-%m-%d'),
            'total_days': leave.total_days,
            'day_type': leave.day_type or 'Full Day',
            'reason': leave.reason,
            'status': leave.status,
            'applied_at': leave.applied_at.strftime('%Y-%m-%d %H:%M') if leave.applied_at else None,
            'approved_at': leave.approved_at.strftime('%Y-%m-%d %H:%M') if leave.approved_at else None,
            'approved_by_name': approver.full_name if approver else None
        })
    return jsonify(result), 200

@admin_bp.route('/leaves/<int:id>', methods=['PUT'])
@role_required(['Admin', 'Manager'])
def update_leave_status(id):
    leave = Leave.query.get_or_404(id)
    data = request.get_json()
    current_user_id = get_jwt_identity()
    if 'status' not in data:
        return jsonify({'message': 'Status is required'}), 400   
    leave.status = data['status']
    if data['status'] in ['Approved', 'Rejected']:
        leave.approved_by = current_user_id
        leave.approved_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({'message': 'Leave status updated successfully'}), 200


@admin_bp.route('/reports', methods=['GET'])
@role_required(['Admin', 'Manager'])
def get_reports():
    return jsonify(_build_recruitment_reports()), 200
