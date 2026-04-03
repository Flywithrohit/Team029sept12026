from flask import Flask, send_from_directory
from .config import Config
from .extensions import db, jwt, cors, migrate
from sqlalchemy import text


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
    ensure_leave_columns(app)
    ensure_user_verification_columns(app)

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
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '-1'
        return response

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=False)
