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

# Calculation logic for building a salary record
def _build_salary_record(user_id, data):
    user = User.query.get(user_id)
    if not user:
        return None, 'User not found'

    month = data.get('month')
    year = data.get('year')
    if not month or year is None:
        return None, 'Month and year are required'

    # Get raw input values
    total_salary = float(data.get('total_salary', 0))
    basic_salary = float(data.get('basic_salary', 0))
    conveyance_allowance = float(data.get('conveyance_allowance', 0))

    # Derive HRA as 50% of basic
    hra = round(basic_salary * 0.5, 2)
    # Special allowance is the leftover to meet total salary target
    special_allowance = round(total_salary - (basic_salary + hra + conveyance_allowance), 2)
    if special_allowance < 0:
        special_allowance = 0
    gross_earnings = round(basic_salary + hra + conveyance_allowance + special_allowance, 2)

    # Calculate recruitment incentives if applicable
    final_offer_closed = int(data.get('final_offer_closed', 0))
    commission_per_closure = float(data.get('commission_per_closure', 0))
    incentive = round(final_offer_closed * commission_per_closure, 2)

    # Attendance based deduction logic
    working_days = int(data.get('working_days', 26))
    leaves_taken = float(data.get('leaves_taken', 0))

    daily_rate = round(total_salary / working_days, 2) if working_days > 0 else 0
    leave_deduction = round(daily_rate * leaves_taken, 2)
    other_deductions = float(data.get('other_deductions', 0))
    gross_deductions = round(leave_deduction + other_deductions, 2)

    # Final payable amount
    net_pay = round(gross_earnings + incentive - gross_deductions, 2)

    salary = Salary(
        user_id=user_id,
        month=month,
        year=year,
        base_salary=total_salary,
        incentives=incentive,
        deductions=gross_deductions,
        net_pay=net_pay,
        payment_status=data.get('payment_status', 'Pending'),
        total_salary=total_salary,
        basic_salary=basic_salary,
        hra=hra,
        conveyance_allowance=conveyance_allowance,
        special_allowance=special_allowance,
        gross_earnings=gross_earnings,
        final_offer_closed=final_offer_closed,
        commission_per_closure=commission_per_closure,
        working_days=working_days,
        leaves_taken=leaves_taken,
        leave_deduction=leave_deduction,
        other_deductions=other_deductions,
        gross_deductions=gross_deductions
    )
    return salary, None

# Aggregates recruitment activity for reports
def _build_recruitment_reports():
    recruiters = User.query.filter_by(role='Recruitment Executive').all()
    requirements = JobRequirement.query.options(
        joinedload(JobRequirement.assigned_recruiter),
        joinedload(JobRequirement.candidates)
    ).order_by(JobRequirement.created_at.desc()).all()
    recruiter_summary = []

    for recruiter in recruiters:
        # Get historical activity from daily logs
        daily_logs = DailyLog.query.filter_by(user_id=recruiter.id).all()
        activity_days = len(daily_logs)
        recruiter_pipeline_candidates = []
        for req in requirements:
            if req.assigned_recruiter and req.assigned_recruiter.id == recruiter.id:
                recruiter_pipeline_candidates.extend(req.candidates or [])

        sourced = sum(log.profiles_sourced or 0 for log in daily_logs)
        shared = sum(log.profiles_shared or 0 for log in daily_logs)
        # Tally candidate statuses for current recruiter
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
        # Breakdown status per JD
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

# List all system users (admin/manager only)
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
            'branch_location': user.branch_location,
            'created_at': user.created_at.strftime('%Y-%m-%d') if user.created_at else None,
            'profile_picture': user.profile_picture,
            'is_verified': user.is_verified,
            'verification_status': user.verification_status
        })
    return jsonify(result), 200

# Admin manual user creation
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
        
    # Only one root admin allowed
    if requested_role == 'Admin':
        return jsonify({'message': 'A new Admin account cannot be created. This CRM allows only one Admin.'}), 400
        
    # Managers can't create other managers
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
    
    # Generate and store custom employee ID
    new_user.employee_id = new_user.generate_employee_id()
    
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User created successfully', 'id': new_user.id}), 201

