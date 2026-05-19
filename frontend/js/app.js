// ===== 数据 =====
var searchEngine = 'baidu';
var currentUser = null;  // { id, email, is_admin }

// 默认值（离线或未登录时使用）
var DEFAULT_NAV = [
  { name: 'GitHub',  url: 'https://github.com',              icon: '🐙', lanUrl: '' },
  { name: '百度',    url: 'https://baidu.com',               icon: '🔍', lanUrl: '' },
  { name: 'B站',     url: 'https://bilibili.com',            icon: '📺', lanUrl: '' },
  { name: '知乎',    url: 'https://zhihu.com',               icon: '💡', lanUrl: '' },
  { name: '掘金',    url: 'https://juejin.cn',               icon: '📰', lanUrl: '' },
  { name: 'V2EX',    url: 'https://v2ex.com',                icon: '💬', lanUrl: '' },
  { name: 'MDN',     url: 'https://developer.mozilla.org',   icon: '📘', lanUrl: '' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', icon: '📚', lanUrl: '' },
  { name: 'Gmail',   url: 'https://mail.google.com',         icon: '📧', lanUrl: '' },
  { name: 'YouTube', url: 'https://youtube.com',             icon: '🎬', lanUrl: '' },
];

var settings = JSON.parse(localStorage.getItem('siteSettings')) || {
  title: '我的导航页',
  footer: '我的导航页',
  networkMode: 'wan'
};

var navItems = DEFAULT_NAV.map(function(item) {
  return { name: item.name, url: item.url, icon: item.icon, lanUrl: item.lanUrl || '' };
});

// 服务端图标缓存（登录后填充）
var serverIconCache = null;

// ===== 初始化 =====
(function initApp() {
  if (API.isLoggedIn()) {
    // 从 token 解码用户信息（base64 中间段）
    try {
      var token = API.getToken();
      var payload = JSON.parse(atob(token.split('.')[1]));
      currentUser = { id: payload.sub, email: payload.email, is_admin: payload.is_admin };
    } catch(e) { currentUser = null; }
    loadUserData();
  } else {
    // 未登录：尝试从 localStorage 加载旧数据
    var rawNav = JSON.parse(localStorage.getItem('navItems'));
    if (rawNav) {
      rawNav.forEach(function(item) {
        if (item.lanUrl === undefined) item.lanUrl = '';
        delete item.isLan;
      });
      navItems = rawNav;
    }
    applySettings();
    renderNav();
  }
})();

function loadUserData() {
  API.getData().then(function(data) {
    if (data.settings && Object.keys(data.settings).length > 0) {
      // 合并服务端设置（保留客户端默认值作为兜底）
      settings.title = data.settings.title || settings.title;
      settings.footer = data.settings.footer || settings.footer;
      settings.networkMode = data.settings.networkMode || settings.networkMode;
    }
    if (data.navItems && data.navItems.length > 0) {
      navItems = data.navItems;
    }
    if (data.iconCache) {
      serverIconCache = data.iconCache;
    }
    applySettings();
    renderNav();
  }).catch(function(err) {
    console.error('加载服务器数据失败:', err);
    applySettings();
    renderNav();
  });
}

// ===== 安全工具 =====
function sanitizeUrl(url) {
  var u = String(url || '').trim();
  var lower = u.toLowerCase();
  if (lower.indexOf('javascript:') === 0) return '#';
  if (lower.indexOf('data:') === 0) return '#';
  if (lower.indexOf('vbscript:') === 0) return '#';
  return u;
}

function escapeHtml(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function createIconNode(icon) {
  if (icon && (icon.indexOf('http://') === 0 || icon.indexOf('https://') === 0)) {
    var img = document.createElement('img');
    img.src = encodeURI(sanitizeUrl(icon));
    img.alt = '';
    img.loading = 'lazy';
    return img;
  }
  return document.createTextNode(icon || '🔗');
}

function getEffectiveUrl(item) {
  if (settings.networkMode === 'lan' && item.lanUrl && item.lanUrl.trim()) {
    return item.lanUrl.trim();
  }
  return item.url;
}

// ===== 应用设置到页面 =====
function applySettings() {
  document.title = settings.title;
  document.getElementById('page-title').textContent = settings.title;
  document.getElementById('page-heading').textContent = settings.title;
  document.getElementById('footer-title').textContent = settings.footer;
  document.getElementById('footer-year').textContent = new Date().getFullYear();

  var cb = document.getElementById('netmode-cb');
  cb.checked = (settings.networkMode === 'lan');
  document.getElementById('netmode-text').textContent = settings.networkMode === 'lan' ? '内网' : '外网';
}

// ===== 网络模式切换 =====
function toggleNetworkMode() {
  var cb = document.getElementById('netmode-cb');
  settings.networkMode = cb.checked ? 'lan' : 'wan';
  document.getElementById('netmode-text').textContent = settings.networkMode === 'lan' ? '内网' : '外网';

  // 已登录则同步到服务器，否则回退 localStorage
  if (API.isLoggedIn()) {
    API.saveSettings(settings).catch(function() {});
  } else {
    localStorage.setItem('siteSettings', JSON.stringify(settings));
  }
  renderNav();
}

// ===== 时钟 =====
function updateClock() {
  var now = new Date();
  document.getElementById('time').textContent = now.toTimeString().slice(0, 8);
  document.getElementById('date').textContent =
    now.getFullYear() + '年' + (now.getMonth()+1) + '月' + now.getDate() + '日 ' +
    ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()];
}
updateClock();
setInterval(updateClock, 1000);

// ===== 搜索 =====
function setEngine(el) {
  document.querySelectorAll('.search-engine span').forEach(function(s) { s.classList.remove('active'); });
  el.classList.add('active');
  searchEngine = el.dataset.engine;
}

function doSearch() {
  var q = document.getElementById('search-input').value.trim();
  if (!q) return;
  var engines = {
    baidu: 'https://www.baidu.com/s?wd=' + encodeURIComponent(q),
    google: 'https://www.google.com/search?q=' + encodeURIComponent(q),
    bing: 'https://www.bing.com/search?q=' + encodeURIComponent(q),
  };
  window.open(engines[searchEngine], '_blank', 'noopener');
}

// ===== 导航渲染 =====
function renderNav() {
  var grid = document.getElementById('nav-grid');
  while (grid.firstChild) grid.removeChild(grid.firstChild);

  for (var i = 0; i < navItems.length; i++) {
    var item = navItems[i];
    var effUrl = sanitizeUrl(getEffectiveUrl(item));
    var hasLan = !!(item.lanUrl && item.lanUrl.trim());
    var isLanMode = settings.networkMode === 'lan';

    var a = document.createElement('a');
    a.className = 'nav-item';
    if (isLanMode && hasLan) a.classList.add('lan-active');
    a.href = effUrl;
    a.target = '_blank';
    a.rel = 'noopener';

    var iconDiv = document.createElement('div');
    iconDiv.className = 'nav-icon';
    iconDiv.appendChild(createIconNode(item.icon));
    a.appendChild(iconDiv);

    var nameSpan = document.createElement('span');
    nameSpan.className = 'nav-name';
    nameSpan.textContent = item.name;
    a.appendChild(nameSpan);

    var tip = document.createElement('span');
    tip.className = 'nav-url-tip';
    tip.textContent = effUrl;
    a.appendChild(tip);

    if (hasLan) {
      var badge = document.createElement('span');
      badge.className = 'nav-lan-badge';
      badge.textContent = isLanMode ? '内网' : '双栈';
      a.appendChild(badge);
    }

    grid.appendChild(a);
  }
}

// ===== 必应每日一图 =====
(function loadBingBg() {
  fetch('https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN')
    .then(function(resp) { return resp.json(); })
    .then(function(data) {
      if (data.images && data.images[0]) {
        document.body.style.backgroundImage = 'url(https://www.bing.com' + data.images[0].url + ')';
        var copy = data.images[0].copyright;
        if (copy) document.getElementById('copyright-info').textContent = copy;
      }
    })
    .catch(function() { /* CSS fallback */ });
})();

// ===== 弹窗控制 =====
function openAdminDialog() {
  document.getElementById('overlay').classList.add('show');
  document.getElementById('login-error').classList.remove('show');
  document.getElementById('pwd-input').value = '';
  var emailInput = document.getElementById('email-input');
  if (emailInput) emailInput.value = '';

  document.getElementById('login-form').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'none';

  if (API.isLoggedIn()) {
    // 已登录直接进管理面板
    showAdminPanel();
  } else {
    document.getElementById('login-msg').textContent = '请输入账号密码';
    // 隐藏注册表单
    hideRegisterForm();
    setTimeout(function() {
      var el = document.getElementById('email-input');
      if (el) el.focus();
    }, 150);
  }
}

function closeDialog() {
  document.getElementById('overlay').classList.remove('show');
}

// ===== 退出 =====
function doLogout() {
  API.logout();
  currentUser = null;
  closeDialog();
  // 清除内存数据，回到离线默认
  navItems = DEFAULT_NAV.map(function(item) {
    return { name: item.name, url: item.url, icon: item.icon, lanUrl: item.lanUrl || '' };
  });
  settings = { title: '我的导航页', footer: '我的导航页', networkMode: 'wan' };
  serverIconCache = null;
  applySettings();
  renderNav();
}

// ===== 注册表单切换 =====
function showRegisterForm() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-pwd').value = '';
  document.getElementById('register-error').style.display = 'none';
}

