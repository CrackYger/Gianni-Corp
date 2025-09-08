## Patch: Pro Tables + Finance Charts (fixed)

- Neue Routen: `/abos/tabelle`, `/personen/tabelle` mit Pro-Tabellen (TanStack Table).
- Auf Seiten **Abos** und **Personen** oben rechts Button **„Tabelle“** in der Header-Actions.
- Finance: Charts (Recharts) – Netto (12M) + Ausgaben nach Service (Top-N, Monatspicker).
- Keine gefährlichen In-Place-Toggles mehr in bestehenden Seiten → keine JSX-Fragment-Fehler.
- Abhängigkeiten ergänzt: `@tanstack/react-table`, `recharts` (bitte einmal `npm i`).

## Patch v2.1.0‑prep: Cleanup + PWA consistency + iOS splash fix

- **Removed duplicate project folder** `Gianni corp/` (contained its own node_modules) to reduce size and avoid build confusion.
- **Removed dead helper file** `src/_add_to_main_tail.txt` (logic inlined elsewhere).
- **Unified PWA manifest**: deleted `public/manifest.webmanifest` and let `vite-plugin-pwa` provide one source of truth. Also removed the hardcoded `<link rel="manifest">` from `index.html`.
- **Splash overlay** now disappears instantly after app mount by dispatching `app:ready` in `src/main.tsx` (still has timeouts as safety net).


## Patch v2.1.0 — Einstellungen „Premium“
- **Darstellung voll funktionsfähig:** Theme (System/Dunkel/Hell), Dichte (Komfort/Kompakt), Bewegungen reduzieren, Akzentfarbe – sofort wirksam & persistent.
- **Backup Pro:** Validiertes Backup (Zod), **Dry-Run** mit Datenübersicht, sicherer Import (transaktional).
- **PWA-Tools:** „Nach Update suchen“ (Service Worker Reload) & „Caches leeren“.
- **Daten & Speicher:** Live-Zählung aller Tabellen + Speicherverbrauch (Storage API).


## Patch v2.1.0 — Abos „Premium“ + Dashboard-Karten
- **Abos (Services) Premium:** Suche, Status-/Zyklus-Filter, „nur freie Slots“, Karten/Tabelle-Umschaltung, Export (CSV) der gefilterten Ansicht.
- **Schnellaktionen:** Service anlegen direkt aus Toolbar.
- **Dashboard-Upgrade:** Neue KPI-Karten (Aktive Abos, Freie Slots, Auslastung, MRR).


## Patch v2.1.0 — Abo-Detailseite (Pro)
- **Neue Seite:** Detailansicht pro Service mit KPIs (Slots, Auslastung, Kosten/Netto), Liste aller Subscriptions & Zuweisungen.
- **Fälligkeiten-Radar (7 Tage):** zeigt anstehende Zahlungen basierend auf Abrechnungstagen.
- **Aktionen:** Service aktivieren/deaktivieren, Subscription/Assignment direkt hinzufügen/bearbeiten.
- **Export:** CSV (Assignments) & JSON (Service + Subscriptions + Assignments).
- **Navigation:** „Details“-Links aus Abos (Karten & Tabelle).



## Patch v2.1.0 — Dashboard Pro
- Neue KPIs: **Einnahmen, Ausgaben, Netto** je Zeitraum (Monat / 30 / 90 Tage) + **Auslastung** (Donut).
- **12‑Monats** Liniendiagramm (Einnahmen / Ausgaben / Netto) ohne Fremd‑Libs.
- **Top 5 Services** nach Netto/Monat (Schätzung) als Balken.
- **Zahlungsmix** (Donut + Liste) aus erfassten Einnahmen.
- Fallbacks: Wenn keine Buchungen (`incomes/expenses`) existieren, werden Werte **aus Subscriptions/Assignments/Service‑Kosten geschätzt**.
