from flask import Flask, send_from_directory
from .config import Config
from .extensions import db, jwt, cors, migrate
from sqlalchemy import text

# SQLite doesn't support easy migrations, so we verify columns on startup
def ensure_leave_columns(app):
    with app.app_context():
        if db.engine.dialect.name != 'sqlite':
            return

        columns = {
            row[1]
            for row in db.session.execute(text("PRAGMA table_info('leave')")).fetchall()
        }
        if 'applied_at' not in columns:
            db.session.execute(text("ALTER TABLE 'leave' ADD COLUMN applied_at DATETIME"))
        if 'approved_at' not in columns:
            db.session.execute(text("ALTER TABLE 'leave' ADD COLUMN approved_at DATETIME"))
        db.session.commit()

# Ensure mandatory verification columns exist in user table
def ensure_user_verification_columns(app):
    with app.app_context():
        if db.engine.dialect.name != 'sqlite':
            return

        columns = {
            row[1]
            for row in db.session.execute(text("PRAGMA table_info('user')")).fetchall()
        }
        if 'is_verified' not in columns:
            db.session.execute(text("ALTER TABLE 'user' ADD COLUMN is_verified BOOLEAN DEFAULT 1"))
            db.session.execute(text("UPDATE 'user' SET is_verified = 1 WHERE is_verified IS NULL"))
        if 'verification_status' not in columns:
            db.session.execute(text("ALTER TABLE 'user' ADD COLUMN verification_status VARCHAR(20) DEFAULT 'Approved'"))
            db.session.execute(text("UPDATE 'user' SET verification_status = 'Approved' WHERE verification_status IS NULL"))
        db.session.commit()

# Add missing employee info columns to user table
def ensure_user_extra_columns(app):
    with app.app_context():
        if db.engine.dialect.name != 'sqlite':
            return
        columns = {
            row[1]
            for row in db.session.execute(text("PRAGMA table_info('user')")).fetchall()
        }
        new_cols = {
            'designation': "VARCHAR(100)",
            'pan_number': "VARCHAR(20)",
            'bank_account_number': "VARCHAR(30)",
            'date_of_birth': "DATE",
            'branch_location': "VARCHAR(100)"
        }
        for col_name, col_type in new_cols.items():
            if col_name not in columns:
                db.session.execute(text(f"ALTER TABLE 'user' ADD COLUMN {col_name} {col_type}"))
        db.session.commit()

# Ensure employee_id column exists and is populated
def ensure_employee_id_column(app):
    from .models import User
    with app.app_context():
        if db.engine.dialect.name != 'sqlite':
            return
        columns = {
            row[1]
            for row in db.session.execute(text("PRAGMA table_info('user')")).fetchall()
        }
        if 'employee_id' not in columns:
            db.session.execute(text("ALTER TABLE 'user' ADD COLUMN employee_id VARCHAR(50)"))
            db.session.commit()
            
        # Populate IDs for existing users
        users = User.query.filter((User.employee_id == None) | (User.employee_id == '')).all()
        if users:
            for user in users:
                user.employee_id = user.generate_employee_id()
                db.session.add(user)
            db.session.commit()

# Add detailed payroll components to salary table
def ensure_salary_extra_columns(app):
    with app.app_context():
        if db.engine.dialect.name != 'sqlite':
            return
        columns = {
            row[1]
            for row in db.session.execute(text("PRAGMA table_info('salary')")).fetchall()
        }
        new_cols = {
            'total_salary': "FLOAT DEFAULT 0",
            'basic_salary': "FLOAT DEFAULT 0",
            'hra': "FLOAT DEFAULT 0",
            'conveyance_allowance': "FLOAT DEFAULT 0",
            'special_allowance': "FLOAT DEFAULT 0",
            'gross_earnings': "FLOAT DEFAULT 0",
            'final_offer_closed': "INTEGER DEFAULT 0",
            'commission_per_closure': "FLOAT DEFAULT 0",
            'working_days': "INTEGER DEFAULT 26",
            'present_days': "INTEGER DEFAULT 26",
            'leaves_taken': "FLOAT DEFAULT 0",
            'leave_deduction': "FLOAT DEFAULT 0",
            'other_deductions': "FLOAT DEFAULT 0",
            'gross_deductions': "FLOAT DEFAULT 0"
        }
        for col_name, col_type in new_cols.items():
            if col_name not in columns:
                db.session.execute(text(f"ALTER TABLE salary ADD COLUMN {col_name} {col_type}"))
        db.session.commit()

# Add default admin user if it doesn't exist
def seed_admin_user(app):
    from .models import User
    from werkzeug.security import generate_password_hash
    with app.app_context():
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@crm.com',
                password_hash=generate_password_hash('admin123'),
                role='Admin',
                full_name='System Admin',
                is_verified=True,
                verification_status='Approved'
            )
            admin.employee_id = admin.generate_employee_id()
            db.session.add(admin)
            db.session.commit()
            print("Default admin user seeded successfully.")

# Main app factory
def create_app(config_class=Config):
    import os
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    frontend_folder = os.path.join(project_root, 'frontend')
    app = Flask(__name__, static_folder=frontend_folder, static_url_path='')
    app.config.from_object(config_class)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    db.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)
    migrate.init_app(app, db)

    from .routes.auth import auth_bp
    from .routes.employee import employee_bp
    from .routes.recruitment import recruitment_bp
    from .routes.sales import sales_bp
    from .routes.admin import admin_bp
    from .routes.profile import profile_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(employee_bp, url_prefix='/api/employee')
    app.register_blueprint(recruitment_bp, url_prefix='/api/recruitment')
    app.register_blueprint(sales_bp, url_prefix='/api/sales')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')

    with app.app_context():
        db.create_all()
    
    # Run SQLite specific column checks
    ensure_leave_columns(app)
    ensure_user_verification_columns(app)
    ensure_user_extra_columns(app)
    ensure_employee_id_column(app)
    ensure_salary_extra_columns(app)
    seed_admin_user(app)

    @app.route('/')
    def index():
        return app.send_static_file('index.html')

    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    @app.route('/<path:path>')
    def serve_static(path):
        if os.path.exists(os.path.join(app.static_folder, path)):
            return app.send_static_file(path)

    @app.after_request
    def add_header(response):
        # Prevent caching issues during development
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
        return response

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=False)
