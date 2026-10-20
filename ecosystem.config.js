module.exports = {
  apps: [
    {
      name: 'habeba-8282',
      script: 'app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 8282,
      },
    },
  ],
};
