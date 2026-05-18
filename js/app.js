// ===== 数据 =====
var searchEngine = 'baidu';

var settings = JSON.parse(localStorage.getItem('siteSettings')) || {
  title: '我的导航页',
  footer: '我的导航页',
  networkMode: 'wan'
};

var rawNav = JSON.parse(localStorage.getItem('navItems'));
if (rawNav) {
  rawNav.forEach(function(item) {
    if (item.lanUrl === undefined) item.lanUrl = '';
    // 清理旧版本可能遗留的 isLan 字段
    delete item.isLan;
  });
}
var navItems = rawNav || [
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

// 安全创建 icon 内容：返回 DOM 节点
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

// 获取当前应使用的 URL（根据网络模式）
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

  // 网络模式开关
  var cb = document.getElementById('netmode-cb');
  cb.checked = (settings.networkMode === 'lan');
  document.getElementById('netmode-text').textContent = settings.networkMode === 'lan' ? '内网' : '外网';
}
applySettings();

// ===== 网络模式切换 =====
function toggleNetworkMode() {
  var cb = document.getElementById('netmode-cb');
  settings.networkMode = cb.checked ? 'lan' : 'wan';
  document.getElementById('netmode-text').textContent = settings.networkMode === 'lan' ? '内网' : '外网';
  localStorage.setItem('siteSettings', JSON.stringify(settings));
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
  // 清空
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

    // 图标
    var iconDiv = document.createElement('div');
    iconDiv.className = 'nav-icon';
    iconDiv.appendChild(createIconNode(item.icon));
    a.appendChild(iconDiv);

    // 名称
    var nameSpan = document.createElement('span');
    nameSpan.className = 'nav-name';
    nameSpan.textContent = item.name;
    a.appendChild(nameSpan);

    // URL 提示气泡
    var tip = document.createElement('span');
    tip.className = 'nav-url-tip';
    tip.textContent = effUrl;
    a.appendChild(tip);

    // 内网徽章
    if (hasLan) {
      var badge = document.createElement('span');
      badge.className = 'nav-lan-badge';
      badge.textContent = isLanMode ? '内网' : '双栈';
      a.appendChild(badge);
    }

    grid.appendChild(a);
  }
}
renderNav();

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

// ===== 密码管理 =====
var DEFAULT_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'; // SHA-256("admin")

function hashPassword(pwd) {
  try {
    var enc = new TextEncoder().encode(pwd);
    return crypto.subtle.digest('SHA-256', enc).then(function(hash) {
      var arr = Array.from(new Uint8Array(hash));
      return arr.map(function(b) { return b.toString(16).padStart(2,'0'); }).join('');
    }).catch(function(err) {
      console.error('crypto.subtle failed:', err);
      // 回退：简单哈希
      return simpleHash(pwd);
    });
  } catch(e) {
    console.error('hashPassword error:', e);
    return Promise.resolve(simpleHash(pwd));
  }
}

