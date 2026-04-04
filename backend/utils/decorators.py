from functools import wraps
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from backend.models import User

def role_required(roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            
            if not user:
                return {'message': 'User not found'}, 404

            if not user.is_verified:
                return {'message': 'Your account is pending admin verification'}, 403

            if user.role not in roles:
                return {'message': 'Access forbidden: Insufficient permissions'}, 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper
