# MiniHub

简洁的个人导航起始页，支持内外网双栈切换、实时时钟、搜索引擎聚合、可编辑导航，以及基于 [HD-Icons](https://github.com/xushier/HD-Icons) 的图标库。

全栈架构：前端纯 HTML/CSS/JS + 后端 Python Flask + SQLite 数据库，支持多用户注册登录、JWT 认证、跨设备数据同步。

## ✨ 功能清单

### 首页仪表盘
- **实时时钟** — 显示当前时间（秒级更新）、日期与星期
- **搜索引擎聚合** — 百度 / Google / Bing 一键切换，回车搜索
- **快捷导航** — 6~8 列自适应网格布局，悬停显示完整 URL，点击新标签页打开
- **必应每日一图** — 自动拉取 Bing 每日壁纸作为背景，附带版权信息

### 内外网双栈
- **全局网络模式切换** — 页面顶部一键切换外网 / 内网模式
- **导航双地址** — 每个导航项可配置外网地址和内网地址（如域名 + IP）
- **智能切换** — 切换到内网模式时，有内网地址的导航自动使用内网 URL
- **视觉标识** — 配置了双地址的导航显示「双栈」或「内网」徽章

### 用户系统
- **多用户注册** — 邮箱 + 密码注册，支持关闭注册（单用户模式）
- **JWT 认证** — 登录后自动维护令牌，无需重复输入密码
- **跨设备同步** — 数据存储在服务端，换设备登录自动恢复
- **密码安全** — bcrypt 哈希存储，支持登录后修改密码
- **默认账号** — 首次启动自动创建 `admin@localhost` / `admin`

### 管理后台
- **页面设置** — 自定义主页标题、页脚文字
- **导航管理** — 增删改导航项，外网/内网双地址并排编辑
- **密码修改** — 内联表单修改密码（需当前密码）
- **数据导入** — 登录后自动检测并导入旧 localStorage 数据

### 图标选择器
- **HD-Icons 图标库** — 接入 [xushier/HD-Icons](https://github.com/xushier/HD-Icons) 仓库
- **搜索过滤** — 输入关键词实时筛选图标
- **风格切换** — 圆角矩形 / 圆形两种风格
- **分页加载** — 每次加载 120 个，避免卡顿
- **本地缓存** — 图标列表缓存 24 小时，服务端 + 客户端双层

### 安全设计
- URL 协议过滤，阻止 `javascript:`、`data:` 等危险协议
- DOM API 构建元素，防止 XSS 注入
- 密码 bcrypt 哈希，服务端验证
- JWT 令牌过期自动跳转登录

## 项目结构

```
MiniHub/
├── frontend/                    # 前端静态文件
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js               # API 通信层
│       └── app.js               # 核心逻辑
├── backend/                     # Flask 后端
│   ├── app.py                   # 入口 + SPA 静态文件服务
│   ├── config.py                # 配置
│   ├── database.py              # SQLite 连接与建表
│   ├── auth.py                  # bcrypt 哈希 + JWT
│   ├── middleware.py            # 认证装饰器
│   ├── routes/
│   │   ├── auth_routes.py       # 登录/注册/改密
│   │   └── data_routes.py       # 设置读写/数据导入
│   └── requirements.txt         # flask, pyjwt, bcrypt, gunicorn
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 使用方式

### 方式一：Docker 部署（推荐）

```bash
# 一行命令启动
docker run -d --name minihub -p 8080:8000 \
  -v minihub_data:/data \
  --restart unless-stopped \
  ghcr.io/cs0663c/minihub:latest

# 访问 http://localhost:8080
```

或使用 docker-compose：

```bash
git clone https://github.com/cs0663c/MiniHub.git
cd MiniHub
docker compose up -d
```

### 方式二：本地开发运行

```bash
git clone https://github.com/cs0663c/MiniHub.git
cd MiniHub
pip install -r backend/requirements.txt
python -c "from backend.app import create_app; create_app().run(debug=True)"
# 打开 http://localhost:5000
```

### 方式三：直接打开（离线模式）

直接用浏览器打开 `frontend/index.html`。离线模式下使用 localStorage 存储，功能完整但不同步。

## API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/auth/login` | 无 | 登录，返回 JWT |
| POST | `/api/auth/register` | 无 | 注册 |
| PUT  | `/api/auth/password` | JWT | 修改密码 |
| GET  | `/api/data/settings` | JWT | 获取全部用户数据 |
| PUT  | `/api/data/save-all` | JWT | 批量保存 settings + navItems |
| PUT  | `/api/data/settings` | JWT | 单独保存 settings |
| POST | `/api/data/import` | JWT | 导入 localStorage 旧数据 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `SECRET_KEY` | `change-me-in-production` | JWT 签名密钥，生产环境务必修改 |
| `DISABLE_REGISTRATION` | `false` | 设为 `true` 关闭注册（单用户模式） |
| `JWT_EXPIRATION_HOURS` | `168` | JWT 过期时间（小时），默认 7 天 |

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | HTML / CSS / JavaScript（零框架） |
| 后端 | Python 3 + Flask |
| 数据库 | SQLite（WAL 模式） |
| 认证 | bcrypt + JWT |
| 部署 | Python:3.12-alpine + gunicorn |
| 多平台 | `amd64` / `arm64` / `arm/v7` |
| 图标 | GitHub API + jsDelivr CDN |

## License

MIT
