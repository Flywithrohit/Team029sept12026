import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Key for session and CSRF security
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-key-change-in-production'
    
    # DB connection - defaults to local sqlite for dev
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///crm.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT security key
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-super-secret-key'
    
    # JWT expiration - set to long duration (handled by browser session cookie bridge)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=365)
    
    # Storage for JDs and Resumes
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