function simpleHash(s) {
  var h = 0;
  for (var i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return 'fallback_' + Math.abs(h).toString(16);
}

function getStoredHash() { return localStorage.getItem('adminPasswordHash'); }

// 首次使用自动设置默认密码 admin
function ensurePasswordExists() {
  if (!getStoredHash()) {
    localStorage.setItem('adminPasswordHash', DEFAULT_HASH);
  }
}
ensurePasswordExists();

function verifyPassword(pwd) {
  var stored = getStoredHash();
  // 优先检查默认密码（无论 stored 是什么）
  if (pwd === 'admin' && stored === DEFAULT_HASH) return Promise.resolve(true);
  if (!stored) return Promise.resolve(true);
  return hashPassword(pwd).then(function(h) { return h === stored; });
}

function setPassword(pwd) {
  return hashPassword(pwd).then(function(h) {
    localStorage.setItem('adminPasswordHash', h);
  });
}

// ===== 弹窗控制 =====
function openAdminDialog() {
  document.getElementById('overlay').classList.add('show');
  document.getElementById('login-error').classList.remove('show');
  document.getElementById('pwd-input').value = '';

  document.getElementById('login-form').style.display = 'block';
  document.getElementById('admin-panel').style.display = 'none';

  if (getStoredHash() === DEFAULT_HASH) {
    document.getElementById('login-msg').textContent = '默认密码：admin（登录后请修改）';
  } else {
    document.getElementById('login-msg').textContent = '请输入管理密码';
  }
  setTimeout(function() { document.getElementById('pwd-input').focus(); }, 150);
}

function closeDialog() {
  document.getElementById('overlay').classList.remove('show');
}

// ===== 登录 =====
function doLogin() {
  var pwd = document.getElementById('pwd-input').value;
  if (!pwd) return;

  verifyPassword(pwd).then(function(ok) {
    if (ok) {
      document.getElementById('login-error').classList.remove('show');
      showAdminPanel();
    } else {
      document.getElementById('login-error').classList.add('show');
      document.getElementById('pwd-input').value = '';
      document.getElementById('pwd-input').focus();
    }
  }).catch(function(err) {
    console.error('Login error:', err);
    // 哈希失败时允许 admin 进入
    if (pwd === 'admin') {
      showAdminPanel();
    } else {
      document.getElementById('login-error').classList.add('show');
      document.getElementById('login-error').textContent = '登录失败，请重试';
    }
  });
}

function showAdminPanel() {
  document.getElementById('login-form').style.display = 'none';
  var panel = document.getElementById('admin-panel');
  panel.style.display = 'flex';
  document.getElementById('login-error').classList.remove('show');

  document.getElementById('setting-title').value = settings.title;
  document.getElementById('setting-footer').value = settings.footer;

  // 清空密码修改表单
  document.getElementById('new-pwd').value = '';
  document.getElementById('new-pwd2').value = '';
  document.getElementById('pwd-change-msg').textContent = '';
  document.getElementById('pwd-change-msg').className = 'pwd-change-msg';

  editItems = navItems.map(function(item) {
    return { name: item.name, url: item.url, icon: item.icon, lanUrl: item.lanUrl || '' };
  });
  switchTab('settings');
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
  localStorage.setItem('siteSettings', JSON.stringify(settings));

  if (typeof editItems !== 'undefined') {
    navItems = editItems.filter(function(item) { return item.name.trim() || item.url.trim(); });
    localStorage.setItem('navItems', JSON.stringify(navItems));
  }

  applySettings();
  renderNav();
  closeDialog();
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

    // 图标预览
    var preview = document.createElement('div');
    preview.className = 'icon-preview';
    preview.appendChild(createIconNode(item.icon));
    row.appendChild(preview);

    // 选择图标按钮
    var iconBtn = document.createElement('button');
    iconBtn.className = 'icon-btn';
    iconBtn.textContent = '选择图标';
    (function(idx) { iconBtn.onclick = function() { openIconPicker(idx); }; })(i);
    row.appendChild(iconBtn);

    // 名称输入
    var nameInput = document.createElement('input');
    nameInput.className = 'name-input';
    nameInput.value = item.name;
    nameInput.placeholder = '名称';
    (function(idx) { nameInput.onchange = function() { editItems[idx].name = this.value; }; })(i);
    row.appendChild(nameInput);

    // URL 容器（双列并排）
    var urlContainer = document.createElement('div');
    urlContainer.className = 'nav-edit-urls';

    // 外网地址列
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

    // 内网地址列
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

    // 删除按钮
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

// ===== 修改密码（内联表单） =====
function doChangePassword() {
  var pwd1 = document.getElementById('new-pwd').value;
  var pwd2 = document.getElementById('new-pwd2').value;
  var msgEl = document.getElementById('pwd-change-msg');

  if (!pwd1 || !pwd2) {
    msgEl.textContent = '请填写密码';
    msgEl.className = 'pwd-change-msg err';
    return;
  }
  if (pwd1.length < 4) {
    msgEl.textContent = '密码至少4位';
    msgEl.className = 'pwd-change-msg err';
    return;
  }
  if (pwd1 !== pwd2) {
    msgEl.textContent = '两次密码不一致';
    msgEl.className = 'pwd-change-msg err';
    return;
  }

  setPassword(pwd1).then(function() {
    msgEl.textContent = '密码已更新';
    msgEl.className = 'pwd-change-msg ok';
    document.getElementById('new-pwd').value = '';
    document.getElementById('new-pwd2').value = '';
    setTimeout(function() { msgEl.textContent = ''; msgEl.className = 'pwd-change-msg'; }, 3000);
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
  try {
    localStorage.setItem('hdIconsCache', JSON.stringify({ time: Date.now(), data: data }));
  } catch(e) {}
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

// 点击遮罩关闭图标选择器
document.getElementById('icon-picker-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeIconPicker();
});
