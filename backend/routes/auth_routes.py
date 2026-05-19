from flask import Blueprint, request, jsonify, g
from database import get_db
from auth import hash_password, check_password, create_token
from middleware import require_auth
from config import Config

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    if Config.DISABLE_REGISTRATION:
        return jsonify({'error': '注册功能已关闭'}), 403

    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')

    if not email or '@' not in email:
        return jsonify({'error': '请输入有效的邮箱'}), 400
    if len(password) < 4:
        return jsonify({'error': '密码至少4位'}), 400

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        return jsonify({'error': '该邮箱已注册'}), 409

    pw_hash = hash_password(password)
    is_admin = 0
    cur = db.execute("SELECT COUNT(*) FROM users").fetchone()
    if cur[0] == 0:
        is_admin = 1

    db.execute(
        "INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, ?)",
        (email, pw_hash, is_admin)
    )
    user_id = db.execute("SELECT last_insert_rowid()").fetchone()[0]
    db.execute(
        "INSERT INTO user_data (user_id, settings, nav_items) VALUES (?, '{}', '[]')",
        (user_id,)
    )
    db.commit()

    token = create_token(user_id, email, bool(is_admin))
    return jsonify({'token': token, 'user': {'id': user_id, 'email': email, 'is_admin': bool(is_admin)}}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': '请输入邮箱和密码'}), 400

    db = get_db()
    user = db.execute(
        "SELECT id, email, password_hash, is_admin FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    if not user or not check_password(password, user['password_hash']):
        return jsonify({'error': '邮箱或密码错误'}), 401

    token = create_token(user['id'], user['email'], bool(user['is_admin']))
    return jsonify({
        'token': token,
        'user': {'id': user['id'], 'email': user['email'], 'is_admin': bool(user['is_admin'])}
    })


@auth_bp.route('/me', methods=['GET'])
@require_auth
def me():
    return jsonify({'user': g.user})


@auth_bp.route('/password', methods=['PUT'])
@require_auth
def change_password():
    data = request.get_json(silent=True) or {}
    old_pwd = data.get('old_password', '')
    new_pwd = data.get('new_password', '')

    if not old_pwd or not new_pwd:
        return jsonify({'error': '请提供当前密码和新密码'}), 400
    if len(new_pwd) < 4:
        return jsonify({'error': '新密码至少4位'}), 400

    db = get_db()
    user = db.execute(
        "SELECT password_hash FROM users WHERE id = ?",
        (g.user['id'],)
    ).fetchone()

    if not check_password(old_pwd, user['password_hash']):
        return jsonify({'error': '当前密码错误'}), 403

    new_hash = hash_password(new_pwd)
    db.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        (new_hash, g.user['id'])
    )
    db.commit()
    return jsonify({'ok': True})
