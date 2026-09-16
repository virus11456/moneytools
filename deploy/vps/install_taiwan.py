"""Root-only, scoped installer; preserve existing nginx and US services. Run after backup."""
import os,subprocess,shutil
from pathlib import Path

def main():
 if os.geteuid()!=0:raise SystemExit('Run through authorized administrator terminal')
 app=Path('/opt/moneytools');conf=Path('/etc/nginx/sites-available/moneytools');text=conf.read_text()
 marker='# Moneytools Taiwan static data'
 location='''    # Moneytools Taiwan static data
    location ^~ /data/tw/ {
        alias /var/www/moneytools-tw/current/;
        default_type application/json;
        add_header Cache-Control "public, max-age=60, must-revalidate";
        add_header X-Content-Type-Options nosniff;
        autoindex off;
    }
'''
 if marker not in text:
  anchor='location / { return 404; }'
  if text.count(anchor)!=1:raise SystemExit('Unexpected nginx layout; no change made')
  backup=conf.with_name('moneytools.pre-taiwan')
  if not backup.exists():shutil.copy2(conf,backup)
  conf.write_text(text.replace(anchor,location+'    '+anchor))
  try:subprocess.run(['nginx','-t'],check=True)
  except Exception:conf.write_text(text);raise
  subprocess.run(['systemctl','reload','nginx'],check=True)
 for name in ('moneytools-taiwan-scan.service','moneytools-taiwan-scan.timer'):
  shutil.copy2(app/'deploy/vps'/name,Path('/etc/systemd/system')/name)
 subprocess.run(['systemctl','daemon-reload'],check=True)
 subprocess.run(['systemd-analyze','verify','/etc/systemd/system/moneytools-taiwan-scan.service','/etc/systemd/system/moneytools-taiwan-scan.timer'],check=True)
 subprocess.run(['systemctl','enable','--now','moneytools-taiwan-scan.timer'],check=True)
 print('Taiwan static route and independent timer installed; scheduled completion must be verified separately.')
if __name__=='__main__':main()