# Approve or reject self-registered users (admin only)
@admin_bp.route('/users/<int:id>/verification', methods=['PUT'])
@role_required(['Admin'])
def update_user_verification(id):
    user = User.query.get_or_404(id)
    data = request.get_json() or {}
    status = data.get('verification_status')

    if status not in ['Pending', 'Approved']:
        return jsonify({'message': 'Invalid verification status'}), 400

    user.verification_status = status
    user.is_verified = (status == 'Approved')

    db.session.commit()
    return jsonify({'message': 'Verification status updated successfully'}), 200

# Update user details
@admin_bp.route('/users/<int:id>', methods=['PUT'])
@role_required(['Admin'])
def update_user(id):
    user = User.query.get_or_404(id)
    data = request.get_json()
    
    if 'role' in data:
        # Prevent demoting the root admin
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

# Delete a user account (admin only)
@admin_bp.route('/users/<int:id>', methods=['DELETE'])
@role_required(['Admin'])
def delete_user(id):
    user = User.query.get_or_404(id)
    if user.role == 'Admin':
        return jsonify({'message': 'The Admin account cannot be deleted'}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200

# Get system-level logs
@admin_bp.route('/logs', methods=['GET'])
@role_required(['Admin'])
def get_logs():
    return jsonify([
        {'timestamp': '2023-10-27 10:00:00', 'level': 'INFO', 'message': 'System started'},
        {'timestamp': '2023-10-27 10:05:00', 'level': 'INFO', 'message': 'Database connected'}
    ]), 200

# Static company info for headers/payslips
@admin_bp.route('/company-info', methods=['GET'])
@role_required(['Admin', 'Manager'])
def get_company_info():
    return jsonify({
        'company_name': 'Eduitalent Pvt. Ltd.',
        'company_address': '2nd Floor, Business Park, Sector 62, Noida, India'
    }), 200

# Get all processed salaries
@admin_bp.route('/salaries', methods=['GET'])
@role_required(['Admin', 'Manager'])
def get_salaries():
    salaries = Salary.query.options(joinedload(Salary.employee)).order_by(Salary.year.desc(), Salary.month.desc()).all()
    result = []
    for s in salaries:
        result.append({
            'id': s.id,
            'user_id': s.user_id,
            'employee_name': s.employee.full_name,
            'username': s.employee.username,
            'month': s.month,
            'year': s.year,
            'base_salary': s.base_salary,
            'incentives': s.incentives,
            'deductions': s.deductions,
            'net_pay': s.net_pay,
            'payment_status': s.payment_status,
            'total_salary': s.total_salary,
            'basic_salary_component': s.basic_salary,
            'hra': s.hra,
            'conveyance_allowance': s.conveyance_allowance,
            'special_allowance': s.special_allowance,
            'gross_earnings': s.gross_earnings,
            'final_offer_closed': s.final_offer_closed,
            'commission_per_closure': s.commission_per_closure,
            'working_days': s.working_days,
            'present_days': s.present_days,
            'leaves_taken': s.leaves_taken,
            'leave_deduction': s.leave_deduction,
            'other_deductions': s.other_deductions,
            'gross_deductions': s.gross_deductions
        })
    return jsonify(result), 200

# Create single salary record
@admin_bp.route('/salaries', methods=['POST'])
@role_required(['Admin', 'Manager'])
def create_salary():
    data = request.get_json()
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'message': 'Employee is required'}), 400

    # Prevent double processing for same month/year
    existing_salary = Salary.query.filter_by(
        user_id=user_id,
        month=data.get('month'),
        year=data.get('year')
    ).first()
    if existing_salary:
        return jsonify({'message': 'Salary for this employee, month, and year already exists'}), 400

    new_salary, error = _build_salary_record(user_id, data)
    if error:
        return jsonify({'message': error}), 404 if error == 'User not found' else 400

    db.session.add(new_salary)
    db.session.commit()
    return jsonify({'message': 'Salary record created successfully'}), 201

