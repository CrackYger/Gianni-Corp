
# Giannicorp Admin Webhook (Express + SQLite)

Ein kleiner „drop-in“ Empfänger für die Member-App-Webhooks.
- **Starten**: `npm i && cp .env.example .env && npm run start`
- Setze `GIANNICORP_WEBHOOK_SECRET` = exakt der Wert aus der Member-App `.env` (`VITE_ADMIN_WEBHOOK_SECRET`).
- Setze `CORS_ORIGINS` auf die Origin deiner Member-App (z. B. `http://localhost:5173`).

**Endpoint**: `POST /api/giannicorp/inbox`  
Prüft optional die Signatur und schreibt in eine lokale SQLite (`data/admin.db`).

Tabellen:
- `requests`, `request_events`, `tickets`, `ticket_messages`

Du kannst daraus in deiner Admin-App lesen – oder diese Datei/Route direkt in deine Admin-App übernehmen.
