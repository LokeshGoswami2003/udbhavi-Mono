# Deployment

This project is hosted on a single AWS EC2 instance that is shared across multiple apps. Each app lives under `/var/www/apps/<app>/` and is fronted by nginx as a reverse proxy / static file server. Process supervision is handled by PM2.

## Server topology

```
EC2  (Ubuntu 26.04, public IP 3.91.1.126)
├── nginx              ports 80 / 443 — multi-app routing via server_name
├── PM2                manages Node API processes
├── certbot            issues / renews Let's Encrypt certs
└── /var/www/apps/
    └── udbhavi/
        ├── repo/                    # git working tree (origin/main)
        ├── shared/                  # secrets, never in git
        │   ├── server.env           # symlinked to repo/server/.env
        │   └── client.env           # symlinked to repo/client/.env.production
        ├── deploy.sh                # idempotent deploy script
        └── ecosystem.config.cjs     # PM2 process definition
```

Adding another app later means: another folder under `/var/www/apps/`, another nginx server block in `/etc/nginx/sites-available/`, another PM2 entry — nothing about udbhavi changes.

## Local → Server flow

```
git push origin main
        │
        ▼
GitHub Actions (.github/workflows/deploy.yml)
  1. Install deps + lint + build client (sanity)
  2. SSH into EC2 with EC2_SSH_KEY
  3. Run /var/www/apps/udbhavi/deploy.sh main
  4. Smoke test /api/v1/health
        │
        ▼
On EC2 — deploy.sh:
  git fetch + reset --hard origin/main
  link shared envs into the working tree
  npm install (server, prod) + npm install (client) + vite build
  pm2 reload udbhavi-api  (or start if first run)
```

The deploy script is idempotent — running it twice is safe.

## CI/CD secrets

In **GitHub → Settings → Secrets and variables → Actions**, set:

| Name          | Value                                              |
|---------------|----------------------------------------------------|
| `EC2_HOST`    | `3.91.1.126` (or the domain after it's attached)   |
| `EC2_USER`    | `ubuntu`                                           |
| `EC2_SSH_KEY` | full contents of `~/.ssh/gh-actions` on the server |

The matching public key (`~/.ssh/gh-actions.pub`) is already in `~ubuntu/.ssh/authorized_keys` on EC2.

If/when the repo is made private, also add the contents of `~/.ssh/github-deploy.pub` (already on the server) as a **read-only Deploy Key** in the repo settings, and update the server's clone to use SSH:

```bash
git -C /var/www/apps/udbhavi/repo remote set-url origin git@github.com:LokeshGoswami2003/udbhavi-Mono.git
```

## Environment variables

`shared/server.env` and `shared/client.env` on the server hold production values. They are symlinked into the working tree on every deploy:

- `repo/server/.env`           → `shared/server.env`  (read at runtime)
- `repo/client/.env.production` → `shared/client.env` (read at `vite build` time)

Edit them directly on the server when secrets rotate; the next deploy picks them up automatically.

```bash
ssh ubuntu@3.91.1.126
nano /var/www/apps/udbhavi/shared/server.env
pm2 reload udbhavi-api --update-env   # for runtime envs
# For client envs, rebuild:
bash /var/www/apps/udbhavi/deploy.sh
```

## Manual operations

| Task                   | Command                                                     |
|------------------------|-------------------------------------------------------------|
| Deploy latest main     | `bash /var/www/apps/udbhavi/deploy.sh`                      |
| Deploy a feature branch| `bash /var/www/apps/udbhavi/deploy.sh my-branch`            |
| App status             | `pm2 list`                                                  |
| App logs (live)        | `pm2 logs udbhavi-api`                                      |
| Recent app logs        | `pm2 logs udbhavi-api --lines 200 --nostream`               |
| Restart app            | `pm2 reload udbhavi-api --update-env`                       |
| Reload nginx           | `sudo nginx -t && sudo systemctl reload nginx`              |
| Tail nginx access      | `sudo tail -f /var/log/nginx/udbhavi.access.log`            |

## Attaching a domain

1. **DNS** — point an A record at `3.91.1.126`, e.g. `udbhavi.example.com`.
2. **AWS Security Group** — make sure ports `80` and `443` are open to `0.0.0.0/0`.
3. **nginx server_name** — edit `/etc/nginx/sites-available/udbhavi.conf` and set `server_name udbhavi.example.com;` (drop `default_server` if you want it tied strictly to the domain).
4. **Issue HTTPS cert** — `sudo certbot --nginx -d udbhavi.example.com --redirect --agree-tos -m you@example.com`. Certbot edits the same nginx file, adds the `listen 443 ssl;` block, and installs an auto-renew timer (`systemctl status certbot.timer`).
5. **Update CORS / FRONTEND_URL** — edit `shared/server.env` so `FRONTEND_URL=https://udbhavi.example.com` and reload PM2.
6. **Update client API URL** if you decide to use a different origin for the API — currently it uses `/api/v1` (same-origin), which works without changes.

After step 4 the site is HTTPS-only with HTTP→HTTPS redirect.

## Adding another app to this server

1. `sudo mkdir -p /var/www/apps/<new-app>/{shared}` (with the same layout).
2. Pick a free port for its API (e.g. 4001) and add it to the new app's PM2 ecosystem.
3. Create `/etc/nginx/sites-available/<new-app>.conf` with `server_name <new-app>.example.com;` and proxy `/api/` → `127.0.0.1:4001`. Symlink it into `sites-enabled/`.
4. `sudo nginx -t && sudo systemctl reload nginx`.
5. Repeat the certbot step.

The udbhavi server block keeps `default_server` only until you have explicit domains for everything. Once every app has its own `server_name`, drop `default_server` to avoid surprise routing.

## Firewall

UFW is enabled with: SSH (22), HTTP (80), HTTPS (443). The AWS Security Group must mirror this. Anything else is denied at the OS level.
