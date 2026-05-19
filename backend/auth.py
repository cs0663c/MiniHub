import uuid
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from config import Config

def hash_password(plaintext):
    return bcrypt.hashpw(
        plaintext.encode('utf-8'),
        bcrypt.gensalt(Config.BCRYPT_ROUNDS)
    ).decode('utf-8')

def check_password(plaintext, hashed):
    return bcrypt.checkpw(plaintext.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id, email, is_admin):
    now = datetime.now(timezone.utc)
    payload = {
        'sub': user_id,
        'email': email,
        'is_admin': is_admin,
        'jti': str(uuid.uuid4()),
        'iat': now,
        'exp': now + timedelta(hours=Config.JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

def verify_token(token):
    return jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
