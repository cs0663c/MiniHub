import sqlite3
import os
from flask import g
from config import Config

def get_db():
    if 'db' not in g:
        db_path = Config.DATABASE
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        g.db = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db(app):
    db_path = Config.DATABASE
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")

    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            email         TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            is_admin      INTEGER NOT NULL DEFAULT 0,
            created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS user_data (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL UNIQUE,
            settings    TEXT,
            nav_items   TEXT,
            icon_cache  TEXT,
            updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)

    # 首次启动创建默认管理员
    cur = conn.execute("SELECT COUNT(*) FROM users")
    if cur.fetchone()[0] == 0:
        import bcrypt
        pw_hash = bcrypt.hashpw(
            Config.DEFAULT_ADMIN_PASSWORD.encode('utf-8'),
            bcrypt.gensalt(Config.BCRYPT_ROUNDS)
        ).decode('utf-8')
        conn.execute(
            "INSERT INTO users (email, password_hash, is_admin) VALUES (?, ?, 1)",
            (Config.DEFAULT_ADMIN_EMAIL, pw_hash)
        )
        user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.execute(
            "INSERT INTO user_data (user_id, settings, nav_items) VALUES (?, '{}', '[]')",
            (user_id,)
        )

    conn.commit()
    conn.close()

def init_db_for_app(app):
    with app.app_context():
        init_db(app)
