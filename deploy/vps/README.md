# Moneytools VPS

Backend: https://srv1527356.hstgr.cloud. Vercel serves only the frontend; /api and /data use external rewrites. `.vercelignore` excludes Python functions and snapshot files; the build removes dist/data as an additional check.

Runtime: /opt/moneytools, dedicated moneytools system account, Gunicorn on 127.0.0.1:8788 via moneytools-api.service. Copy wsgi.py and scan_vps.py from this folder to /opt/moneytools when releasing backend changes. Backend changes need VPS deployment as well as GitHub synchronization.

Private scan state: /var/lib/moneytools/scan (full daily/previous/history, watchlist and universe). Public releases: /var/www/moneytools-published/current. The scanner publishes a complete directory with an atomic symlink replacement. Prior release directories and the pre-cutover backup remain available for rollback; their retention should be reviewed during maintenance.

moneytools-scan.timer checks every five minutes. It scans only after the latest NYSE close plus 75 minutes, within a 12-hour catch-up window, and uses a file lock and completed-session marker to prevent overlapping/completed scans. No GitHub commit or Vercel build is needed for data updates. GitHub's old workflow is replaced by a read-only migration notice.

Keep the current production and a verified rollback deployment until cutover validation is complete. Never delete all old deployments before verifying the new production domain. For frontend rollback, restore the previous Vercel deployment; do not re-enable GitHub scanning while the VPS timer is active.

## www → apex

Canonical origin is `https://stocktools.cc`. `deploy/vps/www-stocktools.redirect.conf` is the nginx server block that 301s `www.stocktools.cc` to that origin and keeps the path and query (`$request_uri`). The frontend deploy does not copy this file or reload nginx; a root install on the VPS is required before `curl -sI https://www.stocktools.cc/...` will show the redirect. The Vite dev/preview server and `vercel.json` apply the same host rule for non-nginx hosts.
