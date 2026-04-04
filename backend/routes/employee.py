from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models import User, Attendance, Leave, Salary
from backend.utils.decorators import role_required
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date

employee_bp = Blueprint('employee', __name__)

@employee_bp.route('/attendance', methods=['GET'])
@jwt_required()
def get_attendance():
    current_user_id = get_jwt_identity()
    attendances = Attendance.query.filter_by(user_id=current_user_id).order_by(Attendance.date.desc()).all()
    
    from datetime import timedelta
    ist_offset = timedelta(hours=5, minutes=30)
    
    result = []
    for att in attendances:
        check_in_ist = (att.check_in_time + ist_offset).strftime('%H:%M:%S') if att.check_in_time else None
        check_out_ist = (att.check_out_time + ist_offset).strftime('%H:%M:%S') if att.check_out_time else None
        
        result.append({
            'date': att.date.strftime('%Y-%m-%d'),
            'check_in': check_in_ist,
            'check_out': check_out_ist,
            'status': att.status,
            'total_hours': att.total_hours
        })
    return jsonify(result), 200

@employee_bp.route('/attendance/clock-in', methods=['POST'])
@jwt_required()
def clock_in():
    current_user_id = get_jwt_identity()
    today = date.today()
    
    existing = Attendance.query.filter_by(user_id=current_user_id, date=today).first()
    if existing:
        return jsonify({'message': 'Already clocked in for today'}), 400

    new_attendance = Attendance(
        user_id=current_user_id,
        date=today,
        check_in_time=datetime.utcnow(),
        status='Present'
    )
    db.session.add(new_attendance)
    db.session.commit()
    return jsonify({'message': 'Clocked in successfully'}), 200

@employee_bp.route('/attendance/clock-out', methods=['POST'])
@jwt_required()
def clock_out():
    current_user_id = get_jwt_identity()
    today = date.today()
    
    attendance = Attendance.query.filter_by(user_id=current_user_id, date=today).first()
    if not attendance:
        return jsonify({'message': 'No attendance record found for today. Please clock in first.'}), 400
        
    if attendance.check_out_time is not None:
         return jsonify({'message': 'Already clocked out for today'}), 400

    attendance.check_out_time = datetime.utcnow()
    
    duration = attendance.check_out_time - attendance.check_in_time
    attendance.total_hours = round(duration.total_seconds() / 3600, 2)
    
    db.session.commit()
    return jsonify({'message': 'Clocked out successfully', 'total_hours': attendance.total_hours}), 200

@employee_bp.route('/leaves', methods=['GET'])
@jwt_required()
def get_leaves():
    current_user_id = get_jwt_identity()
    leaves = Leave.query.filter_by(user_id=current_user_id).order_by(Leave.start_date.desc()).all()
    
    result = []
    for leave in leaves:
        approver = User.query.get(leave.approved_by) if leave.approved_by else None
        result.append({
            'id': leave.id,
            'type': leave.leave_type,
            'start_date': leave.start_date.strftime('%Y-%m-%d'),
            'end_date': leave.end_date.strftime('%Y-%m-%d'),
            'total_days': leave.total_days,
            'day_type': leave.day_type or 'Full Day',
            'reason': leave.reason,
            'status': leave.status,
            'approved_by': leave.approved_by,
            'approved_by_name': approver.full_name if approver else None,
            'applied_at': leave.applied_at.strftime('%Y-%m-%d %H:%M') if leave.applied_at else None,
            'approved_at': leave.approved_at.strftime('%Y-%m-%d %H:%M') if leave.approved_at else None
        })
    return jsonify(result), 200

@employee_bp.route('/leaves', methods=['POST'])
@jwt_required()
def apply_leave():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
        end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
        
        if end_date < start_date:
            return jsonify({'message': 'End date cannot be before start date'}), 400
        if start_date < date.today():
            return jsonify({'message': 'Past-date leave applications are not allowed'}), 400
        
        day_type = data.get('day_type', 'Full Day')
        
        day_count = (end_date - start_date).days + 1
        if day_type in ('First Half', 'Second Half'):
            # Half-day applies to just one edge of the range, not every day in it.
            if day_count == 1:
                total_days = 0.5
            else:
                total_days = day_count - 0.5
        else:
            total_days = day_count
            
        leave = Leave(
            user_id=current_user_id,
            leave_type=data.get('leave_type'),
            start_date=start_date,
            end_date=end_date,
            total_days=total_days,
            day_type=day_type,
            reason=data.get('reason'),
            status='Pending',
            applied_at=datetime.utcnow()
        )
        db.session.add(leave)
        db.session.commit()
        return jsonify({'message': 'Leave application submitted successfully'}), 201
        
    except ValueError:
        return jsonify({'message': 'Invalid date format. Use YYYY-MM-DD'}), 400


@employee_bp.route('/salary', methods=['GET'])
@jwt_required()
def get_salary():
    current_user_id = get_jwt_identity()
    salaries = Salary.query.filter_by(user_id=current_user_id).all()
    month_order = {
        'January': 1,
        'February': 2,
        'March': 3,
        'April': 4,
        'May': 5,
        'June': 6,
        'July': 7,
        'August': 8,
        'September': 9,
        'October': 10,
        'November': 11,
        'December': 12
    }
    salaries = sorted(
        salaries,
        key=lambda sal: (
            sal.year or 0,
            month_order.get(sal.month, 0),
            sal.id or 0
        ),
        reverse=True
    )

    result = []
    for sal in salaries:
        result.append({
            'id': sal.id,
            'month': sal.month,
            'year': sal.year,
            'base': sal.base_salary,
            'incentives': sal.incentives,
            'deductions': sal.deductions,
            'net_pay': sal.net_pay,
            'status': sal.payment_status
        })
    return jsonify(result), 200