# Process many salaries at once
@admin_bp.route('/salaries/batch', methods=['POST'])
@role_required(['Admin', 'Manager'])
def create_salaries_batch():
    data = request.get_json() or {}
    user_ids = data.get('user_ids') or []

    if not isinstance(user_ids, list) or not user_ids:
        return jsonify({'message': 'At least one employee must be selected'}), 400

    # Sanitize user IDs
    normalized_user_ids = []
    for user_id in user_ids:
        try:
            normalized_user_ids.append(int(user_id))
        except (TypeError, ValueError):
            return jsonify({'message': 'Invalid employee selection'}), 400

    month = data.get('month')
    year = data.get('year')
    created_for = []
    skipped = []

    for user_id in normalized_user_ids:
        existing_salary = Salary.query.filter_by(user_id=user_id, month=month, year=year).first()
        user = User.query.get(user_id)

        # Skip if already paid
        if existing_salary:
            skipped.append({
                'user_id': user_id,
                'employee_name': user.full_name if user else f'User {user_id}',
                'reason': 'Already processed for this month and year'
            })
            continue

        salary, error = _build_salary_record(user_id, data)
        if error:
            skipped.append({
                'user_id': user_id,
                'employee_name': user.full_name if user else f'User {user_id}',
                'reason': error
            })
            continue

        db.session.add(salary)
        created_for.append({
            'user_id': user_id,
            'employee_name': user.full_name if user else f'User {user_id}'
        })

    # Don't commit if nothing happened but errors occurred
    if not created_for and skipped:
        db.session.rollback()
        return jsonify({
            'message': 'No salary records were created',
            'created_count': 0,
            'skipped_count': len(skipped),
            'skipped': skipped
        }), 400

    db.session.commit()
    return jsonify({
        'message': f'Salary processed for {len(created_for)} employee(s)',
        'created_count': len(created_for),
        'skipped_count': len(skipped),
        'created': created_for,
        'skipped': skipped
    }), 201

# Mark salary as paid
@admin_bp.route('/salaries/<int:id>', methods=['PUT'])
@role_required(['Admin', 'Manager'])
def update_salary(id):
    salary = Salary.query.get_or_404(id)
    data = request.get_json() or {}

    if 'payment_status' not in data:
        return jsonify({'message': 'Payment status is required'}), 400

    payment_status = str(data.get('payment_status', '')).strip()
    if payment_status not in ['Pending', 'Paid']:
        return jsonify({'message': 'Invalid payment status'}), 400

    salary.payment_status = payment_status
    db.session.commit()
    return jsonify({'message': 'Salary status updated successfully'}), 200

# Get all pending or approved leave requests
@admin_bp.route('/leaves', methods=['GET'])
@role_required(['Admin', 'Manager'])
def get_all_leaves():
    status = request.args.get('status')
    if status:
        leaves = Leave.query.filter_by(status=status).options(joinedload(Leave.employee)).order_by(Leave.start_date.desc()).all()
    else:
        # Show pending first
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

# Approve or reject leave
@admin_bp.route('/leaves/<int:id>', methods=['PUT'])
@role_required(['Admin', 'Manager'])
def update_leave_status(id):
    leave = Leave.query.get_or_404(id)
    data = request.get_json()
    current_user_id = get_jwt_identity()
    if 'status' not in data:
        return jsonify({'message': 'Status is required'}), 400   
    leave.status = data['status']
    
    # Track who took the decision
    if data['status'] in ['Approved', 'Rejected']:
        leave.approved_by = current_user_id
        leave.approved_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({'message': 'Leave status updated successfully'}), 200

# Combined recruitment stats
@admin_bp.route('/reports', methods=['GET'])
@role_required(['Admin', 'Manager'])
def get_reports():
    return jsonify(_build_recruitment_reports()), 200
