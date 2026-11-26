# Range Trainer

A flashcard trainer for Texas hold'em opening ranges. It runs in Safari and installs to the
iPhone or iPad Home Screen, works offline, and can back itself up to a Google Sheet you own.

## What's in here

| File | What it does |
|---|---|
| `index.html` | The whole app (Train, Progress, Ranges, Sync tabs) |
| `sw.js` | Keeps the app working offline |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png` | Home Screen name and icon |
| `apps-script/Code.gs` | The small script that lets your Google Sheet receive and send data |

## Publishing (GitHub Pages)

1. In this repository on github.com, open **Settings**, then **Pages** in the left menu.
2. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main**, folder **/ (root)**, and press **Save**.
3. After a minute or two, the page shows the link: `https://diloon0.github.io/range-trainer/`

## Installing on iPhone or iPad

1. Open the link above in **Safari**.
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open it from the Home Screen icon from now on. It works without signal.

When a new version is pushed, the app picks it up the next time it is opened with signal, and shows it the time after that.

## Google Sheet sync (once)

1. Create a new Google Sheet (for example "Range Trainer data").
2. In the Sheet, open **Extensions**, then **Apps Script**.
3. Delete what's in the editor, paste the whole of `apps-script/Code.gs`, and press the save icon.
4. Press **Deploy**, then **New deployment**. Click the gear next to "Select type" and choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Press **Deploy**, then **Authorize access**, pick your Google account. Google warns that the app isn't verified: press **Advanced**, then **Go to (project name) (unsafe)**, then **Allow**. (It's your own script, only touching this Sheet.)
6. Copy the **Web app URL** (it ends in `/exec`).
7. In Range Trainer, open the **Sync** tab, paste the link, and press **Save link**. Do the same on each device.

The Sheet gets two tabs: **Ranges** (one row per situation) and **Answers** (one row per hand you answer).
The app sends changes in one batch about 30 seconds after you stop, when you leave the app, and pulls other devices' changes when you open it.

Anyone who has the `/exec` link could write to that Sheet, so keep the link to yourself.

If you ever change `Code.gs`, use **Deploy > Manage deployments > edit (pencil) > Version: New version** so the link stays the same.
