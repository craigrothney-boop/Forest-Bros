# Forest Bros

A small browser auto-runner for kids: one action (jump), hand-crafted obstacles, and biomes from meadow to renewal forest. Help a brave uprooted tree escape a changing landscape and reach a new home.

## Play locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

Output is in `dist/`.

## Host on GitHub Pages

1. Push this repository to GitHub.
2. Under **Settings → Pages**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Ensure the default branch is `main` (or adjust `.github/workflows/pages.yml` to match your default branch).
4. After the workflow runs, open the site at  
   `https://<your-username>.github.io/<repo-name>/`  
   (GitHub shows the exact URL in the workflow environment / Pages settings.)

The Vite config uses `base: './'` so assets resolve correctly from Pages subpaths.

## Controls

- **Space**, **Arrow Up**, or **tap / click** the game: jump
- **M**: mute
- **R**: reduce motion (less screen shake on mistakes)

Best distance is saved in `localStorage` in the browser.

## License

MIT
