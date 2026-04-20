from .extensions import db
from datetime import datetime

# Core user model - handles all roles
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.String(50), unique=True, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(50), nullable=False) 
    full_name = db.Column(db.String(100))
    
    # Profile details
    profile_picture = db.Column(db.String(200))
    department = db.Column(db.String(100))
    assigned_manager_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    assigned_team = db.Column(db.String(100))
    employee_status = db.Column(db.String(50), default='Active') # Active, Terminated, Resigned
    
    # Permissions and verification
    is_verified = db.Column(db.Boolean, default=True, nullable=False)
    verification_status = db.Column(db.String(20), default='Approved', nullable=False)
    
    # Personal info
    join_date = db.Column(db.Date)
    phone_number = db.Column(db.String(20))
    alternate_phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    notes = db.Column(db.Text)

    # Statutory and payroll details
    designation = db.Column(db.String(100))
    pan_number = db.Column(db.String(20))
    bank_account_number = db.Column(db.String(30))
    date_of_birth = db.Column(db.Date)
    branch_location = db.Column(db.String(100))
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    login_history = db.relationship('LoginHistory', backref='user', lazy=True, cascade="all, delete-orphan")
    managed_employees = db.relationship('User', backref=db.backref('manager', remote_side=[id]))
    attendances = db.relationship('Attendance', backref='employee', lazy=True, cascade="all, delete-orphan")
    
    # Explicit keys needed because User points to multiple things
    leaves = db.relationship('Leave', foreign_keys='Leave.user_id', backref='employee', lazy=True, cascade="all, delete-orphan")
    salaries = db.relationship('Salary', backref='employee', lazy=True, cascade="all, delete-orphan")
    
    job_requirements = db.relationship('JobRequirement', backref='assigned_recruiter', lazy=True, cascade="all, delete-orphan")
    candidates_sourced = db.relationship('Candidate', backref='sourced_by_user', lazy=True, cascade="all, delete-orphan")
    daily_logs = db.relationship('DailyLog', backref='employee_log', lazy=True, cascade="all, delete-orphan")
    
    sales_leads = db.relationship('SalesLead', backref='owner', lazy=True, cascade="all, delete-orphan")

    # Generate custom employee ID based on LOC, NAME, JOIN_DATE, JOIN_YEAR, BIRTH_DATE
    def generate_employee_id(self):
        # 1. LOC: First 3 letters of location (uppercase)
        loc = (self.branch_location or 'GEN').strip()[:3].upper()
        if not loc: loc = 'GEN'
        while len(loc) < 3: loc += 'X' # Pad safely
        
        # 2. NAME: First letter of first name + First letter of last name (uppercase)
        name_parts = (self.full_name or 'N A').strip().split()
        if len(name_parts) >= 2:
            name_code = (name_parts[0][0] + name_parts[-1][0]).upper()
        else:
            first_name = name_parts[0] if name_parts else 'NA'
            name_code = first_name[:2].upper()
        while len(name_code) < 2: name_code += 'X' # Pad safely
        
        # 3. JOIN_DATE & JOIN_YEAR
        if self.join_date:
            j_day = str(self.join_date.day).zfill(2)
            j_year = str(self.join_date.year)[-2:]
        elif self.created_at:
            j_day = str(self.created_at.day).zfill(2)
            j_year = str(self.created_at.year)[-2:]
        else:
            j_day = '00'
            j_year = '00'
            
        # 4. BIRTH_DATE
        dob_day = str(self.date_of_birth.day).zfill(2) if self.date_of_birth else '00'
        
        base_id = f"{loc}{name_code}{j_day}{j_year}{dob_day}"
        
        # 5. DUPLICATE HANDLING
        # Check database for IDs starting with this base
        existing_ids = User.query.filter(User.employee_id.like(f"{base_id}%")).all()
        if not existing_ids:
            return base_id
            
        # Extract suffixes and find highest
        max_suffix = 0
        for emp in existing_ids:
            if emp.employee_id == base_id:
                continue
            if '-' in emp.employee_id:
                try:
                    suffix = int(emp.employee_id.split('-')[-1])
                    if suffix > max_suffix:
                        max_suffix = suffix
                except (ValueError, IndexError):
                    continue
        
        new_suffix = str(max_suffix + 1).zfill(2)
        return f"{base_id}-{new_suffix}"

