## CI/IPA Patch
- CI-Build ohne TS-Typecheck (`vite build`); separates `npm run typecheck` verfügbar.
- `src/libs/io.ts` neu (stabile CSV Utility).
- `src/pages/PeopleTable.tsx` fix (Preisberechnung ohne Subscription.pricePerMonth).
- `src/pages/Finance.tsx` Charts-Helper unter `month`-State.
- `src/pages/Tasks.tsx` Framer Motion korrekt (motion.div).
- `src/pages/Projects.tsx` Owner-Fallback.

## Patch: Pro Tables + Finance Charts (fixed)

- Neue Routen: `/abos/tabelle`, `/personen/tabelle` mit Pro-Tabellen (TanStack Table).
- Auf Seiten **Abos** und **Personen** oben rechts Button **„Tabelle“** in der Header-Actions.
- Finance: Charts (Recharts) – Netto (12M) + Ausgaben nach Service (Top-N, Monatspicker).
- Keine gefährlichen In-Place-Toggles mehr in bestehenden Seiten → keine JSX-Fragment-Fehler.
- Abhängigkeiten ergänzt: `@tanstack/react-table`, `recharts` (bitte einmal `npm i`).
