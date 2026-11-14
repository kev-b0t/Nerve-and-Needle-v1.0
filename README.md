# Nerve & Needle

Innervation and needle EMG trainer for PM&R residents. It installs to a phone's home screen and works fully offline (a progressive web app, or PWA).

## Folder layout

| Folder | What it is |
|---|---|
| `content/` | **The content. Edit these files.** `muscles_upper.csv` and `muscles_lower.csv` hold every muscle, nerve, root and needle site. `cases.json` holds the localize-the-lesion cases. |
| `src/` | The app itself (page, styles, logic, service worker, icons, fonts). |
| `tools/build.py` | Turns `content/` + `src/` into `public/`. It also checks that every case muscle exists in the CSVs. |
| `public/` | The finished app. This is the folder you put online. It is rebuilt each time you run the build. |

## Put it online (choose one)

Offline mode only works over HTTPS. Both options below provide it for free.

### Option A: Netlify Drop (quickest, about 2 minutes)
1. Run `python3 tools/build.py` (or use the `public/` folder already included in this download).
2. Go to app.netlify.com/drop and drag the **`public`** folder onto the page.
3. Netlify gives you an HTTPS link. Create a free account to keep the site and rename it (for example `nerve-and-needle.netlify.app`).
4. To update later: rebuild, then drag `public` onto the same site's **Deploys** tab.

### Option B: GitHub Pages (best long term: edit content on github.com and it redeploys itself)
1. Create a new repository on GitHub and upload everything in this folder **except** `public/`.
2. In the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds and publishes the app on every change to `main`. Your link appears under **Settings → Pages**.
4. To update content, edit a CSV or `cases.json` directly on github.com and commit. The site updates in about a minute.

Free GitHub Pages sites need a public repository. The content has no patient data, but if you'd rather keep the repository private, use Netlify (it can deploy from a private GitHub repository too).

## Installing on a phone
- **iPhone (Safari):** open the link, tap **Share → Add to Home Screen**.
- **Android (Chrome):** open the link and tap **Install** in the app's banner (or the browser menu → **Install app**).
- Open it once while online. After that it works with no connection.

## Updating content
1. Edit `content/muscles_upper.csv`, `content/muscles_lower.csv` or `content/cases.json`.
2. Run `python3 tools/build.py`. It stops with a clear message if, for example, a case names a muscle that isn't in the CSVs.
3. Redeploy (Option A or B). Installed copies show **"A new version with updated content is ready"** with an **Update now** button.

Keep the CSV column names unchanged; the build reads them by name.

## Notes
- Progress is stored on each device (no accounts, no server). Clearing the browser's site data erases it.
- Fonts are IBM Plex and Source Serif 4, bundled under the SIL Open Font License (see `src/fonts/`).
- Content status: draft for faculty review. Root values follow PM&R Recap where it lists the muscle, otherwise the MRC *Aids to the Examination of the Peripheral Nervous System*; needle sites are paraphrased from Perotto, *Anatomical Guide for the Electromyographer* (4th ed.), with page numbers.
