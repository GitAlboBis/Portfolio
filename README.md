# Alberto Tuveri — portfolio

The portfolio of Alberto Tuveri, Software & AI Engineer and Creative Lead at SerSan: a studio at night. Every page is a room of the same lit studio, seen by one travelling eye; a click flies the eye through a door of cut glass into the next room. Six pages, nine case studies and a 404, in English (at the root) and Italian (under `it/`).

Live at <https://portfolio-jet-eta-24.vercel.app>.

## How it is made

Hand-written HTML, CSS and JavaScript. One WebGPU canvas is drawn over each page (raw WebGPU and hand-written WGSL, no 3D library); GSAP, Lenis and Anime.js move the 2D; the sound is synthesized with the Web Audio API. Without WebGPU, with reduced motion or without scripts every page is still complete, as plain flow.

| Folder | What it holds |
|---|---|
| `public/proto/rivista/` | the site's sources: `parts/` (the partials, `strings.mjs` with every word in both languages, `cases.json` with the nine cases), `css/`, the page scripts `fx-*.js`, the stage in `stage/` |
| `public/captures/` | the pictures of the work |
| `web/` | the Astro project that builds the pages for the release |
| `scripts/` | the gates, the probes (headless Chrome through Playwright) and the media pipelines (sharp) |

## The two builds

Both read the same partials and print the same 32 pages.

- **Assembled**: `node public/proto/rivista/assemble.mjs` writes the pages and `fx.css` next to their sources. No dependencies; every navigation is a new document.
- **Astro** (`web/`): the same pages plus a client router that keeps the canvas, the GPU device and the swarm alive between pages, so a navigation is one flight. This is the build that goes online.

The pages and `fx.css` are generated: edit `parts/` and `css/`, never the output.

## Run it

Node 22 (22.12 or later) and Python 3.

```bash
npm ci                    # Playwright and sharp, for the probes and the media scripts
npm ci --prefix web       # Astro

# the assembled pages
node public/proto/rivista/assemble.mjs
python scripts/serve-static.py 8000 public            # http://127.0.0.1:8000/proto/rivista/

# the Astro pages (scripts and stage served live from public/)
npm run build --prefix web                             # writes web/dist
python scripts/serve-static.py 8001 web/dist public   # http://127.0.0.1:8001/proto/rivista/
```

The gates:

```bash
node public/proto/rivista/assemble.mjs --check        # the generated pages are current, the structure holds
node scripts/check-claims-proto.mjs                   # every number printed is a fact on file
npm run parity --prefix web && npm run asserts --prefix web && npm run claims --prefix web   # the Astro build in web/dist
```

## Release and deploy

```bash
npm run build                                          # node web/scripts/release.mjs, writes web/release
python scripts/serve-static.py 8002 web/release       # http://127.0.0.1:8002/
```

`web/scripts/release.mjs` runs the Astro build with the site's address, runs the gates on it, then writes `web/release`: the site laid out to be served from the root of a domain (`/`, `/work.html`, `/it/`, `/case-<slug>.html`), without the development files, with `robots.txt` and `sitemap.xml`. It ends by checking that every address the release names is one of its files. Any failure exits 1 and leaves no release.

Vercel builds every push with `vercel.json`: no framework preset, `cd web && npm ci`, the release script, `web/release` as the output; Node comes from `engines` in `package.json`. A push to `main` is production and is indexable; every other deployment is built `noindex`. A page's name without `.html` (`/work`, `/it/contact`) redirects to the page, as do the earlier site's `/work/<slug>` addresses; a missing address answers 404 with `404.html`, or `it/404.html` under `/it/`.

For a custom domain, change `ORIGIN` at the top of `web/scripts/release.mjs` (or set `RV_ORIGIN` in the project's environment): canonical links, share cards and the sitemap follow it.