function hideRegisterForm() {
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

function doRegister() {
  var email = document.getElementById('reg-email').value.trim();
  var pwd = document.getElementById('reg-pwd').value;
  var errEl = document.getElementById('register-error');

  if (!email || !pwd) {
    errEl.textContent = '请填写邮箱和密码';
    errEl.style.display = 'block';
    return;
  }
  if (pwd.length < 4) {
    errEl.textContent = '密码至少4位';
    errEl.style.display = 'block';
    return;
  }

  API.register(email, pwd).then(function(data) {
    API.setToken(data.token);
    currentUser = data.user;
    errEl.style.display = 'none';
    return API.getData();
  }).then(function(data) {
    if (data.settings && Object.keys(data.settings).length > 0) {
      settings.title = data.settings.title || settings.title;
      settings.footer = data.settings.footer || settings.footer;
      settings.networkMode = data.settings.networkMode || settings.networkMode;
    }
    if (data.navItems && data.navItems.length > 0) navItems = data.navItems;
    if (data.iconCache) serverIconCache = data.iconCache;
    applySettings();
    renderNav();
    showAdminPanel();
  }).catch(function(err) {
    errEl.textContent = err.message || '注册失败';
    errEl.style.display = 'block';
  });
}

// ===== 登录 =====
function doLogin() {
  var emailInput = document.getElementById('email-input');
  var email = emailInput ? emailInput.value.trim() : 'admin@localhost';
  var pwd = document.getElementById('pwd-input').value;

  if (!email || !pwd) {
    document.getElementById('login-error').textContent = '请输入邮箱和密码';
    document.getElementById('login-error').classList.add('show');
    return;
  }

  API.login(email, pwd).then(function(data) {
    API.setToken(data.token);
    currentUser = data.user;
    document.getElementById('login-error').classList.remove('show');

    // 加载服务器数据
    return API.getData();
  }).then(function(data) {
    if (data.settings && Object.keys(data.settings).length > 0) {
      settings.title = data.settings.title || settings.title;
      settings.footer = data.settings.footer || settings.footer;
      settings.networkMode = data.settings.networkMode || settings.networkMode;
    }
    if (data.navItems && data.navItems.length > 0) {
      navItems = data.navItems;
    }
    if (data.iconCache) {
      serverIconCache = data.iconCache;
    }
    applySettings();
    renderNav();

    // 检测 localStorage 是否有旧数据需要导入
    var hasLocalSettings = !!localStorage.getItem('siteSettings');
    var hasLocalNav = !!localStorage.getItem('navItems');
    if (hasLocalSettings || hasLocalNav) {
      showImportPrompt();
    }

    showAdminPanel();
  }).catch(function(err) {
    document.getElementById('login-error').textContent = err.message || '登录失败';
    document.getElementById('login-error').classList.add('show');
    document.getElementById('pwd-input').value = '';
    document.getElementById('pwd-input').focus();
  });
}

// 数据迁移提示
function showImportPrompt() {
  // 避免重复显示
  if (document.getElementById('import-banner')) return;

  var banner = document.createElement('div');
  banner.id = 'import-banner';
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:1002;' +
    'background:rgba(255,180,60,0.15);border-bottom:1px solid rgba(255,180,60,0.3);' +
    'padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:16px;' +
    'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);';
  banner.innerHTML = '<span style="color:rgba(255,255,255,0.8);font-size:14px;">检测到本地存储数据，要导入到服务器吗？</span>' +
    '<button onclick="doImport()" style="padding:6px 16px;background:rgba(255,180,60,0.3);border:1px solid rgba(255,180,60,0.5);color:#fff;border-radius:6px;cursor:pointer;font-size:13px;">导入</button>' +
    '<button onclick="dismissImport()" style="padding:6px 16px;background:transparent;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.5);border-radius:6px;cursor:pointer;font-size:13px;">忽略</button>';
  document.body.prepend(banner);
}

function doImport() {
  var lsSettings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
  var lsNavItems = JSON.parse(localStorage.getItem('navItems') || '[]');
  var lsIconCache = localStorage.getItem('hdIconsCache');
  var importData = {
    settings: lsSettings,
    navItems: lsNavItems,
    iconCache: lsIconCache ? JSON.parse(lsIconCache) : null
  };

  API.importData(importData).then(function() {
    if (lsSettings && Object.keys(lsSettings).length > 0) {
      settings.title = lsSettings.title || settings.title;
      settings.footer = lsSettings.footer || settings.footer;
      settings.networkMode = lsSettings.networkMode || settings.networkMode;
    }
    if (lsNavItems.length > 0) navItems = lsNavItems;
    if (importData.iconCache) serverIconCache = importData.iconCache;
    applySettings();
    renderNav();
    // 清除已导入的 localStorage
    localStorage.removeItem('siteSettings');
    localStorage.removeItem('navItems');
    localStorage.removeItem('hdIconsCache');
    localStorage.removeItem('adminPasswordHash');
    dismissImport();
  }).catch(function(err) {
    alert('导入失败: ' + err.message);
  });
}

function dismissImport() {
  var banner = document.getElementById('import-banner');
  if (banner) banner.remove();
}

// 监听认证过期事件
window.addEventListener('auth-expired', function() {
  closeDialog();
  alert('登录已过期，请重新登录');
});

function showAdminPanel() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'none';
  var panel = document.getElementById('admin-panel');
  panel.style.display = 'flex';
  document.getElementById('login-error').classList.remove('show');

  // 显示当前用户名
  var badge = document.getElementById('user-badge');
  if (currentUser) {
    badge.textContent = currentUser.email + (currentUser.is_admin ? ' (管理)' : '');
  } else {
    badge.textContent = '';
  }

  // 管理员才能看到创建子账户
  var createUserGroup = document.getElementById('create-user-group');
  if (createUserGroup) {
    createUserGroup.style.display = (currentUser && currentUser.is_admin) ? 'block' : 'none';
  }

  document.getElementById('setting-title').value = settings.title;
  document.getElementById('setting-footer').value = settings.footer;

  // 清空密码修改表单
  document.getElementById('old-pwd').value = '';
  document.getElementById('new-pwd').value = '';
  document.getElementById('new-pwd2').value = '';
  var msgEl = document.getElementById('pwd-change-msg');
  if (msgEl) { msgEl.textContent = ''; msgEl.className = 'pwd-change-msg'; }

  editItems = navItems.map(function(item) {
    return { name: item.name, url: item.url, icon: item.icon, lanUrl: item.lanUrl || '' };
  });
  switchTab('nav');
}

// ===== Tab 切换 =====
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.getElementById('tab-settings').style.display = tab === 'settings' ? 'block' : 'none';
  document.getElementById('tab-nav').style.display = tab === 'nav' ? 'block' : 'none';
  if (tab === 'nav') renderEditList();
}

// ===== 保存全部 =====
function saveAll() {
  var titleVal = document.getElementById('setting-title').value.trim();
  var footerVal = document.getElementById('setting-footer').value.trim();
  settings.title = titleVal || '我的导航页';
  settings.footer = footerVal || settings.title;

  if (typeof editItems !== 'undefined') {
    navItems = editItems.filter(function(item) { return item.name.trim() || item.url.trim(); });
  }

  if (API.isLoggedIn()) {
    API.saveAll(settings, navItems).then(function() {
      applySettings();
      renderNav();
      closeDialog();
    }).catch(function(err) {
      alert('保存失败: ' + err.message);
    });
  } else {
    // 离线模式回退 localStorage
    localStorage.setItem('siteSettings', JSON.stringify(settings));
    localStorage.setItem('navItems', JSON.stringify(navItems));
    applySettings();
    renderNav();
    closeDialog();
  }
}

// ===== 导航编辑 =====
var editItems = [];

function renderEditList() {
  var list = document.getElementById('edit-list');
  while (list.firstChild) list.removeChild(list.firstChild);

  for (var i = 0; i < editItems.length; i++) {
    var item = editItems[i];

    var row = document.createElement('div');
    row.className = 'nav-edit-item';

    var preview = document.createElement('div');
    preview.className = 'icon-preview';
    preview.appendChild(createIconNode(item.icon));
    row.appendChild(preview);

    var iconBtn = document.createElement('button');
    iconBtn.className = 'icon-btn';
    iconBtn.textContent = '选择图标';
    (function(idx) { iconBtn.onclick = function() { openIconPicker(idx); }; })(i);
    row.appendChild(iconBtn);

    var nameInput = document.createElement('input');
    nameInput.className = 'name-input';
    nameInput.value = item.name;
    nameInput.placeholder = '名称';
    (function(idx) { nameInput.onchange = function() { editItems[idx].name = this.value; }; })(i);
    row.appendChild(nameInput);

    var urlContainer = document.createElement('div');
    urlContainer.className = 'nav-edit-urls';

    var col1 = document.createElement('div');
    col1.className = 'url-column';
    var urlInput = document.createElement('input');
    urlInput.className = 'url-input';
    urlInput.value = item.url;
    urlInput.placeholder = '外网地址 (https://...)';
    (function(idx) { urlInput.onchange = function() { editItems[idx].url = this.value; }; })(i);
    col1.appendChild(urlInput);
    var label1 = document.createElement('span');
    label1.className = 'url-label';
    label1.textContent = '外网';
    col1.appendChild(label1);
    urlContainer.appendChild(col1);

    var col2 = document.createElement('div');
    col2.className = 'url-column';
    var lanInput = document.createElement('input');
    lanInput.className = 'url-input';
    lanInput.value = item.lanUrl || '';
    lanInput.placeholder = '内网地址 (可选)';
    (function(idx) { lanInput.onchange = function() { editItems[idx].lanUrl = this.value; }; })(i);
    col2.appendChild(lanInput);
    var label2 = document.createElement('span');
    label2.className = 'url-label lan';
    label2.textContent = '内网（可选）';
    col2.appendChild(label2);
    urlContainer.appendChild(col2);

    row.appendChild(urlContainer);

    var delBtn = document.createElement('button');
    delBtn.className = 'del-btn';
    delBtn.innerHTML = '&#10005;';
    (function(idx) { delBtn.onclick = function() { editItems.splice(idx, 1); renderEditList(); }; })(i);
    row.appendChild(delBtn);

    list.appendChild(row);
  }
}

