import json
from flask import Blueprint, request, jsonify, g
from database import get_db
from middleware import require_auth

data_bp = Blueprint('data', __name__)


def _get_user_data(user_id):
    db = get_db()
    row = db.execute(
        "SELECT settings, nav_items, icon_cache FROM user_data WHERE user_id = ?",
        (user_id,)
    ).fetchone()
    return row


def _ensure_user_data(user_id):
    db = get_db()
    db.execute(
        "INSERT OR IGNORE INTO user_data (user_id, settings, nav_items) VALUES (?, '{}', '[]')",
        (user_id,)
    )


@data_bp.route('/settings', methods=['GET'])
@require_auth
def get_settings():
    _ensure_user_data(g.user['id'])
    row = _get_user_data(g.user['id'])
    return jsonify({
        'settings': json.loads(row['settings'] or '{}'),
        'navItems': json.loads(row['nav_items'] or '[]'),
        'iconCache': json.loads(row['icon_cache'] or 'null')
    })


@data_bp.route('/settings', methods=['PUT'])
@require_auth
def update_settings():
    data = request.get_json(silent=True) or {}
    settings = data.get('settings', {})

    _ensure_user_data(g.user['id'])
    db = get_db()
    db.execute(
        "UPDATE user_data SET settings = ?, updated_at = datetime('now') WHERE user_id = ?",
        (json.dumps(settings, ensure_ascii=False), g.user['id'])
    )
    db.commit()
    return jsonify({'ok': True, 'settings': settings})


@data_bp.route('/navitems', methods=['PUT'])
@require_auth
def update_navitems():
    data = request.get_json(silent=True) or {}
    nav_items = data.get('navItems', [])

    _ensure_user_data(g.user['id'])
    db = get_db()
    db.execute(
        "UPDATE user_data SET nav_items = ?, updated_at = datetime('now') WHERE user_id = ?",
        (json.dumps(nav_items, ensure_ascii=False), g.user['id'])
    )
    db.commit()
    return jsonify({'ok': True, 'navItems': nav_items})


@data_bp.route('/save-all', methods=['PUT'])
@require_auth
def save_all():
    data = request.get_json(silent=True) or {}
    settings = data.get('settings')
    nav_items = data.get('navItems')

    if settings is None and nav_items is None:
        return jsonify({'error': '无数据可保存'}), 400

    _ensure_user_data(g.user['id'])
    db = get_db()

    if settings is not None:
        db.execute(
            "UPDATE user_data SET settings = ? WHERE user_id = ?",
            (json.dumps(settings, ensure_ascii=False), g.user['id'])
        )
    if nav_items is not None:
        db.execute(
            "UPDATE user_data SET nav_items = ? WHERE user_id = ?",
            (json.dumps(nav_items, ensure_ascii=False), g.user['id'])
        )

    db.execute(
        "UPDATE user_data SET updated_at = datetime('now') WHERE user_id = ?",
        (g.user['id'],)
    )
    db.commit()
    return jsonify({'ok': True})


@data_bp.route('/icon-cache', methods=['PUT'])
@require_auth
def update_icon_cache():
    data = request.get_json(silent=True) or {}
    icon_cache = data.get('iconCache')

    _ensure_user_data(g.user['id'])
    db = get_db()
    db.execute(
        "UPDATE user_data SET icon_cache = ?, updated_at = datetime('now') WHERE user_id = ?",
        (json.dumps(icon_cache, ensure_ascii=False) if icon_cache else None, g.user['id'])
    )
    db.commit()
    return jsonify({'ok': True})


@data_bp.route('/import', methods=['POST'])
@require_auth
def import_data():
    data = request.get_json(silent=True) or {}
    settings = data.get('settings')
    nav_items = data.get('navItems')
    icon_cache = data.get('iconCache')

    _ensure_user_data(g.user['id'])
    db = get_db()
    db.execute(
        "UPDATE user_data SET settings = ?, nav_items = ?, icon_cache = ?, updated_at = datetime('now') WHERE user_id = ?",
        (
            json.dumps(settings, ensure_ascii=False) if settings else '{}',
            json.dumps(nav_items, ensure_ascii=False) if nav_items else '[]',
            json.dumps(icon_cache, ensure_ascii=False) if icon_cache else None,
            g.user['id']
        )
    )
    db.commit()
    return jsonify({'ok': True})
