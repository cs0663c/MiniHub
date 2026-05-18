# MiniHub

简洁的个人导航起始页，支持内外网切换、实时时钟、搜索引擎聚合、可编辑的快捷导航，以及基于 [HD-Icons](https://github.com/xushier/HD-Icons) 的图标库。

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

### 管理后台
- **密码保护** — SHA-256 哈希验证，首次使用设置密码
- **页面设置** — 自定义主页标题、页脚文字
- **导航管理** — 增删改导航项，支持外网/内网双地址配置
- **密码修改** — 内联表单修改密码，无需弹窗

### 图标选择器
- **HD-Icons 图标库** — 接入 [xushier/HD-Icons](https://github.com/xushier/HD-Icons) 仓库
- **搜索过滤** — 输入关键词实时筛选图标
- **风格切换** — 圆角矩形 / 圆形两种风格
- **分页加载** — 每次加载 120 个，避免卡顿
- **本地缓存** — 图标列表缓存 24 小时

### 安全设计
- URL 协议过滤，阻止 `javascript:`、`data:` 等危险协议
- DOM API 构建元素，防止 XSS 注入
- 密码 SHA-256 客户端哈希存储

## 项目结构

```
MiniHub/
├── index.html        # 页面结构
├── css/
│   └── style.css     # 样式表
├── js/
│   └── app.js        # 核心逻辑
└── README.md
```

## 使用方式

### 方式一：Docker 部署（推荐，直接拉取镜像）

```bash
# 无需克隆代码，直接拉取运行
docker run -d --name minihub -p 8080:80 --restart unless-stopped ghcr.io/cs0663c/minihub:latest

# 访问 http://localhost:8080
```

或使用 docker-compose：

```bash
git clone https://github.com/cs0663c/MiniHub.git
cd MiniHub
docker compose up -d
```

### 方式二：直接打开

直接用浏览器打开 `index.html` 即可使用。

### 方式三：静态服务器

部署到任意静态服务器（Nginx / Apache / GitHub Pages）。

<details>
<summary>手动 Docker 命令</summary>

```bash
# 构建镜像
docker build -t minihub:latest .

# 运行容器
docker run -d --name minihub -p 8080:80 --restart unless-stopped minihub:latest

# 查看日志
docker logs minihub

# 停止/启动/删除
docker stop minihub
docker start minihub
docker rm -f minihub
```
</details>

## 技术栈

- 纯 HTML / CSS / JavaScript
- 无框架依赖，零构建步骤
- 数据持久化：localStorage
- 图标来源：GitHub API + jsDelivr CDN

## License

MIT
