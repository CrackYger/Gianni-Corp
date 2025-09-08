# iOS Unsigned IPA via GitHub Actions

1. **Start**: In GitHub → Actions → *iOS Unsigned IPA* → **Run workflow** (oder Tag `vX.Y.Z` pushen).
2. **Artefakt laden**: Nach dem Lauf erscheint das Artefakt **ios-ipa-unsigned** → `.ipa` herunterladen.
3. **Sideload**: Mit **Sideloadly** auf Windows das `.ipa` auswählen und mit deiner Apple‑ID signieren & installieren.
   - iPhone/iPad zuvor vertrauen (Einstellungen → Allgemein → VPN & Geräteverwaltung).
4. **Hinweise**:
   - Das `.ipa` ist **unsigniert** (bewusst), Signing erfolgt lokal durch Sideloadly.
   - Web‑Assets stammen aus `dist/` (Vite build) und werden via Capacitor in das iOS‑Projekt eingebunden.
