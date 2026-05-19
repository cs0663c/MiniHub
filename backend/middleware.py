from functools import wraps
from flask import request, jsonify, g
from auth import verify_token
from database import get_db

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': '缺少认证令牌'}), 401

        token = auth_header[7:]
        try:
            payload = verify_token(token)
        except Exception:
            return jsonify({'error': '令牌无效或已过期'}), 401

        db = get_db()
        user = db.execute(
            "SELECT id, email, is_admin FROM users WHERE id = ?",
            (payload['sub'],)
        ).fetchone()

        if not user:
            return jsonify({'error': '用户不存在'}), 401

        g.user = dict(user)
        g.token_jti = payload.get('jti')
        return f(*args, **kwargs)
    return decorated
