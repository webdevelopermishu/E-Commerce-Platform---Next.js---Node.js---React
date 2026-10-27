# Deployment guide (Linux VPS, e.g. Hostinger VPS)

This app is a **long-running Node.js server + PostgreSQL**. It needs a VPS (or any server where you can run
Node.js permanently). **Shared/"web" hosting plans that only serve PHP/static files cannot run it.**

Two supported paths:

- **A. Directly on the VPS** with Node.js, PostgreSQL, PM2 (or systemd) and Nginx — recommended, uses least RAM.
- **B. Docker Compose** (app + PostgreSQL containers) behind Nginx.

Minimum server: 2 vCPU, 2 GB RAM (+2 GB swap) and 20 GB disk. Building needs ~2–3 GB RAM; on a 2 GB server
add swap first (below) or build on another machine and copy the result.

Throughout, replace `example.com` with your domain and `/srv/mango-shop` with your chosen path.

---

## A. Direct install (Ubuntu 22.04 / 24.04)

### 1. Base packages, swap, firewall

```bash
sudo apt update && sudo apt -y upgrade
sudo apt -y install git curl nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Node.js 22 LTS (NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs
node -v      # must be v22.12 or newer

# 2 GB swap (skip if the server already has swap)
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Firewall: SSH + HTTP/HTTPS only (PostgreSQL and port 3000 stay private)
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw --force enable
```

### 2. System user and folders

```bash
sudo adduser --system --group --home /srv/mango-shop mango
sudo mkdir -p /var/lib/mango-shop/media /var/log/mango-shop /var/backups/mango-shop
sudo chown -R mango:mango /srv/mango-shop /var/lib/mango-shop /var/log/mango-shop /var/backups/mango-shop
sudo chmod 750 /var/lib/mango-shop /var/backups/mango-shop
```

Uploads live in `/var/lib/mango-shop/media`, **outside** the code folder, so redeploying never deletes them.

### 3. PostgreSQL

```bash
DBPASS=$(openssl rand -base64 24 | tr -d '/+=')     # note this password
sudo -u postgres psql -c "CREATE ROLE mango LOGIN PASSWORD '$DBPASS';"
sudo -u postgres psql -c "CREATE DATABASE mango_shop OWNER mango;"
echo "postgres://mango:$DBPASS@127.0.0.1:5432/mango_shop"
```

PostgreSQL listens only on localhost by default — keep it that way.

### 4. Code and configuration

Upload the project (git clone, or `scp` the zip and unzip) to `/srv/mango-shop/current`:

```bash
sudo -u mango -H bash
cd /srv/mango-shop
# git clone <your-repo> current     OR     unzip mango-shop.zip && mv mango-shop current
cd current
cp .env.example .env
chmod 600 .env
nano .env
```

Set at least:

```ini
DATABASE_URL=postgres://mango:<DBPASS>@127.0.0.1:5432/mango_shop
PAYLOAD_SECRET=<output of: openssl rand -base64 48>
NEXT_PUBLIC_SERVER_URL=https://www.example.com
MEDIA_DIR=/var/lib/mango-shop/media
PAYMENTS_SANDBOX=true
```

`NEXT_PUBLIC_SERVER_URL` **must be the exact public address** (scheme + host, no trailing slash). Admin logins are
only accepted from that origin, and it is used for canonical URLs, sitemaps and payment callbacks.

### 5. Install, migrate, build, create the admin

```bash
npm ci
npm run migrate                 # creates/updates tables
npm run seed                    # OPTIONAL sample catalogue (skip for a clean shop)
npm run build                   # ~3–6 minutes
npm run create-admin -- --email owner@example.com --name "Owner"   # asks for a password (min 12 chars)
```

There is no default account or password. Add more staff later in **Admin → Settings → Staff users**
(roles: admin, manager, editor).

### 6. Run with PM2 (or systemd)

```bash
exit                                   # back to your sudo user
sudo npm install -g pm2
sudo -u mango -H bash -c 'cd /srv/mango-shop/current && pm2 start deploy/ecosystem.config.cjs && pm2 save'
sudo env PATH=$PATH pm2 startup systemd -u mango --hp /srv/mango-shop   # run the command it prints
curl -s http://127.0.0.1:3000/healthz  # {"status":"ok"}
```

Systemd alternative: `deploy/mango-shop.service` (edit paths, then `sudo systemctl enable --now mango-shop`).

Run **one** instance. The built-in rate limiter keeps counters per process.

### 7. Nginx + HTTPS

