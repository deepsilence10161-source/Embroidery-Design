# EmbroideryGuide

A private, offline-first embroidery operator workspace. **One self-contained HTML source builds the website and the Android APK.** No backend, login, CDN, analytics, or runtime internet dependency.

[Open website](https://deepsilence10161-source.github.io/Embroidery-Design/) · [Download Android APK](https://github.com/deepsilence10161-source/Embroidery-Design/releases/latest/download/EmbroideryGuide.apk) · [Download standalone HTML](https://github.com/deepsilence10161-source/Embroidery-Design/releases/latest/download/EmbroideryGuide.html) · [Build status](https://github.com/deepsilence10161-source/Embroidery-Design/actions)

## Operator-first, without clutter

- Clean photo library with search, category filters, favorites, sorting, a range on every card, and one Add button.
- Design → Home X range → independent Park / Kapda → fabric → thread colors → machine settings.
- Up to 60 thread colors, **independent of physical needle capacity**. Physical needle references are optional, never required.
- Independent fabric overrides, inactive-color history, machine profile, photos, zoom, notes, and dated logs.
- Category add / delete / new-design default; Hindi, English, Hinglish; dark, light, and system themes.
- JSON backup / import / recovery, quota protection, cross-tab conflict checks, and clean A4 printing.
- Android file sharing, system photo picker / camera, native Print / Save as PDF, safe areas, and hardware Back handling.

The Android app bundles the HTML and platform adapters **inside the APK**; it does not open the hosted website. The website includes its own same-origin manifest and service worker and supports GitHub Pages repository subpaths.

## One source

```text
EmbroideryGuide.html      Canonical application: inline CSS, inline JS, embedded demo images
src/native.js             Small Android-only platform adapter, not a second UI
scripts/build.mjs         Builds website + Android web assets + standalone download
android/                  Capacitor Android project, custom print plugin and app branding
.github/workflows/        Test → signed APK → Pages → downloadable GitHub Release
```

Change the app in `EmbroideryGuide.html`; do not edit generated `dist/` or `.native-web/`. When increasing the app version, update both `package.json` and the `VERSION` constant in the HTML, then run `npm install --package-lock-only`.

## Development

Requirements: **Node.js 22+**. Android additionally needs **Java 21**, Android SDK platform **36** and build-tools **36.0.0**. Android minimum: **7.0 / API 24**.

```bash
npm ci
npm run build
npm run dev                 # static preview on 0.0.0.0:4173
npx playwright install --with-deps chromium
npm run test:ci
npm run android:build       # local debug APK, unless release signing env is provided
```

The local preview accepts proxied hosts; the browser code uses no localhost backend or external services.

## Publishing

Every push to `main` runs real browser tests, builds a **stable-key signed release APK**, verifies the signature, runs Android lint, deploys the website to GitHub Pages, and publishes APK / HTML / website ZIP / checksums in GitHub Releases. Pull requests run validation without signing secrets. All third-party actions are pinned to verified commit SHAs.

The repository is configured for workflow-based Pages. The original setup token is **not** used by the workflow: future runs use GitHub's built-in `GITHUB_TOKEN` and four encrypted Android signing secrets. See [build and signing instructions](docs/BUILD.md).

## Data, offline behavior and updates

Data is stored in localStorage under exactly `embroidery_designs`, `embroidery_colors`, and `embroidery_settings`. Existing backups and saved needle references are preserved. Saved empty libraries stay empty. Demo data is seeded only when the storage key is missing.

**The website, downloaded HTML, and Android app have separate storage.** Export a JSON backup and import it in the other installation. There is no automatic sync. Backups contain unencrypted photos and notes; keep them private.

Open the hosted website once online before using it offline. The standalone HTML and Android app work without a first online visit. Website updates are fetched when online; open a fresh page to use the new app. Keep JSON backups before browser-data clearing, uninstalling, or changing devices. APK updates must use the same signing key and application ID.

Demo images are visual references, not machine stitch files. Confirm actual threads, hoop clearance, setup and machine settings before production. Screen colors cannot replace a physical thread chart.