# Audit log for login sessions
class LoginHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(200))

# Daily attendance tracking
class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    check_in_time = db.Column(db.DateTime)
    check_out_time = db.Column(db.DateTime)
    status = db.Column(db.String(20))
    total_hours = db.Column(db.Float, default=0.0)

# Leave requests and approvals
class Leave(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    leave_type = db.Column(db.String(50))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_days = db.Column(db.Float)
    reason = db.Column(db.Text)
    day_type = db.Column(db.String(20), default='Full Day')
    status = db.Column(db.String(20), default='Pending') # Pending, Approved, Rejected
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime)

# Monthly payroll records
class Salary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    month = db.Column(db.String(20))
    year = db.Column(db.Integer)
    base_salary = db.Column(db.Float)
    incentives = db.Column(db.Float, default=0.0)
    deductions = db.Column(db.Float, default=0.0)
    net_pay = db.Column(db.Float)
    payment_status = db.Column(db.String(20), default='Pending')

    # Salary breakdown components
    total_salary = db.Column(db.Float, default=0.0)
    basic_salary = db.Column(db.Float, default=0.0)
    hra = db.Column(db.Float, default=0.0)
    conveyance_allowance = db.Column(db.Float, default=0.0)
    special_allowance = db.Column(db.Float, default=0.0)
    gross_earnings = db.Column(db.Float, default=0.0)

    # Recruiter specific incentive data
    final_offer_closed = db.Column(db.Integer, default=0)
    commission_per_closure = db.Column(db.Float, default=0.0)

    # Attendance/Leave adjustments
    working_days = db.Column(db.Integer, default=26)
    present_days = db.Column(db.Integer, default=26)
    leaves_taken = db.Column(db.Float, default=0.0)
    leave_deduction = db.Column(db.Float, default=0.0)
    other_deductions = db.Column(db.Float, default=0.0)
    gross_deductions = db.Column(db.Float, default=0.0)

# Job requirements (JDs) for clients
class JobRequirement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recruiter_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    client_company = db.Column(db.String(100))
    role_title = db.Column(db.String(100))
    location = db.Column(db.String(100))
    positions_count = db.Column(db.Integer)
    jd_file_path = db.Column(db.String(200))
    status = db.Column(db.String(20), default='Open') # Open, On Hold, Closed, Canceled
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    candidates = db.relationship('Candidate', backref='job_requirement', lazy=True, cascade="all, delete-orphan")

# Sourced candidates for recruitment
class Candidate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sourced_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    location = db.Column(db.String(100))
    company_name = db.Column(db.String(100))
    profile_name = db.Column(db.String(100))
    qualification = db.Column(db.String(100))
    total_experience = db.Column(db.Float)
    relevant_experience = db.Column(db.Float)
    current_ctc = db.Column(db.Float)
    expected_ctc = db.Column(db.Float)
    in_hand_salary = db.Column(db.Float)
    notice_period = db.Column(db.String(50))
    resume_file_path = db.Column(db.String(200))
    status = db.Column(db.String(50), default='Available')
    job_requirement_id = db.Column(db.Integer, db.ForeignKey('job_requirement.id'))

# Sales pipeline leads
class SalesLead(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    client_company = db.Column(db.String(100))
    contact_person = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    location = db.Column(db.String(100))
    website = db.Column(db.String(200))
    social_links = db.Column(db.Text)
    spoc_details = db.Column(db.Text)
    status = db.Column(db.String(20), default='New') # New, Follow-up, Converted, Lost
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    follow_ups = db.relationship('FollowUp', backref='lead', lazy=True, cascade="all, delete-orphan")

# Follow-up logs for sales leads
class FollowUp(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('sales_lead.id'), nullable=False)
    scheduled_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='Pending') # Pending, Completed

# Daily activity log for recruiters
class DailyLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    profiles_sourced = db.Column(db.Integer, default=0)
    profiles_shared = db.Column(db.Integer, default=0)
    comments = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
