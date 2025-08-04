module.exports = {
  apps: [{
    name: 'xhs-create-v3',
    script: 'npm',
    args: 'start',
    cwd: '/root/xhs_create_v3',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}