```bash
sudo cp deploy/mango-proxy.conf /etc/nginx/snippets/mango-proxy.conf
sudo cp deploy/nginx.conf /etc/nginx/sites-available/mango-shop
sudo sed -i 's/example\.com/YOURDOMAIN.com/g' /etc/nginx/sites-available/mango-shop
sudo ln -s /etc/nginx/sites-available/mango-shop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

Point DNS **A/AAAA records** for `example.com` and `www.example.com` at the server, then get certificates.
The sample config references certificate files that don't exist yet, so obtain them first with a temporary
HTTP-only block:

```bash
# Temporarily comment out the whole "listen 443" server block, then:
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d example.com -d www.example.com     # issues certs and auto-renews
# Uncomment the 443 block (certbot may have already written equivalent lines), then:
sudo nginx -t && sudo systemctl reload nginx
```

Check: `https://www.example.com/bn` loads, `https://www.example.com/admin` shows the login. Then in the admin:

1. **Website Settings → Branding**: name, logo, favicon, website title, default SEO.
2. **Website Settings → Contact & WhatsApp**: your WhatsApp number (with 880) — the button appears once set.
3. **Website Settings → Delivery**: zones, fees, free-delivery thresholds, methods.
4. **Website Settings → Payments**: cash-on-delivery limit; gateways (see below).
5. Replace sample products, photos, policies and FAQs (or start without seeding).

### 8. File permissions summary

| Path | Owner | Mode |
|---|---|---|
| `/srv/mango-shop/current` (code) | mango | 755 dirs / 644 files |
| `/srv/mango-shop/current/.env` | mango | **600** |
| `/var/lib/mango-shop/media` | mango | 750 (only the app writes here) |
| `/var/backups/mango-shop` | mango | 750 |

---

## B. Docker Compose

Requires Docker Engine 24+ with the compose plugin.

```bash
cp .env.example .env && chmod 600 .env
# In .env set: PAYLOAD_SECRET, NEXT_PUBLIC_SERVER_URL, and add:
#   POSTGRES_PASSWORD=<strong password>
# (DATABASE_URL and MEDIA_DIR are set by docker-compose.yml for the containers)

docker compose up -d --build                    # builds the image, starts db + app (migrations run on start)
docker compose ps                               # app becomes "healthy" via /healthz
docker compose --profile tools run --rm tools npm run create-admin -- --email owner@example.com
docker compose --profile tools run --rm tools npm run seed           # optional sample data
```

- Data persists in the named volumes `pgdata` (database) and `media` (uploads). `docker compose down` keeps
  them; **`down -v` deletes them**.
- The app port is published on `127.0.0.1:3000` only; put Nginx in front exactly as in section A.7.
- No secrets are baked into the image; everything comes from `.env` at runtime.
- Upgrade: `git pull && docker compose up -d --build`.

---

## Media storage on S3-compatible services (optional)

Local disk is fine for a single VPS (just back it up). To use object storage, set in `.env`:

```ini
S3_BUCKET=my-shop-media
S3_REGION=auto                      # e.g. ap-southeast-1 for AWS
S3_ENDPOINT=https://<id>.r2.cloudflarestorage.com   # empty for AWS S3
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=false           # true for MinIO
```

Restart the app. New uploads go to the bucket and are still served through `/api/media/file/...`, so the
bucket can stay private. Existing local files are not moved automatically — upload them again or copy them
to the bucket under the `S3_PREFIX` path with identical file names.

## Email (optional)

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME` and
`ORDER_NOTIFICATION_EMAIL`. Customers who enter an email receive an order confirmation; the shop receives
a new-order alert. Without SMTP, orders work normally and emails are skipped.

## Online payments (optional)

Cash on delivery works out of the box. For each gateway:

1. Get **sandbox** credentials from the provider and put them in `.env` (`SSLCOMMERZ_*`, `BKASH_*`, `NAGAD_*`)
   with `PAYMENTS_SANDBOX=true`. Restart.
2. Turn the gateway on in **Admin → Website Settings → Payments** (the panel shows whether credentials are present).
3. Register these URLs with the provider where asked:
   - Return/callback: `https://www.example.com/payments/<provider>/callback` (`sslcommerz`, `bkash`, `nagad`)
   - SSLCommerz IPN: `https://www.example.com/payments/sslcommerz/ipn`
4. Place test orders with the provider's test wallets/cards; confirm the order shows **Paid** only after a
   successful payment, and stays unpaid after cancel/failure.
5. After the provider approves your live account: swap in live credentials and set `PAYMENTS_SANDBOX=false`.

An order is marked paid only after a server-to-server verification with the gateway and an exact amount match.

## Analytics and Search Console

In **Admin → Website Settings → Analytics** enter a GA4 measurement ID and/or GTM container ID and the Search
Console verification code. Tracking scripts load only when configured and, with "Require consent" on, only after
the visitor accepts the cookie banner. Submit `https://www.example.com/sitemap.xml` in Search Console.

---

## Backups and restore

`scripts/backup.sh` dumps the database (`pg_dump` custom format) and archives `MEDIA_DIR`, keeping 14 days.

```bash
sudo -u mango crontab -e
30 3 * * * /srv/mango-shop/current/scripts/backup.sh >> /var/log/mango-shop/backup.log 2>&1
```

Copy `/var/backups/mango-shop` off the server regularly (rclone to cloud storage, or your provider's snapshots).
A backup that only exists on the same server does not protect against losing the server.

**Restore**

```bash
pm2 stop mango-shop
# Database (replace the file name):
dropdb -h 127.0.0.1 -U mango mango_shop && createdb -h 127.0.0.1 -U mango mango_shop
pg_restore --no-owner -h 127.0.0.1 -U mango -d mango_shop /var/backups/mango-shop/db-YYYYMMDD-HHMMSS.dump
# Media:
tar -xzf /var/backups/mango-shop/media-YYYYMMDD-HHMMSS.tar.gz -C /var/lib/mango-shop
pm2 start mango-shop
```

(`dropdb`/`createdb` need the role to own the database or have CREATEDB; otherwise run them as `sudo -u postgres`.)

Docker: `docker compose exec db pg_dump -U mango -Fc mango_shop > db.dump` and back up the `media` volume
(`docker run --rm -v <project>_media:/m -v $PWD:/b alpine tar czf /b/media.tgz -C /m .`).

---

## Upgrades and rollback

Keep the previous release next to the new one so rollback is instant:

```bash
sudo -u mango -H bash
cd /srv/mango-shop
current/scripts/backup.sh                                        # 1. backup first
cp -a current release-$(date +%Y%m%d%H%M)                        # 2. keep the old release
cd current && git pull                                           # 3. new code (or unzip over a fresh folder)
npm ci && npm run migrate && npm run build                        # 4. install, migrate, build
pm2 restart mango-shop && curl -s http://127.0.0.1:3000/healthz  # 5. restart + check
```

**Rollback**: `pm2 stop mango-shop`, move the old `release-…` folder back to `current`, and — only if the new
release ran migrations that the old code can't handle — restore the database backup taken in step 1.
Then `pm2 start mango-shop`.

Schema changes during development: edit collections → `npm run migrate:create -- describe-change` →
commit the new file in `src/migrations/` → deploy runs `npm run migrate`.

---

## Logs and troubleshooting

```bash
pm2 status ; pm2 logs mango-shop --lines 200      # app logs (also /var/log/mango-shop/*.log)
sudo tail -f /var/log/nginx/error.log             # proxy errors
sudo journalctl -u postgresql --since today       # database
curl -s http://127.0.0.1:3000/healthz             # app + DB health
npm run migrate:status                            # pending migrations?
```

| Symptom | Likely cause / fix |
|---|---|
| App exits: "Missing required environment variable" | `.env` missing a required value; see `.env.example` |
| "PAYLOAD_SECRET must be at least 32 characters" | Generate one with `openssl rand -base64 48` |
| Admin login succeeds but saving gives **403 / "not allowed"**, or login loops | `NEXT_PUBLIC_SERVER_URL` doesn't match the address in the browser (http vs https, www vs bare domain). Fix it, restart |
| Admin cookies not kept over plain HTTP | Production requires HTTPS. Finish the certbot step (don't use `INSECURE_COOKIES` in production) |
| `relation "…" does not exist` | Migrations not applied: `npm run migrate` |
| 502 Bad Gateway | App not running/listening: `pm2 status`, `pm2 logs`; check `PORT`/`HOSTNAME` |
| Images 404 after redeploy | `MEDIA_DIR` pointed inside the code folder; move files to `/var/lib/mango-shop/media` and set it |
| Upload rejected | Larger than `MAX_UPLOAD_BYTES` or Nginx `client_max_body_size`; only JPEG, PNG, WebP, AVIF, SVG and ICO images are accepted |
| Build killed / "JavaScript heap out of memory" | Add swap (section A.1) or build on a bigger machine |
| WhatsApp button missing | Number not set or button disabled in Contact & WhatsApp; check "Show on" pages |
| Gateway not offered at checkout | Credentials missing in `.env` (see Payments panel status) or gateway switched off |
| "Too many requests" | Rate limit hit; make sure Nginx sets `X-Real-IP` (deploy/mango-proxy.conf) so all users aren't counted as one IP |

Locked out of the admin? `npm run create-admin -- --email owner@example.com` resets the password for that email.
