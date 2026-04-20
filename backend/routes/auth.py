from flask import Blueprint, request, jsonify
from backend.extensions import db, jwt
from backend.models import User, LoginHistory
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from backend.utils.decorators import role_required
from backend.utils.passwords import validate_password
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

# Register a new user account
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Verify username/email aren't already in use
    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({'message': 'Username already exists'}), 400

    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'Email already exists'}), 400

    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    # Simple password matching check
    if password != confirm_password:
        return jsonify({'message': 'Passwords do not match'}), 400

    # Enforce password complexity rules
    is_valid, errors = validate_password(password, data.get('username', ''), data.get('email', ''))
    if not is_valid:
        return jsonify({'message': errors[0], 'errors': errors}), 400

    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        role=data.get('role', 'Employee'), 
        full_name=data.get('full_name'),
        password_hash=generate_password_hash(data.get('password')),
        # New accounts start as unverified until an admin approves them
        is_verified=False,
        verification_status='Pending'
    )

    # Generate and store custom employee ID
    new_user.employee_id = new_user.generate_employee_id()

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User created successfully'}), 201

# User login and token generation
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()

    # Check hashed password
    if user and check_password_hash(user.password_hash, data.get('password')):
        now = datetime.utcnow()
        user.last_login = now
        
        # Log login session details for auditing
        login_hist = LoginHistory(
            user_id=user.id,
            login_time=now,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')[:200] if request.headers.get('User-Agent') else None
        )
        db.session.add(login_hist)
        db.session.commit()
    
        # Create stateless JWT token
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.role,
                'full_name': user.full_name,
                'profile_picture': user.profile_picture,
                'is_verified': user.is_verified,
                'verification_status': user.verification_status
            }
        }), 200

    return jsonify({'message': 'Invalid credentials'}), 401

# Get info for the currently logged-in user
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Handle case where token is valid but user record was deleted
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'full_name': user.full_name,
        'profile_picture': user.profile_picture,
        'is_verified': user.is_verified,
        'verification_status': user.verification_status
    }), 200