function addNavItem() {
  editItems.push({ name: '', url: 'https://', icon: '🔗', lanUrl: '' });
  switchTab('nav');
  renderEditList();
}

// ===== 修改密码（通过服务器 API） =====
function doChangePassword() {
  var oldPwd = document.getElementById('old-pwd').value;
  var pwd1 = document.getElementById('new-pwd').value;
  var pwd2 = document.getElementById('new-pwd2').value;
  var msgEl = document.getElementById('pwd-change-msg');

  if (!oldPwd || !pwd1 || !pwd2) {
    msgEl.textContent = '请填写所有密码字段';
    msgEl.className = 'pwd-change-msg err';
    return;
  }
  if (pwd1.length < 4) {
    msgEl.textContent = '新密码至少4位';
    msgEl.className = 'pwd-change-msg err';
    return;
  }
  if (pwd1 !== pwd2) {
    msgEl.textContent = '两次密码不一致';
    msgEl.className = 'pwd-change-msg err';
    return;
  }

  API.changePassword(oldPwd, pwd1).then(function() {
    msgEl.textContent = '密码已更新';
    msgEl.className = 'pwd-change-msg ok';
    document.getElementById('old-pwd').value = '';
    document.getElementById('new-pwd').value = '';
    document.getElementById('new-pwd2').value = '';
    setTimeout(function() { msgEl.textContent = ''; msgEl.className = 'pwd-change-msg'; }, 3000);
  }).catch(function(err) {
    msgEl.textContent = err.message || '密码修改失败';
    msgEl.className = 'pwd-change-msg err';
  });
}

