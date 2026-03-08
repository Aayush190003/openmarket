module.exports = {
    apps: [
        {
            name: 'openmarket-api',
            script: 'server.js',
            cwd: '/var/www/openmarket/backend',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: 4000
            }
        },
        {
            name: 'openmarket-web',
            script: 'node_modules/.bin/next',
            args: 'start',
            cwd: '/var/www/openmarket/frontend',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            }
        }
    ]
};
