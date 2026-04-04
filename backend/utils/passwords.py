import re


COMMON_WEAK_PASSWORDS = {
    'password', 'password1', 'password1!', 'password123', 'password123!',
    '12345678', '123456789', '1234567890', '12345678!', 'qwerty123',
    'qwertyui', 'qwerty123!', 'letmein01', 'welcome1!', 'admin123',
    'admin123!', 'abc12345', 'abcd1234', 'abcd1234!', 'iloveyou1',
    'monkey123', 'dragon123', 'master123', 'trustno1', 'trustno1!',
    'sunshine1', 'sunshine1!', 'princess1', 'football1', 'charlie1',
    'shadow123', 'shadow123!', 'michael1', 'jessica1', 'password!',
    '!qaz2wsx', 'zaq1@wsx', 'passw0rd', 'passw0rd!', 'p@ssw0rd',
    'p@ssword1', 'p@ssword!', 'changeme1', 'changeme!', 'welcome1',
    'letmein1!', 'superman1', 'batman123', 'access123', 'hello123!',
}


def validate_password(password, username='', email=''):
    errors = []

    if not password or len(password) < 8:
        errors.append('Password must be at least 8 characters long')
    if not re.search(r'[A-Z]', password or ''):
        errors.append('Password must contain at least 1 uppercase letter')
    if not re.search(r'[a-z]', password or ''):
        errors.append('Password must contain at least 1 lowercase letter')
    if not re.search(r'[0-9]', password or ''):
        errors.append('Password must contain at least 1 number')
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:\'",.<>?/`~\\]', password or ''):
        errors.append('Password must contain at least 1 special character')

    if username and username.lower() in (password or '').lower():
        errors.append('Password must not contain your username')
    if email:
        email_local = email.split('@')[0].lower()
        if len(email_local) >= 3 and email_local in (password or '').lower():
            errors.append('Password must not contain your email')

    if (password or '').lower() in COMMON_WEAK_PASSWORDS:
        errors.append('This password is too common. Please choose a stronger password')

    return (len(errors) == 0, errors)
