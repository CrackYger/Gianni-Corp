
# Giannicorp Admin – Repair Kit (Windows)

Dieses Kit hilft dir, die **Admin-Weboberfläche** wieder normal zu starten,
wenn du versehentlich die Webhook-Dateien über deine Admin-App gelegt hast.

## Was das Script macht
- Verschiebt die Webhook-Dateien (`package.json`, `src/index.js`, `.env*`, `data/`) in einen Unterordner `webhook\`.
- Danach kannst du in deinem Admin-App-Root wieder deine **eigene** `package.json` nutzen.

## Schritt-für-Schritt (Windows)
1) Lege die ZIP **in deinen Admin-App-Ordner** (also dort, wo aktuell `npm run dev` die Meldung "Giannicorp Admin Webhook listening on :3000" zeigt).
2) Entpacken → es entsteht der Ordner `giannicorp-admin-repair-kit\`.
3) Doppelklicke `giannicorp-admin-repair-kit\repair-move-webhook.bat`  
   → Das verschiebt die Webhook-Dateien nach `webhook\`.
4) Jetzt brauchst du wieder eine **korrekte `package.json`** für **deine** Admin-App im Root:
   - Wenn deine App **Next.js** ist, kopiere `templates\package.next.json` nach oben und benenne sie um zu `package.json`.
   - Wenn deine App **Vite (React/TS)** ist, kopiere `templates\package.vite.json` nach oben und benenne sie um zu `package.json`.
   - Wenn deine App **Create React App** ist, kopiere `templates\package.cra.json` nach oben und benenne sie um zu `package.json`.
   - **Falls du ein eigenes Framework hast**: Nimm deine ursprünglich vorhandene `package.json` (Backup/Git) zurück.
5) Im Admin-App-Root:
   ```bat
   npm i
   npm run dev
   ```
   → Deine Admin-UI sollte wieder starten (z. B. Next: http://localhost:3000, Vite: http://localhost:5173).
6) **Webhook weiterhin nutzen?**  
   In **zweitem Terminal**:
   ```bat
   cd webhook
   npm i
   npm run dev
   ```
   → Webhook läuft unter `http://localhost:3000` (falls Port belegt: ändere Port in `webhook\.env` oder `src\index.js`).

## Hinweise
- Wenn du Git nutzt: `git restore package.json` ist der sauberste Weg.
- Wenn du die Original-`package.json` noch hast (Backup), **nimm diese** statt der Templates.