// ===== 修改邮箱 =====
function doChangeEmail() {
  var pwd = document.getElementById('email-pwd').value;
  var newEmail = document.getElementById('new-email').value.trim();
  var msgEl = document.getElementById('email-change-msg');

  if (!pwd || !newEmail) {
    msgEl.textContent = '请填写密码和新邮箱';
    msgEl.className = 'pwd-change-msg err';
    return;
  }
  if (newEmail.indexOf('@') === -1) {
    msgEl.textContent = '请输入有效的邮箱';
    msgEl.className = 'pwd-change-msg err';
    return;
  }

  API.changeEmail(pwd, newEmail).then(function(data) {
    msgEl.textContent = '邮箱已更新：' + data.email;
    msgEl.className = 'pwd-change-msg ok';
    document.getElementById('email-pwd').value = '';
    document.getElementById('new-email').value = '';
    setTimeout(function() { msgEl.textContent = ''; msgEl.className = 'pwd-change-msg'; }, 4000);
  }).catch(function(err) {
    msgEl.textContent = err.message || '修改失败';
    msgEl.className = 'pwd-change-msg err';
  });
}

// ===== 创建子账户 =====
function doCreateUser() {
  var email = document.getElementById('new-user-email').value.trim();
  var pwd = document.getElementById('new-user-pwd').value;
  var msgEl = document.getElementById('create-user-msg');

  if (!email || !pwd) {
    msgEl.textContent = '请填写邮箱和密码';
    msgEl.className = 'pwd-change-msg err';
    return;
  }
  if (pwd.length < 4) {
    msgEl.textContent = '密码至少4位';
    msgEl.className = 'pwd-change-msg err';
    return;
  }

  API.createUser(email, pwd).then(function(data) {
    msgEl.textContent = '账户已创建：' + data.user.email;
    msgEl.className = 'pwd-change-msg ok';
    document.getElementById('new-user-email').value = '';
    document.getElementById('new-user-pwd').value = '';
    setTimeout(function() { msgEl.textContent = ''; msgEl.className = 'pwd-change-msg'; }, 4000);
  }).catch(function(err) {
    msgEl.textContent = err.message || '创建失败';
    msgEl.className = 'pwd-change-msg err';
  });
}

