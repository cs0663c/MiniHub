import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'change-me-in-production')
    DATABASE = os.environ.get('DATABASE_PATH', '/data/minihub.db')
    JWT_EXPIRATION_HOURS = int(os.environ.get('JWT_EXPIRATION_HOURS', '168'))  # 7 days
    DISABLE_REGISTRATION = os.environ.get('DISABLE_REGISTRATION', 'false').lower() == 'true'
    BCRYPT_ROUNDS = 12
    DEFAULT_ADMIN_EMAIL = 'admin@localhost'
    DEFAULT_ADMIN_PASSWORD = 'admin'
