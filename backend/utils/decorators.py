from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from backend.models import User

# Restrict access to specific roles (e.g., Admin only)
def role_required(roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            # Verify JWT exists in current request
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            # Stop if user doesn't exist anymore
            if not user:
                return {'message': 'User not found'}, 404

            # Don't allow unverified self-signups to access APIs
            if not user.is_verified:
                return {'message': 'Your account is pending admin verification'}, 403

            # Check if user role matches one of the allowed roles
            if user.role not in roles:
                return {'message': 'Access forbidden: Insufficient permissions'}, 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper
