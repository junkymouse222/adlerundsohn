# Self-Hosting auf eigenem Ubuntu-Server

Dieser Ordner enthält alles zum Umzug der App auf einen eigenen Server mit **Self-Hosted Supabase**.

## Was wird installiert
- Docker + Self-Hosted Supabase (Postgres, Auth, PostgREST, Storage, Realtime, Studio)
- Node.js 22 + Bun
- Die App als systemd-Service (Nitro `node-server`, Port 3000)
- Caddy als Reverse Proxy mit automatischem Let's-Encrypt-SSL
- UFW-Firewall (nur 22/80/443 offen)

## Endzustand
- `https://adlerundsohn.com` → die App
- `https://supabase.adlerundsohn.com` → Supabase Studio (Basic Auth)

## Vor dem Start
1. **Root-Passwort SOFORT ändern** (`passwd`) und SSH-Keys statt Passwort einrichten.
2. **DNS A-Records auf `45.149.145.6`** setzen — die drei müssen auflösen:
   - `adlerundsohn.com`
   - `www.adlerundsohn.com`
   - `supabase.adlerundsohn.com`
   Prüfen: `dig +short adlerundsohn.com`
3. **Repo auf GitHub bereit** (in Lovable: „Connect to GitHub").
4. **Resend-API-Key** parat.

## Ausführen
Auf dem Server als `root`:
```bash
# Script hochladen (aus dem ZIP entpacken, dann):
cd /root
bash /pfad/zu/deploy/install-ubuntu.sh
```
Das Script fragt interaktiv nach: Repo-URL, Branch, Resend-Key, Studio-Basic-Auth-Zugangsdaten, deine Admin-E-Mail.

## Nach dem Lauf
- Supabase-Keys liegen unter `/root/supabase-credentials.txt` (chmod 600). Sichern und dann löschen.
- Ersten Admin-User: in der App auf `/auth` registrieren mit der beim Setup angegebenen E-Mail — der DB-Trigger `grant_admin_for_designated_email` weist automatisch die Rolle `admin` zu (die ist auf `s.schipplick@atomicmail.io` fest verdrahtet — bei Bedarf in `deploy/schema.sql` anpassen, bevor du das Script laufen lässt).
- Alternativ manuell:
  ```bash
  docker exec -it supabase-db psql -U postgres -d postgres \
    -c "INSERT INTO public.user_roles(user_id,role) SELECT id,'admin' FROM auth.users WHERE email='DEINE@MAIL';"
  ```

## Bestehende Daten migrieren
Ich habe **keinen Zugriff** auf deine aktuelle Lovable-Cloud-DB. Wenn du bestehende Angebote/Rechnungen mitnehmen willst:
1. In der Lovable-Cloud-Oberfläche (Backend-Ansicht) die Tabellen `offer_requests`, `offer_request_items`, `user_roles` als CSV exportieren.
2. Auf dem neuen Server via Studio-UI oder `psql \copy` importieren.

Wenn du willst, mach ich das später Schritt für Schritt mit dir.

## Update-Ablauf (späteres Deploy)
```bash
cd /opt/adlerundsohn
sudo -u adler git pull
sudo -u adler bun install
sudo -u adler NITRO_PRESET=node-server bun run build
systemctl restart adlerundsohn
```

## Mailversand testen
Wenn „Angebot senden" oder „Rechnung senden" hängt, zuerst Logs öffnen:
```bash
journalctl -u adlerundsohn -f
```

Danach isoliert prüfen, ob der Server Resend erreicht:
```bash
cd /opt/adlerundsohn
bash deploy/test-resend.sh deine@email.de
```
Erwartet ist `HTTP 200` und eine Resend-ID. Bei `Timeout` oder Verbindungsfehler blockiert DNS/Firewall/Outbound-HTTPS auf dem Server; bei `401/403` ist der API-Key oder die Absender-Domain falsch.

## Rollback / Deinstall
```bash
systemctl disable --now adlerundsohn
rm /etc/systemd/system/adlerundsohn.service
docker compose -f /opt/supabase/docker-compose.yml down -v
rm -rf /opt/adlerundsohn /opt/supabase
```
