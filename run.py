import sys

try:
    from backend.app import create_app
    from backend.extensions import db
    from backend.models import User
    from werkzeug.security import generate_password_hash
except ModuleNotFoundError as e:
    print("="*60)
    print(f"[!] ERROR: {e}")
    print("[!] It looks like your Python dependencies are not installed,")
    print("[!] or your virtual environment is not activated.")
    print("\n[+] To fix this automatically, please run:")
    print("    .\\start.bat")
    print("="*60)
    sys.exit(1)
import os

app = create_app()


def initialize_database():
    with app.app_context():
        instance_path = app.instance_path
        if not os.path.exists(instance_path):
            os.makedirs(instance_path)
            print(f"[+] Created instance folder at: {instance_path}")

        db.create_all()
        print("[+] Database initialized successfully")


def seed_admin(reset_password=False):
    with app.app_context():
        db.create_all()

        admin = User.query.filter_by(username='admin').first()
        if admin:
            if reset_password:
                admin.password_hash = generate_password_hash('admin123')
                db.session.commit()
                print("[+] Admin password reset")
                print("[*] Username: admin | Password: admin123")
            else:
                print("[*] Admin user already exists")
            return

        admin = User(
            username='admin',
            email='admin@crm.com',
            role='Admin',
            full_name='System Admin',
            password_hash=generate_password_hash('admin123'),
            department='Management',
            assigned_team='Core',
            employee_status='Active',
            phone_number='1234567890',
            address='123 Admin St, City, Country'
        )
        db.session.add(admin)
        db.session.commit()
        print("[+] Admin user created")
        print("[*] Username: admin | Password: admin123")


def main():
    command = sys.argv[1].lower() if len(sys.argv) > 1 else 'serve'

    if command == 'serve':
        initialize_database()
        seed_admin()
        app.run(debug=True)
        return

    if command == 'seed':
        initialize_database()
        seed_admin(reset_password='--reset-password' in sys.argv[2:])
        return

    print("Usage:")
    print("  python run.py")
    print("  python run.py serve")
    print("  python run.py seed [--reset-password]")
    sys.exit(1)

if __name__ == '__main__':
    main()