// ===== 图标选择器 =====
var iconList = [];
var iconStyle = 'border-radius';
var iconPickerTarget = -1;
var iconCache = null;
var iconPageSize = 120;
var iconPageOffset = 0;
var iconFilteredList = [];

function loadIconCache() {
  // 服务端缓存优先
  if (serverIconCache && Date.now() - serverIconCache.time < 86400000) {
    return { data: serverIconCache.data };
  }
  // 本地缓存兜底
  try {
    var raw = localStorage.getItem('hdIconsCache');
    if (raw) {
      var cache = JSON.parse(raw);
      if (Date.now() - cache.time < 86400000) return cache;
    }
  } catch(e) {}
  return null;
}

function saveIconCache(data) {
  var cacheObj = { time: Date.now(), data: data };
  serverIconCache = cacheObj;
  // 异步保存到服务器
  if (API.isLoggedIn()) {
    API.saveIconCache(cacheObj).catch(function() {});
  }
  // 同时存 localStorage 作为离线备份
  try { localStorage.setItem('hdIconsCache', JSON.stringify(cacheObj)); } catch(e) {}
}

function fetchIconList() {
  var cached = loadIconCache();
  if (cached) return Promise.resolve(cached.data);

  return fetch('https://api.github.com/repos/xushier/HD-Icons/contents/' + iconStyle + '?per_page=2000')
    .then(function(resp) {
      if (!resp.ok) throw new Error('API error');
      return resp.json();
    })
    .then(function(files) {
      var list = files
        .filter(function(f) { return f.name.indexOf('.png') > -1; })
        .map(function(f) {
          return {
            name: f.name,
            url: 'https://cdn.jsdelivr.net/gh/xushier/HD-Icons/' + iconStyle + '/' + encodeURIComponent(f.name)
          };
        });
      saveIconCache(list);
      return list;
    })
    .catch(function() { return []; });
}

