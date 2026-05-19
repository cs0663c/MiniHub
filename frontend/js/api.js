// api.js -- MiniHub API 通信层
var API = (function() {
    var BASE = '/api';
    var _token = localStorage.getItem('jwt_token');

    function setToken(t) {
        _token = t;
        if (t) {
            localStorage.setItem('jwt_token', t);
        } else {
            localStorage.removeItem('jwt_token');
        }
    }

    function getToken() { return _token; }

    function authHeaders() {
        var h = { 'Content-Type': 'application/json' };
        if (_token) h['Authorization'] = 'Bearer ' + _token;
        return h;
    }

    function fetchJSON(url, opts) {
        opts = opts || {};
        opts.headers = Object.assign(opts.headers || {}, authHeaders());
        return fetch(url, opts).then(function(res) {
            if (res.status === 401) {
                setToken(null);
                window.dispatchEvent(new CustomEvent('auth-expired'));
                return Promise.reject(new Error('登录已过期，请重新登录'));
            }
            return res.json().then(function(data) {
                if (!res.ok) {
                    var err = new Error(data.error || '请求失败');
                    err.status = res.status;
                    return Promise.reject(err);
                }
                return data;
            });
        });
    }

    return {
        getToken: getToken,
        setToken: setToken,
        isLoggedIn: function() { return !!_token; },

        // 认证
        login: function(email, password) {
            return fetchJSON(BASE + '/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: email, password: password })
            });
        },
        register: function(email, password) {
            return fetchJSON(BASE + '/auth/register', {
                method: 'POST',
                body: JSON.stringify({ email: email, password: password })
            });
        },
        changePassword: function(oldPwd, newPwd) {
            return fetchJSON(BASE + '/auth/password', {
                method: 'PUT',
                body: JSON.stringify({ old_password: oldPwd, new_password: newPwd })
            });
        },
        changeEmail: function(password, newEmail) {
            return fetchJSON(BASE + '/auth/email', {
                method: 'PUT',
                body: JSON.stringify({ password: password, new_email: newEmail })
            });
        },
        createUser: function(email, password) {
            return fetchJSON(BASE + '/auth/users', {
                method: 'POST',
                body: JSON.stringify({ email: email, password: password })
            });
        },
        logout: function() {
            setToken(null);
            return Promise.resolve();
        },

        // 数据
        getData: function() {
            return fetchJSON(BASE + '/data/settings');
        },
        saveSettings: function(settings) {
            return fetchJSON(BASE + '/data/settings', {
                method: 'PUT',
                body: JSON.stringify({ settings: settings })
            });
        },
        saveAll: function(settings, navItems) {
            return fetchJSON(BASE + '/data/save-all', {
                method: 'PUT',
                body: JSON.stringify({ settings: settings, navItems: navItems })
            });
        },
        saveIconCache: function(cacheData) {
            return fetchJSON(BASE + '/data/icon-cache', {
                method: 'PUT',
                body: JSON.stringify({ iconCache: cacheData })
            });
        },
        importData: function(data) {
            return fetchJSON(BASE + '/data/import', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        }
    };
})();
