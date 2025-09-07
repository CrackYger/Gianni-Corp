# iOS unsigned .ipa via GitHub Actions (Capacitor + Vite)

This repository is pre-configured to produce an **unsigned** `.ipa` for your Vite + React app using **Capacitor**.

## What this workflow does

- Builds the web app with Vite (using `base: './'` so it works inside a native webview).
- Ensures the Capacitor iOS platform exists, then copies the built web assets.
- Installs CocoaPods and archives the Xcode project with `CODE_SIGNING_ALLOWED=NO`.
- Packages the resulting `.app` into `GiannicorpAdmin-unsigned.ipa` and uploads it as a build artifact.

> ⚠️ **Unsigned .ipa cannot be installed on a device** until it is signed.  
> To install on your iPhone/iPad without a paid developer account, use a tool like **Sideloadly** on your computer to re-sign the IPA with your Apple ID (free provisioning). Alternatively, open the iOS project in Xcode and run on a device with free provisioning.

## How to use

1. Push this project to GitHub.
2. Go to **Actions → iOS • Build unsigned .ipa → Run workflow** (or push to `main`).
3. After it finishes, download the artifact **GiannicorpAdmin-unsigned-ipa**.
4. Re-sign and install:
   - **Option A (Sideloadly)**: Open Sideloadly on your Mac/PC → Drag the IPA → Sign in with your Apple ID → Install to device.
   - **Option B (Xcode)**: Open `ios/App/App.xcworkspace` → select your Team (free) → run on a connected device. To export a signed IPA, you'll need a provisioning profile & certificate.

## Notes

- The iOS platform folder (`ios/`) is created on-the-fly in CI if it does not exist.
- If you later commit `ios/` to your repo, the workflow will use it as-is.
- App ID and name can be changed in `capacitor.config.ts` (currently `com.giannicorp.admin` / `Giannicorp Admin`).
- If you add native plugins, update Pods by running `npx cap sync ios`.

## Local Development

- `npm run dev` to develop.
- `npm run build` to produce the web build (`dist`).
- `npm run cap:add:ios` once to add the iOS platform locally.
- `npm run build:ios` to build and sync web assets into the iOS container.

Enjoy 🚀
