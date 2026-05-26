module.exports = {
  apps: [{
    name: 'magiclens-api',
    cwd: '/opt/magiclens/current',
    script: '/opt/magiclens/venv/bin/python',
    args: '-m uvicorn api.bootstrap:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers --loop uvloop --http httptools --limit-concurrency 1000 --limit-max-requests 10000 --timeout-keep-alive 5',
    interpreter: 'none',
    env: {
      ENV: 'production',
      LOG_LEVEL: 'info',
    },
    max_restarts: 10,
    restart_delay: 5000,
    exp_backoff_restart_delay: 100,
    watch: false,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/opt/magiclens/logs/error.log',
    out_file: '/opt/magiclens/logs/out.log',
    pid_file: '/opt/magiclens/logs/pid.log',
    max_memory_restart: '512M',
  }],
};
