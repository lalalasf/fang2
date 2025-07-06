const ServerConfig = (function () {
    // 私有配置
    const envs = {
        local: {
            baseUrl: 'http://localhost',
            authUrl: 'http://localhost'
        },
        test: {
            baseUrl: 'http://localhost',
            authUrl: 'http://localhost'
        },
        production: {
            baseUrl: 'https://mzamusement.cn',
            authUrl: 'https://mzamusement.cn'
        }
    };

    // 根据当前hostname自动判断环境
    function detectEnv() {
        const hostname = window.location.hostname;

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'local';
        }
        if (hostname.includes('test') || hostname.includes('qa')) {
            return 'test';
        }
        return 'production';
    }

    const currentEnv = detectEnv();

    return {
        // 获取当前环境
        getCurrentEnv: () => currentEnv,

        // 获取配置
        get: (key) => envs[currentEnv][key] || null,

        // 获取整个环境配置
        getAll: () => ({ ...envs[currentEnv] }),

        // 覆盖某个配置（谨慎使用）
        set: (key, value) => {
            if (envs[currentEnv][key] !== undefined) {
                envs[currentEnv][key] = value;
            }
        },

        // 手动设置环境（用于测试）
        _setEnvForTesting: (env) => {
            if (envs[env]) {
                currentEnv = env;
            }
        }
    };
})();