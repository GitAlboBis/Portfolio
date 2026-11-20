# m-release — the release build and the Vercel deploy (wave 6, lane RELEASE)

- **Done (20 Nov):** `web/scripts/release.mjs`, `vercel.json`, the slim root `package.json` and `package-lock.json`,
  `.gitignore`, `README.md`; the old Next.js app deleted (103 tracked files); the proof (item 4), run again by the
  second run on the tree of 07:41 (below). Runs: 02:31–03:04 (cut, 5-hour limit), 07:31–08:03 (cut by Fable's limit
  right after its teeth test, before writing it here), 08:03– on Opus 5.5 (read, re-checked vercel.json against
  today's docs, the last release run on the tree as the other lanes have it).
- **Next:** nothing of the brief. The director commits, pushes, then checks the five things under "For the director".
- **Decisions:** below. The second run changed one thing: the redirects of `vercel.json` (every page's name without
  `.html`, in both languages, where the first run had only the old app's `/about` and `/work`).
- **How to run:** `node web/scripts/release.mjs` from the repo root (it is the buildCommand); with
  `VERCEL_ENV=production` for the indexable build. 1.8 s here.
- **How to look:** `python scripts/serve-static.py 5366 web/release`, then http://127.0.0.1:5366/ (the plain server
  has no 404 page and no redirects: the routes of vercel.json are tried on `vercel build`'s output with
  `.shots/m-release/_scripts/rehearse.mjs <folder outside the worktree>`, `vercel build --prod --yes` there, then
  `runlook.mjs <that folder>`, which starts `vroutes.mjs` on 5366, asks 42 addresses, runs the browser look and
  stops the server).

## The proof (second run, 07:41–, on the tree as the other lanes had it then)

- **The exact buildCommand as production** (`VERCEL_ENV=production node web/scripts/release.mjs`, repo root): exit 0,
  32 pages (30 in the sitemap), 150 files, 4.9 MB, robots `index, follow`, robots.txt allows all and names the sitemap
  (`logs/release-run2.log`).
- **The commit as a Linux host holds it** (`rehearse.mjs`): the 581 files git would commit, in a case-sensitive
  folder outside the worktree (no parent with a `node_modules`), the 25 `*.js`/`*.mjs`/`*.md` that are CRLF here
  written with LF as `.gitattributes` commits them, `web/node_modules` copied in, a `.vercel/project.json` saying
  what the old project's dashboard says (Next.js preset, Node 24). `vercel build --prod` (CLI 59.11.2) on it: the
  preset is skipped (`framework: null`), Node 22.x wins over the dashboard's, `@vercel/static-build` runs the
  buildCommand and takes `web/release`: ok (`logs/vercel-build-rehearsal.log`). Its 150 files are the worktree
  release's, 134 byte for byte and 16 scripts with LF for CRLF. The one difference from the real run: installCommand
  was a no-op (`npm ci` needs the network).
- **Its route table** (`.vercel/output/config.json`: mine, anchored, plus the 404 the CLI adds in the error phase)
  answered 42 of 42 addresses as meant (`logs/runlook-*.log`): pages and files 200 with the two headers, `/_astro/*`
  immutable, `/it` 308, eleven names without `.html` and three old `/work/<slug>` 307 to their page, missing
  addresses 404 with the English page and under `/it/` with the Italian one, the left-out files 404, `/Work.html` 404.
- **The browser** (headless, on that output): `/`, `/it/`, `/work.html`, a case, `/contact.html`, `/404.html`, the
  cover at 390 and 1920: every request 200, none under `/proto/rivista/`, console clean, the stage lit on all but the
  404 (which has none); a missing address at depth in each language loads its styles and scripts from the root; one
  click on the cover flew to Work on the same canvas with no reload (looked at: `look-final/sheet-pages.jpg`,
  `click-strip.jpg`, `sheet-phone-1920.jpg`).
- **Every page, read to its end** (`crawl.mjs`, the same output on a server that tells capitals apart): the 32 pages
  at 1440, wheel to the bottom: 111 addresses asked for, every one 200, console clean, the stage lit on the 30 pages
  that have one, also the scenes a page loads by name at run time (`stack`, `path`, `consult`, `obla`; since 08:03
  the release's own check reads those names too, see the teeth below). Never asked for: the smaller captures, the share cards, the
  other devices' icons, `splatname.js` (only with `?name=splat`), `glass/backdrop.js` (`logs/crawl-1.log`).
- **The last run** (08:08, third run; `logs/release-run5.log`): the exact buildCommand as production on the tree as the
  other lanes had it then (still editing `stage.js`, `gallery.js`, `plates.wgsl.js`, `fx-sound.js`, `cuts.css`):
  exit 0, 32 pages (30 in the sitemap), 150 files, 4.9 MB, robots.txt allows all and names the sitemap. The only raw
  `proto/rivista` left in the release: a comment in `fx-sound.js` and the icons' embedded provenance text
  (`impeccable:prompt`), no address. `vercel.json` re-read against today's docs (Context7): the redirect and 404
  forms of `routes`, `ignoreCommand` (exit 1 = build, overrides the dashboard), `framework: null` = Other, the three
  commands overriding the dashboard; the docs now call `handle` deprecated in favour of `rewrites`, which answer 200,
  so it stays (the CLI compiled it; a bare `404.html` at the output root is served with 404 anyway).
- **The check has teeth** (08:03, `logs/teeth-case-2.log`, on a copy of the commit in the scratchpad): one capital
  changed at a time, each release failed and named the file: `stage/tier.js` (a name joined to a base in
  `fx-stage.js`'s `import()`), `stage/scenes/hero.js` (a scene loaded by its `data-stage`), `stage/scenes/lib/raster.js`
  (a static import, a `new URL` and an `import()` name), `captures/sphere-ai-800.webp` (`src` and `srcset`); put back,
  it passed. A first teeth run at 08:00 had passed where it should have failed: `release.mjs` gained the two run-time
  checks (lines 170–175 and 193–206) at 08:02:59, and the run above is on that version.
- **The gates of both builds on that tree:** `assemble.mjs --check` exit 0, the claims OK, the Astro build with
  `PARITY OK`, asserts ok and its claims OK (`logs/gate2-*.log`).
- **A fresh clone builds:** `git status --porcelain --ignored -- web public` shows only `web/.astro`, `web/dist`,
  `web/node_modules`, `web/release` as ignored; untracked and needed: `web/scripts/release.mjs`, `vercel.json`,
  `package-lock.json` (the director adds them). Every module the build runs imports only Node's own modules and
  relative files, but `astro/config` in `web/` (read: site.mjs, the parts, asserts.mjs, check-claims-proto.mjs,
  og-card-jobs.mjs, the integration, build.mjs): no Python, ffmpeg, Playwright or sharp.
- **What only Linux could trip on, read in the code** (this PC has no WSL and no Docker, and `npm ci` may not run
  here: the build itself never ran on Linux): no path is built with a backslash or a drive; no folder listing's order
  reaches the output (the release sorts its own walk); partials and styles are read with CRLF turned to LF
  (site.mjs), so line ends never reach a page or fx.css; the share cards' hashes are over strings and picture bytes,
  the same on any disk; nothing reads the clock, the locale or the machine. `web/package-lock.json` holds the
  linux-x64-gnu binary of every native family, all 287 entries with `resolved` and `integrity`.

## For the director

- **Commit** with `git add -A` (the root's `_shots/`, `*.stackdump` and `.claude/launch.json` are ignored now):
  it takes the 103 deletions and the three new files the build needs (`vercel.json`, `web/scripts/release.mjs`,
  `package-lock.json`). Author as `git config` has it and no co-author line, as always: Vercel compares a commit's
  author with the project's owner (a Hobby team deploys only its owner's commits from a private repository; this
  repository is public, where the docs are looser, but the owner's own commit is the case that cannot be refused).
- **The squash replaces main's tree** (HANDOFF: one commit with the final tree on `881f68c`; push that commit only,
  never `feat/water-viva`, whose history holds `47e914d`): `git commit-tree HEAD^{tree} -p 881f68c -m "…"`, then push
  that sha to `main` (a fast-forward while GitHub's main is still `881f68c`). Not `git merge --squash`: main has 40
  commits since the merge base `664d6e4`, many on the deleted app (conflicts), and a merge would keep main's own
  `design-system/`, `IMPLEMENTATION-PLAN.md`, `IMPROVEMENT_BACKLOG.md`, `WATER-WAVE-PLAN.md`. `Dati/` (the two CV
  PDFs) and `.claude/skills/` are public on main already: the push exposes nothing new there.
- **Before the push** (2 s, on the final tree): `VERCEL_ENV=production node web/scripts/release.mjs` must end with
  the three `[release]` lines. If a gate fails there it fails on Vercel the same way, and the old site stays up.
- **After the push**, on the commit at GitHub: the Vercel status goes green (built and live), red (the build
  failed: the old site is still the one online; run the line above to see why) or never appears (no build: the
  project is not connected to the repo any more, or the author was refused). `gh api
  repos/GitAlboBis/Portfolio/deployments --jq '.[0]'` before the push shows whether `vercel[bot]` deployed main last.
- **Then five addresses:** `/` is the night studio (no `x-powered-by: Next.js`, `x-content-type-options: nosniff`);
  `/robots.txt` says `Allow: /` and names the sitemap; `/it` answers 308 to `/it/`; `/it/nope` answers 404 in
  Italian; `/work/badante24h` answers 307 to `/case-badante24h.html`.
- **What the dashboard could still do** (nobody can see it): *Root Directory* set to a folder: the `vercel.json` at
  the repo's root is not read, and the dashboard's own preset (Next.js) builds that folder: a red status, or a green
  one with something else at `/`; it is almost surely empty, since main's app builds from the root today.
  *System environment variables not exposed*: the build cannot see
  `VERCEL_ENV`, production is built `noindex` and `/robots.txt` says `Disallow: /`; from the repo: buildCommand
  `RV_ROBOTS="index, follow" node web/scripts/release.mjs`. *Production Branch* not `main`: the push is a preview,
  the old site stays at the address. Preset, build, install and output settings, the Node version and the Ignored
  Build Step are all overridden by `vercel.json` and `engines`.
- **A custom domain later:** `ORIGIN` at the top of `web/scripts/release.mjs` (or `RV_ORIGIN` in the project).

## Needs elsewhere

- `CLAUDE.md` (the director's): §4 "Build 2" and §6 do not know `web/scripts/release.mjs`, `vercel.json` and
  `web/release/`; §5 still says the root `package.json` is the old Next.js app's; §7 lists `src/**`,
  `next.config.ts`, `tsconfig.json` and `npm run dev` as present (they are deleted; the old app's scripts under
  `scripts/` remain, with nothing to run on); §8 "Per il deploy": the address, the indexing, the 404 status and
  what not to serve are now settled by the release and `vercel.json`.
- Nothing under `public/proto/rivista/` or `web/src/`. Two things seen and left: `fx-sound.js` names
  `public/proto/rivista/sound/render.mjs` in a comment (a note, no address: the release's check reads code only),
  and the pages link home as `index.html`, so `/index.html` is a second address of the cover (its canonical says
  `/`).

## What I found (facts the design rests on)

- With `RV_ORIGIN=https://portfolio-jet-eta-24.vercel.app` (no path) the build's base is `/`: canonical, hreflang, og:url
  and og:image are absolute under the origin, the two 404 pages load everything from `/` (`/fx.css`, `/fx-core.js`,
  `/it/work.html`). Pages link each other relatively, the captures as `/captures/…`, the router as `/_astro/…`: the
  content of `proto/rivista/` works at the root as it is.
- `web/scripts/asserts.mjs` with a root origin fails on one thing only: the 32 `/_astro/…` references (it resolves a
  rooted URL inside `<build>/proto/rivista`, and `_astro` is two folders up). The release folds the build's root
  folders into the site folder before the gate, which is where those URLs resolve once the site folder is the root.
- Three stage modules reach the captures with `new URL("../../../../captures/…", import.meta.url)`: at the root the
  four `..` clamp at `/` (URL standard) and give `/captures/…`. Works; checked in the browser run.
- `web/package-lock.json` holds the linux-x64-gnu binaries of every native family (rolldown, lightningcss, sharp,
  the Astro compiler, satteri) and is in sync with package.json (`npm ci --dry-run --offline` on a scratch copy: ok).
- Nothing the build reads is untracked or ignored (`git status --porcelain --ignored -- web public`: only
  `web/.astro`, `web/dist`, `web/node_modules`). The gates import nothing from node_modules.
- Vercel (Context7, docs of today): `framework: null` is "Other"; `installCommand`, `buildCommand`,
  `outputDirectory`, `ignoreCommand` override the dashboard; `engines.node` in the root package.json overrides the
  dashboard's Node version (22.x, 24.x, 26.x exist; 26.x is the default); a rewrite always answers 200, so the Italian
  404 with a real 404 status needs `routes`; `routes` cannot be mixed with `headers`, `cleanUrls`, `trailingSlash`.
- Vercel's own presets do what this vercel.json does: `@vercel/static-build` (in the CLI here) ends Docusaurus's routes
  with `{handle: filesystem}, {src: ".*", status: 404, dest: "404.html"}` and gives Astro's `/_astro/` an immutable
  cache header.

## Decisions

- **The release folder is `web/release/`** (ignored); the Astro build goes to `web/release/.build` and is removed.
  A failure at any step removes the whole folder: a host can never pick up half a release.
- **The gates run on the build with the release's own address**, after `_astro` is folded in (see above). No second
  build, no change to `asserts.mjs`.
- **Left out of the release** beyond the brief's list (benches, `.md`, `sound/`, the `.webp.json` sidecars,
  `PROVENANCE.md`): `og/og-manifest.json` (the share cards' ledger, read only by the gate) and the two `.svg` in
  `captures/` (the drawings two captures were rendered from: no page loads them). If a page ever names a file that
  was left out, the release's own check fails the build and says which.
- **The release checks itself** (step 5 of the script, pure Node): every href, src, srcset, loader script,
  stylesheet url, manifest icon and every written module name (`import … from`, `import()`, `new URL(…,
  import.meta.url)`) is a file of the release with the same capitals; no page, stylesheet, manifest or script code
  names `proto/rivista`; each page's canonical is itself under the origin; the two 404 load everything rooted; the
  robots line is the one asked. On Vercel's Linux disk a wrong capital fails the build instead of shipping.
- **Robots:** `RV_ROBOTS`, else `index, follow` only when `VERCEL_ENV` is `production`. `robots.txt` follows the same
  line (allow all + the sitemap, or disallow all). A preview deployment is never indexable.
- **`RV_ORIGIN` with a folder is refused** (exit 1): the release is laid out for the root, and the 404 pages would
  load from the folder.
- **vercel.json uses `routes`** (not `headers` + the bare 404.html convention) because only a route can answer 404
  with `it/404.html` under `/it/`. In order: `/it` → 308 `/it/` (without it Vercel serves the Italian cover at `/it`
  and its relative links land on the English pages); the redirects; the two headers on everything; `/_astro/*`
  immutable (hashed names; what Vercel's Astro preset does); the files; then the two 404 pages with status 404
  (the shape of Vercel's own static presets: header routes with `continue`, `handle: filesystem`, `status: 404` +
  `dest`).
- **The redirects** (second run; all 307, so a browser never keeps one for good and clean addresses stay possible
  later): a page's name without `.html`, in both languages (`/work`, `/contact/`, `/case-sphere-ai`, `/it/about` →
  the page), and the earlier site's `/work/<slug>` → `/case-<slug>.html`. Main's app served `/`, `/about`, `/work`,
  `/work/<slug>` with five slugs: three are cases of this site; `sersan-project-1` and `-2` were placeholders
  ("SerSan — Project I/II", stack TBD) and end on the 404 page after the redirect. No click inside the site meets a
  redirect: the pages link `name.html`. Each pattern has one group that always takes part (no optional group in a
  `Location`).
- **`ignoreCommand: "exit 1"`**: always build, whatever "Ignored Build Step" the dashboard holds (exit 1 = build).
- **installCommand `cd web && npm ci`**: only web/ (Astro). The root's two packages (Playwright, sharp) are for the
  probes and media scripts and are not installed on the host.
- **Node `22.x`** in the root `engines` (this PC: 22.17.1; Astro 7 needs 22.12 or later).
- **Root `package-lock.json`** made offline from main's lock (`npm install --package-lock-only --offline` in a scratch
  folder): 237 → 34 packages, playwright 1.61.1 and sharp 0.34.5 as on this PC. Like main's, most entries carry no
  `resolved`/`integrity` (main's lock was written from an installed tree); the next online `npm install` at the root
  completes them. `.gitignore` no longer ignores it (main tracks it).
- **`.gitignore`** also ignores `web/release/` and what a session leaves at the root (`/_shots/`, `*.stackdump`,
  `.claude/launch.json`): the push goes to a public repo and `git add -A` must not pick them up.

## Deleted (plain `rm`; all tracked at HEAD 4000240; the list is `.shots/m-release/deleted-files.txt`)

- `src/**` (89 files): the Next.js app "The job order" (`app/`, `components/`, `content/`, `data/`, `lib/`, `store/`,
  `webgl/`, `webgpu-types.d.ts`).
- `next.config.ts`, `tsconfig.json`, `postcss.config.mjs` (no eslint or tailwind config existed; `next-env.d.ts` was
  not on disk).
- `public/bench/` (5 files) and `public/cubemap/` (6 files): the old app's bench picture and its environment cubemap.
- Grepped before deleting (the site, `web/`, `scripts/lib`, `scripts/media`, `visual-gate.mjs`,
  `check-claims-proto.mjs`, `serve-static.py`, `probes/a11y-gate.mjs`, `capture-sites.mjs`): nothing names them.
  The release built after the deletion is byte-identical to the one built before (same `_astro` hashes: the root
  tsconfig never reached the Astro build).
- From `package.json`: every dependency but `playwright` (kept) and `sharp` (added: it was only there through
  `next`); the scripts `dev`, `build` (next), `start`, `typecheck`. Now one script: `build` = the release.
- Left where they are, as the brief says: `scripts/**` (the old app's probes and `check-claims.mjs`,
  `capture-bench.mjs`, `gen_workshop_cubemap.py` no longer have an app to run on), `docs/**`, `loops/**`, the root
  documents. (The first run's step-by-step digest, written by the director for the second run:
  `.shots/_director/m-release-run2-digest.md`.)
