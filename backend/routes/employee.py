from flask import Blueprint, request, jsonify
from backend.extensions import db
from backend.models import User, Attendance, Leave, Salary
from backend.utils.decorators import role_required
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date

employee_bp = Blueprint('employee', __name__)

# Personal attendance history
@employee_bp.route('/attendance', methods=['GET'])
@jwt_required()
def get_attendance():
    current_user_id = get_jwt_identity()
    attendances = Attendance.query.filter_by(user_id=current_user_id).order_by(Attendance.date.desc()).all()
    
    # Offset UTC to IST for display
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

# Daily clock-in
@employee_bp.route('/attendance/clock-in', methods=['POST'])
@jwt_required()
def clock_in():
    current_user_id = get_jwt_identity()
    today = date.today()
    
    # Block multiple clock-ins per day
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

# Daily clock-out and hour calculation
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
    
    # Calculate daily work duration
    duration = attendance.check_out_time - attendance.check_in_time
    attendance.total_hours = round(duration.total_seconds() / 3600, 2)
    
    db.session.commit()
    return jsonify({'message': 'Clocked out successfully', 'total_hours': attendance.total_hours}), 200

# View personal leave status
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

# Submit new leave request
@employee_bp.route('/leaves', methods=['POST'])
@jwt_required()
def apply_leave():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
        end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
        
        # Prevent logic errors in date range
        if end_date < start_date:
            return jsonify({'message': 'End date cannot be before start date'}), 400
        if start_date < date.today():
            return jsonify({'message': 'Past-date leave applications are not allowed'}), 400
        
        day_type = data.get('day_type', 'Full Day')
        
        # Calculate decimal days (including half-days)
        day_count = (end_date - start_date).days + 1
        if day_type in ('First Half', 'Second Half'):
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

# List of all past salary payments
@employee_bp.route('/salary', methods=['GET'])
@jwt_required()
def get_salary():
    current_user_id = get_jwt_identity()
    salaries = Salary.query.filter_by(user_id=current_user_id).all()
    
    # Sort months correctly (chrono)
    month_order = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
        'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
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
            'status': sal.payment_status,
            'total_salary': sal.total_salary,
            'basic_salary': sal.basic_salary,
            'hra': sal.hra,
            'conveyance_allowance': sal.conveyance_allowance,
            'special_allowance': sal.special_allowance,
            'gross_earnings': sal.gross_earnings,
            'final_offer_closed': sal.final_offer_closed,
            'commission_per_closure': sal.commission_per_closure,
            'working_days': sal.working_days,
            'present_days': sal.present_days,
            'leaves_taken': sal.leaves_taken,
            'leave_deduction': sal.leave_deduction,
            'other_deductions': sal.other_deductions,
            'gross_deductions': sal.gross_deductions
        })
    return jsonify(result), 200

# Get detailed mapping for frontend payslip generation
@employee_bp.route('/salary-slip/<int:salary_id>', methods=['GET'])
@jwt_required()
def get_salary_slip(salary_id):
    current_user_id = get_jwt_identity()
    sal = Salary.query.get_or_404(salary_id)

    # Permission check: own payslip or admin access
    if str(sal.user_id) != str(current_user_id):
        current_user = User.query.get(int(current_user_id))
        if not current_user or current_user.role not in ['Admin', 'Manager']:
            return jsonify({'message': 'Unauthorized'}), 403

    emp = sal.employee

    # Fallback for display date
    join_date_str = None
    if emp.join_date:
        join_date_str = emp.join_date.strftime('%d-%b-%Y')
    elif emp.created_at:
        join_date_str = emp.created_at.strftime('%d-%b-%Y')

    # Security: mask sensitive bank info
    bank_display = ''
    if emp.bank_account_number:
        bank_display = 'XXXX' + emp.bank_account_number[-4:] if len(emp.bank_account_number) >= 4 else emp.bank_account_number

    # Convert amount to words for formal documents
    def amount_in_words(amount):
        if amount is None or amount == 0:
            return 'Zero Rupees Only'
        ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
                'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
                'Seventeen', 'Eighteen', 'Nineteen']
        tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

        def two_digits(n):
            if n < 20:
                return ones[n]
            return tens[n // 10] + (' ' + ones[n % 10] if n % 10 else '')

        def three_digits(n):
            if n >= 100:
                return ones[n // 100] + ' Hundred' + (' and ' + two_digits(n % 100) if n % 100 else '')
            return two_digits(n)

        amt = int(round(abs(amount)))
        if amt == 0:
            return 'Zero Rupees Only'

        parts = []
        crore = amt // 10000000
        amt %= 10000000
        lakh = amt // 100000
        amt %= 100000
        thousand = amt // 1000
        amt %= 1000
        remainder = amt

        if crore:
            parts.append(three_digits(crore) + ' Crore')
        if lakh:
            parts.append(three_digits(lakh) + ' Lakh')
        if thousand:
            parts.append(three_digits(thousand) + ' Thousand')
        if remainder:
            parts.append(three_digits(remainder))

        return ' '.join(parts) + ' Rupees Only'

    # Package all data for the final slip
    slip_data = {
        'company': {
            'name': 'Eduitalent Pvt. Ltd.',
            'address': '2nd Floor, Business Park, Sector 62, Noida, India'
        },
        'payment_status': sal.payment_status or 'Pending',
        'payslip_month': f"{sal.month} {sal.year}",
        'employee': {
            'name': emp.full_name,
            'employee_id': emp.employee_id,
            'designation': emp.designation or '-',
            'department': emp.department or '-',
            'date_of_joining': join_date_str or '-',
            'pan': emp.pan_number or '-',
            'bank_account': bank_display or '-'
        },
        'earnings': {
            'total_salary': sal.total_salary or 0,
            'basic_salary': sal.basic_salary or 0,
            'hra': sal.hra or 0,
            'conveyance_allowance': sal.conveyance_allowance or 0,
            'special_allowance': sal.special_allowance or 0,
            'gross_earnings': sal.gross_earnings or 0
        },
        'incentive': {
            'final_offer_closed': sal.final_offer_closed or 0,
            'commission_per_closure': sal.commission_per_closure or 0,
            'total_incentive': sal.incentives or 0
        },
        'deductions_detail': {
            'leave_deduction': sal.leave_deduction or 0,
            'other_deductions': sal.other_deductions or 0,
            'gross_deductions': sal.gross_deductions or 0
        },
        'net_pay': sal.net_pay or 0,
        'net_pay_words': amount_in_words(sal.net_pay or 0),
        'attendance': {
            'working_days': sal.working_days or 0,
            'present_days': sal.present_days or 0,
            'leaves_taken': sal.leaves_taken or 0
        }
    }

    return jsonify(slip_data), 200
