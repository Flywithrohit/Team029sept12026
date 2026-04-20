from flask import Blueprint, request, jsonify, current_app, send_from_directory
from backend.extensions import db
from backend.models import User
from datetime import datetime
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from backend.utils.passwords import validate_password
import os
import uuid

profile_bp = Blueprint('profile', __name__)

# Fetch profile details for any user (with permission check)
@profile_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_profile(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'message': 'User not found'}), 404
        
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'message': 'Target user not found'}), 404
        
    # Serialize to JSON format for frontend
    return jsonify(_serialize_profile(target_user))

# Quick access for current user's own profile
@profile_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(_serialize_profile(user))

# Update profile based on role-based permission tiers
@profile_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_profile(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    target_user = User.query.get(user_id)
    
    if not target_user:
        return jsonify({'message': 'Target user not found'}), 404
        
    data = request.get_json()

    # Prevent ID/Email collisions during update
    def username_taken(username):
        existing = User.query.filter_by(username=username).first()
        return existing and existing.id != target_user.id

    def email_taken(email):
        existing = User.query.filter_by(email=email).first()
        return existing and existing.id != target_user.id
    
    # Tier 1: User updating their own basic profile info
    if current_user.id == target_user.id:
        if 'username' in data and data['username'] != target_user.username:
            if username_taken(data['username']):
                return jsonify({'message': 'Username already exists'}), 400
            target_user.username = data['username']
        if 'full_name' in data: target_user.full_name = data['full_name']
        if 'email' in data and data['email'] != target_user.email:
            if email_taken(data['email']):
                return jsonify({'message': 'Email already exists'}), 400
            target_user.email = data['email']
        
        # Identity and contact fields
        if 'phone_number' in data: target_user.phone_number = data['phone_number']
        if 'alternate_phone' in data: target_user.alternate_phone = data['alternate_phone']
        if 'address' in data: target_user.address = data['address']
        if 'profile_picture' in data: target_user.profile_picture = data['profile_picture']
        
        # Password change flow with legacy verification
        if 'password' in data and data['password']:
            current_password = data.get('current_password', '')
            if not current_password:
                return jsonify({'message': 'Current password is required'}), 400
            if not check_password_hash(target_user.password_hash, current_password):
                return jsonify({'message': 'Current password is incorrect'}), 400
            confirm_password = data.get('confirm_password', '')
            if data['password'] != confirm_password:
                return jsonify({'message': 'Passwords do not match'}), 400
            is_valid, errors = validate_password(data['password'], target_user.username, target_user.email)
            if not is_valid:
                return jsonify({'message': errors[0], 'errors': errors}), 400
            target_user.password_hash = generate_password_hash(data['password'])
            
    # Tier 2: Manager updating employee payroll and dept info
    elif current_user.role == 'Manager':
        if 'department' in data: target_user.department = data['department']
        if 'assigned_team' in data: target_user.assigned_team = data['assigned_team']
        if 'notes' in data: target_user.notes = data['notes']
        if 'employee_status' in data: target_user.employee_status = data['employee_status']
        if 'designation' in data: target_user.designation = data['designation']
        if 'pan_number' in data: target_user.pan_number = data['pan_number']
        if 'bank_account_number' in data: target_user.bank_account_number = data['bank_account_number']
        if 'branch_location' in data: target_user.branch_location = data['branch_location']
        
        # Parse standard date formats from frontend
        if 'join_date' in data and data['join_date']:
            try:
                target_user.join_date = datetime.strptime(data['join_date'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass
        if 'date_of_birth' in data and data['date_of_birth']:
            try:
                target_user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass

    # Tier 3: Admin override for system level fields (Role, Management)
    elif current_user.role == 'Admin':
        if 'username' in data and data['username'] != target_user.username:
            if username_taken(data['username']):
                return jsonify({'message': 'Username already exists'}), 400
            target_user.username = data['username']
        if 'full_name' in data: target_user.full_name = data['full_name']
        if 'email' in data and data['email'] != target_user.email:
            if email_taken(data['email']):
                return jsonify({'message': 'Email already exists'}), 400
            target_user.email = data['email']
        if 'role' in data:
            target_user.role = data['role']
            
        # Full organizational data control for admins
        if 'department' in data: target_user.department = data['department']
        if 'assigned_team' in data: target_user.assigned_team = data['assigned_team']
        if 'employee_status' in data: target_user.employee_status = data['employee_status']
        if 'phone_number' in data: target_user.phone_number = data['phone_number']
        if 'alternate_phone' in data: target_user.alternate_phone = data['alternate_phone']
        if 'address' in data: target_user.address = data['address']
        if 'notes' in data: target_user.notes = data['notes']
        if 'assigned_manager_id' in data: target_user.assigned_manager_id = data['assigned_manager_id']
        if 'designation' in data: target_user.designation = data['designation']
        if 'pan_number' in data: target_user.pan_number = data['pan_number']
        if 'bank_account_number' in data: target_user.bank_account_number = data['bank_account_number']
        if 'branch_location' in data: target_user.branch_location = data['branch_location']
        
        if 'join_date' in data and data['join_date']:
            try:
                target_user.join_date = datetime.strptime(data['join_date'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass
        if 'date_of_birth' in data and data['date_of_birth']:
            try:
                target_user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except (ValueError, TypeError):
                pass
                
        # Admins can force reset passwords without knowing the old one
        if 'password' in data and data['password']:
            confirm_password = data.get('confirm_password', '')
            if data['password'] != confirm_password:
                return jsonify({'message': 'Passwords do not match'}), 400
            is_valid, errors = validate_password(data['password'], target_user.username, target_user.email)
            if not is_valid:
                return jsonify({'message': errors[0], 'errors': errors}), 400
            target_user.password_hash = generate_password_hash(data['password'])
    else:
        return jsonify({'message': 'Permission denied'}), 403

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully', 'user': _serialize_profile(target_user)}), 200

# Securely upload a new profile picture and return the path
@profile_bp.route('/<int:user_id>/upload_picture', methods=['POST'])
@jwt_required()
def upload_picture(user_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    target_user = User.query.get(user_id)
    
    if not target_user:
        return jsonify({'message': 'Target user not found'}), 404
        
    # Picture change restricted to owner or admin
    if current_user.id != target_user.id and current_user.role != 'Admin':
        return jsonify({'message': 'Permission denied'}), 403

    if 'profile_picture' not in request.files:
        return jsonify({'message': 'No file part'}), 400
        
    file = request.files['profile_picture']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
        
    if file:
        # Give file a unique UUID name to avoid overwriting others
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        # Save relative URL for frontend consumption
        target_user.profile_picture = f"/api/profile/uploads/{unique_filename}"
        db.session.commit()
        
        return jsonify({
            'message': 'Profile picture updated successfully',
            'profile_picture': target_user.profile_picture,
            'user': _serialize_profile(target_user)
        }), 200

# Helper to serve static uploads via the API
@profile_bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

# Shared helper to pack user model into a clean API response
def _serialize_profile(user):
    last_login_record = user.login_history[-1] if user.login_history else None
    last_login_time = user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else (last_login_record.login_time.strftime('%Y-%m-%d %H:%M:%S') if last_login_record else None)
    
    # Resolve manager's display name from ID
    manager_name = None
    if user.assigned_manager_id:
        manager = User.query.get(user.assigned_manager_id)
        if manager:
            manager_name = manager.full_name or manager.username

    # Formatting joining date
    join_date_str = None
    if user.join_date:
        join_date_str = user.join_date.strftime('%Y-%m-%d')
    elif user.created_at:
        join_date_str = user.created_at.strftime('%Y-%m-%d')

    dob_str = user.date_of_birth.strftime('%Y-%m-%d') if user.date_of_birth else None

    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'is_verified': user.is_verified,
        'verification_status': user.verification_status,
        'full_name': user.full_name,
        'profile_picture': user.profile_picture,
        'department': user.department,
        'assigned_manager_name': manager_name,
        'assigned_manager_id': user.assigned_manager_id,
        'assigned_team': user.assigned_team,
        'employee_status': user.employee_status,
        'join_date': join_date_str,
        'phone_number': user.phone_number,
        'alternate_phone': user.alternate_phone,
        'address': user.address,
        'created_at': user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else None,
        'last_login': last_login_time,
        'notes': user.notes,
        'designation': user.designation,
        'pan_number': user.pan_number,
        'date_of_birth': dob_str,
        'branch_location': user.branch_location,
        'employee_id': user.employee_id
    }