function openIconPicker(targetIndex) {
  iconPickerTarget = targetIndex;
  iconPageOffset = 0;
  document.getElementById('icon-picker-overlay').classList.add('show');
  document.getElementById('icon-search').value = '';
  loadIcons();
}

function closeIconPicker() {
  document.getElementById('icon-picker-overlay').classList.remove('show');
  iconPickerTarget = -1;
}

function switchIconStyle() {
  iconStyle = document.getElementById('icon-style').value;
  localStorage.removeItem('hdIconsCache');
  iconCache = null;
  iconPageOffset = 0;
  loadIcons();
}

function loadIcons() {
  var grid = document.getElementById('icon-picker-grid');
  grid.innerHTML = '<div class="icon-picker-loading">加载图标列表中...</div>';
  var body = grid.parentNode;
  var oldBtn = body.querySelector('.load-more-btn');
  var oldHint = body.querySelector('.icon-count-hint');
  if (oldBtn) oldBtn.remove();
  if (oldHint) oldHint.remove();

  if (!iconCache) {
    fetchIconList().then(function(data) {
      iconCache = data;
      iconList = data;
      iconPageOffset = 0;
      filterIcons();
    });
  } else {
    iconList = iconCache;
    iconPageOffset = 0;
    filterIcons();
  }
}

function filterIcons() {
  var query = document.getElementById('icon-search').value.toLowerCase();
  var grid = document.getElementById('icon-picker-grid');

  iconFilteredList = iconList.filter(function(f) {
    return f.name.toLowerCase().indexOf(query) > -1;
  });
  iconPageOffset = 0;

  var body = grid.parentNode;
  var oldBtn = body.querySelector('.load-more-btn');
  var oldHint = body.querySelector('.icon-count-hint');
  if (oldBtn) oldBtn.remove();
  if (oldHint) oldHint.remove();

  if (iconFilteredList.length === 0) {
    grid.innerHTML = '<div class="icon-picker-empty">没有匹配的图标</div>';
    return;
  }

  renderIconBatch(grid);
}

function renderIconBatch(grid) {
  var batch = iconFilteredList.slice(iconPageOffset, iconPageOffset + iconPageSize);
  iconPageOffset += batch.length;

  var fragment = document.createDocumentFragment();
  var currentItem = editItems[iconPickerTarget];

  for (var i = 0; i < batch.length; i++) {
    var f = batch[i];
    var div = document.createElement('div');
    div.className = 'icon-option';
    if (currentItem && currentItem.icon === f.url) div.classList.add('selected');
    div.title = f.name;
    (function(url) { div.onclick = function() { selectIcon(url); }; })(f.url);

    var img = document.createElement('img');
    img.src = encodeURI(f.url);
    img.alt = f.name;
    img.loading = 'lazy';
    div.appendChild(img);
    fragment.appendChild(div);
  }

  if (iconPageOffset <= batch.length) {
    grid.innerHTML = '';
  }
  grid.appendChild(fragment);

  var body = grid.parentNode;
  var oldBtn = body.querySelector('.load-more-btn');
  var oldHint = body.querySelector('.icon-count-hint');
  if (oldBtn) oldBtn.remove();
  if (oldHint) oldHint.remove();

  if (iconPageOffset < iconFilteredList.length) {
    var loadMore = document.createElement('button');
    loadMore.className = 'load-more-btn';
    loadMore.textContent = '加载更多（剩余 ' + (iconFilteredList.length - iconPageOffset) + ' 个）';
    loadMore.onclick = function() { renderIconBatch(grid); };
    body.appendChild(loadMore);
  }

  var hint = document.createElement('div');
  hint.className = 'icon-count-hint';
  hint.textContent = '显示 ' + iconPageOffset + ' / 共 ' + iconFilteredList.length + ' 个图标';
  body.appendChild(hint);
}

function selectIcon(url) {
  if (iconPickerTarget >= 0 && iconPickerTarget < editItems.length) {
    editItems[iconPickerTarget].icon = url;
    renderEditList();
  }
  closeIconPicker();
}

document.getElementById('icon-picker-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeIconPicker();
});
