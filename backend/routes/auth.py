from flask import Blueprint, request, jsonify
from backend.extensions import db, jwt
from backend.models import User, LoginHistory
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from backend.utils.decorators import role_required
from backend.utils.passwords import validate_password
from datetime import datetime

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if User.query.filter_by(username=data.get('username')).first():
        return jsonify({'message': 'Username already exists'}), 400

    if User.query.filter_by(email=data.get('email')).first():
        return jsonify({'message': 'Email already exists'}), 400

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
        role=data.get('role', 'Employee'), 
        full_name=data.get('full_name'),
        password_hash=generate_password_hash(data.get('password')),
        is_verified=False,
        verification_status='Pending'
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User created successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()

    if user and check_password_hash(user.password_hash, data.get('password')):
        now = datetime.utcnow()
        user.last_login = now
        
        login_hist = LoginHistory(
            user_id=user.id,
            login_time=now,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent')[:200] if request.headers.get('User-Agent') else None
        )
        db.session.add(login_hist)
        db.session.commit()
    
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

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
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
