
# Giannicorp Admin (Vite + React + TS + Tailwind + Dexie + PWA + Capacitor)

## Schnellstart (Web)
```bash
npm i
npm run dev
```
Build:
```bash
npm run build
npm run preview
```

## PWA (iPhone/iPad ohne .ipa)
- Nach `npm run build` via Webserver hosten (oder `npm run preview`).
- In Safari öffnen → **Teilen** → **Zum Home-Bildschirm**. Offline-fähig durch PWA.

## iOS (.ipa) – kostenloser Weg
Da iOS‑Builds nur auf macOS erstellt werden können, nutze **GitHub Actions (macOS)** und **Sideloadly**:

1) **Repository (öffentlich)** anlegen und diesen Code pushen (kostenfreie macOS‑Runner).
2) GitHub Actions Workflow `ios-unsigned-ipa.yml` nutzt Capacitor, erzeugt ein **unsigned .ipa** (ohne Code Signing).
3) Lade das Artifact `GiannicorpAdmin-unsigned.ipa` herunter.
4) **Sideloadly (Windows möglich)**: Wähle die `-unsigned.ipa`, gib deine Apple‑ID an → Sideloadly **signiert** und installiert die App auf dein Gerät (Zertifikat läuft nach 7 Tagen ab; erneut sideloaden).

**Achtung:** Für echte Signierung in CI bräuchtest du Apple‑Zertifikate/Provisioning Profiles. Mit Sideloadly geht es ohne bezahlten Dev‑Account.

### Schritte lokal auf einem Mac (falls verfügbar)
```bash
npm i
npm run build
npx cap add ios
npx cap sync ios
# Xcode öffnen:
npm run ios
# In Xcode: dein iPhone auswählen → Play/Run (Development Zertifikat mit Apple ID).
# Für .ipa: Product → Archive → Distribute (Development/Ad-hoc) → Export .ipa
```

## Daten
- Lokal (IndexedDB via Dexie). Backup/Restore kannst du später als JSON einbauen.

## Ordner
- `src/pages` – Dashboard, Abos, Personen, Finanzen, Aufgaben, Projekte
- `src/db` – Dexie Schema & Seed
- `src/libs` – KPI‑Berechnungen
- `capacitor.config.ts` – Wrapper‑Config für iOS/Android

---
## GitHub Actions: Unsigned IPA (für Sideloadly)
Der Workflow baut mit `CODE_SIGNING_ALLOWED=NO` ein Xcode‑Archiv und packt das `.app` in eine **Payload.zip** → `.ipa`.
- Upload als Artifact: `GiannicorpAdmin-unsigned.ipa`


## Backup & Restore
- **Backup**: Einstellungen → „Backup als JSON“ (lädt `giannicorp-backup.json` herunter).
- **Restore**: Einstellungen → „Backup einspielen“ (ersetzt alle Daten in der lokalen DB).

## CSV Export (Finanzen)
- Finanzen → „Export CSV“ exportiert Einnahmen/Ausgaben (alle Datensätze).
