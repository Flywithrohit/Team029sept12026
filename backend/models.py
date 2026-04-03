from .extensions import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(50), nullable=False) 
    full_name = db.Column(db.String(100))
    
    profile_picture = db.Column(db.String(200))
    department = db.Column(db.String(100))
    assigned_manager_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    assigned_team = db.Column(db.String(100))
    employee_status = db.Column(db.String(50), default='Active')
    is_verified = db.Column(db.Boolean, default=True, nullable=False)
    verification_status = db.Column(db.String(20), default='Approved', nullable=False)
    join_date = db.Column(db.Date)
    phone_number = db.Column(db.String(20))
    alternate_phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    login_history = db.relationship('LoginHistory', backref='user', lazy=True, cascade="all, delete-orphan")
    managed_employees = db.relationship('User', backref=db.backref('manager', remote_side=[id]))
    attendances = db.relationship('Attendance', backref='employee', lazy=True, cascade="all, delete-orphan")
    # Leave points back to User twice, so SQLAlchemy needs the employee side spelled out.
    leaves = db.relationship('Leave', foreign_keys='Leave.user_id', backref='employee', lazy=True, cascade="all, delete-orphan")
    salaries = db.relationship('Salary', backref='employee', lazy=True, cascade="all, delete-orphan")
    
    job_requirements = db.relationship('JobRequirement', backref='assigned_recruiter', lazy=True, cascade="all, delete-orphan")
    candidates_sourced = db.relationship('Candidate', backref='sourced_by_user', lazy=True, cascade="all, delete-orphan")
    daily_logs = db.relationship('DailyLog', backref='employee_log', lazy=True, cascade="all, delete-orphan")
    
    sales_leads = db.relationship('SalesLead', backref='owner', lazy=True, cascade="all, delete-orphan")

class LoginHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    ip_address = db.Column(db.String(50))
    user_agent = db.Column(db.String(200))

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    check_in_time = db.Column(db.DateTime)
    check_out_time = db.Column(db.DateTime)
    status = db.Column(db.String(20))
    total_hours = db.Column(db.Float, default=0.0)

class Leave(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    leave_type = db.Column(db.String(50))
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    total_days = db.Column(db.Float)
    reason = db.Column(db.Text)
    day_type = db.Column(db.String(20), default='Full Day')
    status = db.Column(db.String(20), default='Pending')
    approved_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at = db.Column(db.DateTime)

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

class JobRequirement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recruiter_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    client_company = db.Column(db.String(100))
    role_title = db.Column(db.String(100))
    location = db.Column(db.String(100))
    positions_count = db.Column(db.Integer)
    jd_file_path = db.Column(db.String(200))
    status = db.Column(db.String(20), default='Open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    candidates = db.relationship('Candidate', backref='job_requirement', lazy=True, cascade="all, delete-orphan")

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
    status = db.Column(db.String(20), default='New')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    follow_ups = db.relationship('FollowUp', backref='lead', lazy=True, cascade="all, delete-orphan")

class FollowUp(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('sales_lead.id'), nullable=False)
    scheduled_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    status = db.Column(db.String(20), default='Pending')

class DailyLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    profiles_sourced = db.Column(db.Integer, default=0)
    profiles_shared = db.Column(db.Integer, default=0)
    comments = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
