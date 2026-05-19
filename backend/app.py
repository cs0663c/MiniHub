import os
import sys
from flask import Flask, send_from_directory

# 确保 backend 目录在 Python 路径中
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import Config
from database import init_db, close_db


def create_app():
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)

    # 数据库初始化和清理
    with app.app_context():
        init_db(app)
    app.teardown_appcontext(close_db)

    # 注册 API 蓝图
    from routes.auth_routes import auth_bp
    from routes.data_routes import data_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(data_bp, url_prefix='/api/data')

    # 静态文件路径：frontend/ 目录
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_spa(path):
        if path and os.path.exists(os.path.join(frontend_dir, path)):
            return send_from_directory(frontend_dir, path)
        return send_from_directory(frontend_dir, 'index.html')

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
