# Build, deployment and signing

## Requirements

- Node.js 22 or newer; use the committed npm lockfile with `npm ci`.
- Java 21 for Capacitor 8 / Android Gradle Plugin 8.13.0.
- Android platform 36 and build-tools 36.0.0. The workflow uses the SDK on the GitHub-hosted Ubuntu runner and installs these exact packages.
- Gradle 8.14.3 is downloaded by the committed wrapper and checked against its official SHA-256.

## Web / standalone

```bash
npm ci
npm run check
npm run build
npm run dev
```

Outputs:

- `dist/web/`: upload this directory to a static HTTPS host; retain the relative paths.
- `dist/EmbroideryGuide.html`: original self-contained file, independent of web hosting.
- `.native-web/index.html`: generated UI plus bundled native adapter for Capacitor.

The generated service worker uses a source-hashed cache name, network-first HTML and cached offline fallbacks. It never sends app records to a server. Root and repository-subpath hosting are both tested. Native builds do not register a service worker or display browser-install instructions.

## Browser validation

```bash
npx playwright install --with-deps chromium
npm run test:ci
```

The suite includes 26 main operator groups, 8 extended workflows, 7 recovery/safety groups, 14 clean-home layouts, compatibility against a previous saved workspace, 133 responsive/theme/language states, true single-file offline operation, hosted and repository-subpath offline reloads, and native export/photo/print/Back adapter contract tests. Contract tests are not a substitute for checking Android system dialogs on a phone.

## Local Android build

```bash
npm run android:sync
npm run android:build
```

Without release environment variables the local command intentionally builds `android/app/build/outputs/apk/debug/app-debug.apk`. Do not distribute debug APKs as updates to the signed release app: their signatures differ.

For a signed local release, set these environment variables privately (never commit their values):

| Variable | Meaning |
| --- | --- |
| `EG_ANDROID_KEYSTORE_PATH` | Absolute path to the persistent JKS |
| `EG_ANDROID_KEYSTORE_PASSWORD` | JKS store password |
| `EG_ANDROID_KEY_ALIAS` | Signing alias |
| `EG_ANDROID_KEY_PASSWORD` | Key password |
| `ANDROID_VERSION_CODE` | Optional positive integer; use a value newer than the installed APK |

Then `npm run android:build` creates `android/app/build/outputs/apk/release/app-release.apk`.

The application ID is permanently `com.embroideryguide.app`. Version name comes from `package.json`; CI version code is `100000 + github.run_number`, so later workflow builds can upgrade earlier ones. Keep the workflow's identity and use increasing version codes for manual builds.

## GitHub Actions

The workflow has four jobs:

1. **verify:** clean npm installation, static checks, browser validation, build website, upload Pages and portable artifacts.
2. **android:** Java / SDK setup, bundle the same HTML, stable release signing, compile, unit-check, lint, verify APK signature.
3. **deploy:** deploy the verified website to GitHub Pages only after both builds pass.
4. **publish:** release `EmbroideryGuide.apk`, `EmbroideryGuide.html`, `EmbroideryGuide-website.zip` and `SHA256SUMS.txt`.

The latest download URL stays stable while every run gets a unique release tag. Re-running a run updates that run's existing release assets. Artifacts and validation reports are also available from the Actions run.

Pages must use **GitHub Actions** as its publishing source (already enabled for the original repository). A fork/new repository must enable it in Settings → Pages. No paid hosting or external backend is required.

## Persistent release signing

These four encrypted repository Actions secrets are configured in the original repository:

- `EG_ANDROID_KEYSTORE_BASE64`: standard Base64 of the persistent JKS file, single line.
- `EG_ANDROID_KEYSTORE_PASSWORD`
- `EG_ANDROID_KEY_ALIAS`
- `EG_ANDROID_KEY_PASSWORD`

The workflow fails clearly if any is absent; it never silently generates a different release key. Only the temporary decoded JKS is placed in the runner's private temporary directory and is removed after the build. The APK contains only the public signing certificate, never the private key or password.

The original key and credentials are backed up **outside this public repository**. Download and safeguard the private signing backup separately. Never add it, a PAT, `keystore.properties`, or a signing password to Git, issue comments, releases, logs, or artifacts. The setup PAT can be revoked without affecting future workflows.

## Phone acceptance checklist

After installing the signed APK on a real target phone:

- Disable network and reopen: library, photos, fonts supplied by the device, editing and saving must work.
- Upload a photo and take a camera photo; cancel each picker once without losing the draft.
- Export a JSON via Share → Files or a preferred destination, and import it back.
- Open Print, choose Save as PDF / printer, then cancel and repeat.
- Test hardware / gesture Back on a dialog, a dirty editor, a detail page and the library.
- Install a newer workflow APK **over** the older one, without uninstalling; verify existing records remain.

Do not erase browser data or uninstall the app without a current backup. Automatic cloud/device backup is disabled for the native application; exporting JSON is intentional.
