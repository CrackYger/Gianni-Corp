# Build `.ipa` for *Giannicorp Admin* (Capacitor + Xcode, Free Provisioning)

> Kurz: Wir erzeugen Web-Assets (`npm run build`), syncen Capacitor (`npx cap add ios && npx cap sync ios`), öffnen das Xcode-Projekt und exportieren eine `.ipa` via *Archive*.

## Voraussetzungen
- macOS mit **Xcode** (aktuell)
- **Apple-ID** (kostenlos) – reicht fürs Testen (Profil läuft nach 7 Tagen ab)
- Node 18+
- Dein Projekt (dieser Ordner)

## Schritte

1) **Install & Build**
```bash
npm i
npm run build
```

2) **Capacitor hinzufügen**
```bash
npm i -D @capacitor/cli @capacitor/core
npx cap add ios
npx cap sync ios
```

> Die Datei `capacitor.config.ts` ist bereits für dich vorbereitet (`appId=com.giannicorp.admin`, `appName=Giannicorp Admin`, `webDir=dist`).

3) **(optional) Icons/Splash generieren**  
Installiere das Assets-Tool und generiere iOS-Assets:
```bash
npm i -D @capacitor/assets
npx cap assets
```
> Notfalls kannst du das später nachholen – für einen schnellen Test nutzt Xcode Platzhalter.

4) **Projekt öffnen**
```bash
npx cap open ios
```
Xcode öffnet `ios/App/App.xcworkspace`.

5) **Free Provisioning (kostenlos)**
- In Xcode links das **App**-Target wählen → Tab **Signing & Capabilities**.
- **Team**: „Add an Account…“ → mit deiner Apple-ID anmelden, Team auswählen.
- **Bundle Identifier**: z. B. `com.giannicorp.admin` (einzigartig machen, falls es kollidiert: `com.giannicorp.admin.<deinname>`).
- **Signing Certificate**: „Apple Development“. Xcode erstellt ein Provisioning Profile automatisch.

6) **Release-Build & Archive**
- `Any iOS Device (arm64)` wählen.
- Menü **Product → Archive**.
- Im Organizer: **Distribute App → Development** (oder „Ad Hoc“, wenn du UDIDs hinterlegt hast).
- **Export** → `.ipa` speichern.

7) **Auf iPad/iPhone installieren**
- **Sideloadly** oder **AltStore** nutzen → `.ipa` wählen → mit Apple-ID signieren → installieren.
- Bei Free Provisioning: die App ist **7 Tage** gültig; danach einfach neu signieren/exportieren.

---

## Häufige Stolpersteine
- **White Screen**: `npm run build` vergessen → im Xcode-Log steht, dass `/dist` leer ist. Nochmal bauen, dann `npx cap sync ios`.
- **Team/Signing fehlt**: In Xcode kein Team ausgewählt. Signing & Capabilities prüfen.
- **Bundle ID nicht eindeutig**: Andere App nutzt die ID. Einfach `com.giannicorp.admin.<deinname>` setzen.
- **„App Transport Security“ blockt HTTP**: Falls du externe HTTP-Requests brauchst, ATS-Ausnahme im iOS-Target setzen.

## Debug-Hinweise
- `console.log` siehst du im Xcode **Debug area** (unten) oder via **Safari Web Inspector** (Gerät per Kabel, Safari → Develop).
- Service Worker/PWA-Cache in Capacitor: läuft wie im Safari, aber Assets werden lokal aus der App geladen.