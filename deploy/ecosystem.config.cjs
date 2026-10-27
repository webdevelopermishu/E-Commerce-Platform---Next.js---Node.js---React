// PM2 process file:  pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup
// Runs ONE instance (fork mode): the built-in rate limiter keeps its counters in memory, per process.
module.exports = {
  apps: [
    {
      name: 'mango-shop',
      cwd: __dirname + '/..',
      script: 'scripts/start.mjs',
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production' }, // everything else comes from .env
      out_file: '/var/log/mango-shop/out.log',
      error_file: '/var/log/mango-shop/error.log',
      time: true,
    },
  ],
}
