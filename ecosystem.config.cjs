module.exports = {
  apps: [
    {
      name: 'jane-app',
      script: 'dist/src/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      time: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};

