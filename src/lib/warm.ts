"use client";

/*
  warm.ts — progressive asset warm-up. "Carica tutto prima": every heavy asset
  the scroll (or the next hop) will need is fetched INTO THE HTTP CACHE right
  after the preloader unlocks — so when a FilmScrub band attaches its src at
  IO-time, or a code-split R3F canvas mounts, the bytes are already local and
  the section plays instantly.

  Deliberately NOT a blocking preloader: front-loading ~20MB of film before
  first paint would wreck LCP (WP-10) and punish mobile. Instead:

    • starts only after ui.loaded (preloader unlock) + window `load` + idle;
    • one item at a time (fetch priority:"low") — polite to the fluid hero;
    • per-route manifests, current route first, probable next hops at the tail;
    • videos pick the same 768px desktop/mobile variant rule as FilmScrub;
    • skipped entirely on Save-Data / 2G; videos skipped under reduced-motion
      (FilmScrub renders the poster still there — already tiny);
    • chunks are the SAME dynamic-import specifiers next/dynamic uses, so the
      warm shares their chunk and the later mount is a cache hit.

  QA: dev-only `window.__warm` = { done, queued, running }.
*/

type VideoItem = { kind: "video"; desktop: string; mobile: string };
type ImageItem = { kind: "image"; url: string };
type ChunkItem = { kind: "chunk"; id: string; load: () => Promise<unknown> };
type WarmItem = VideoItem | ImageItem | ChunkItem;

export type WarmRoute = "home" | "about" | "work";

const vid = (base: string): VideoItem => ({
  kind: "video",
  desktop: `/coast/${base}-1600.mp4`,
  mobile: `/coast/${base}-960.mp4`,
});
const img = (url: string): ImageItem => ({ kind: "image", url });

const WORK_STILLS = [
  img("/works/badante24h.webp"),
  img("/works/doit-voice-ai-agent.webp"),
  img("/works/agricultural-supply-chain.webp"),
];
// the menu-portal scraps — reachable from every route
const PORTAL = [img("/coast/sea-poster.webp"), img("/coast/masua-cliff.webp"), img("/coast/night-sea.webp")];

const MANIFEST: Record<WarmRoute, WarmItem[]> = {
  home: [
    // code first (small, unblocks "animations that don't load"), then film
    { kind: "chunk", id: "works-gallery", load: () => import("@/components/works/WorksGalleryCanvas") },
    { kind: "chunk", id: "tech-cloud", load: () => import("@/components/tech-cloud") },
    vid("coast"), // LA COSTA scrub
    vid("ascent"), // LA RISALITA loop
    ...WORK_STILLS,
    ...PORTAL,
    // probable next hops (the portal routes)
    vid("rock"),
    img("/coast/sulcis-map.webp"),
  ],
  about: [
    { kind: "chunk", id: "murmuration", load: () => import("@/components/atmosphere/MurmurationCanvas") },
    vid("rock"), // LA ROCCIA scrub
    img("/coast/masua-cliff.webp"),
    img("/coast/sulcis-map.webp"),
    img("/coast/night-sea.webp"),
    // hop back home
    vid("coast"),
    vid("ascent"),
  ],
  work: [
    { kind: "chunk", id: "work-runway", load: () => import("@/components/work/WorkRunwayCanvas") },
    ...WORK_STILLS,
    ...PORTAL,
    vid("coast"),
  ],
};

const keyOf = (it: WarmItem) => (it.kind === "chunk" ? `chunk:${it.id}` : it.kind === "video" ? it.desktop : it.url);

const done = new Set<string>();
const queue: WarmItem[] = [];
let running = false;

const idle = () =>
  new Promise<void>((r) => {
    if ("requestIdleCallback" in window) requestIdleCallback(() => r(), { timeout: 2500 });
    else setTimeout(r, 250);
  });

async function pump() {
  if (running) return;
  running = true;
  publish();
  while (queue.length) {
    const it = queue.shift()!;
    const k = keyOf(it);
    if (done.has(k)) continue;
    try {
      if (it.kind === "chunk") {
        await it.load();
      } else {
        const url = it.kind === "video" ? (window.innerWidth < 768 ? it.mobile : it.desktop) : it.url;
        const res = await fetch(url, { cache: "force-cache", priority: "low" } as RequestInit);
        if (res.ok) await res.blob(); // drain the body → the cache entry completes
      }
    } catch {
      /* network hiccup — mark done anyway, never retry-loop an asset */
    }
    done.add(k);
    publish();
    await idle(); // yield between items — the page always wins
  }
  running = false;
  publish();
}

function publish() {
  if (process.env.NODE_ENV !== "production") {
    (window as unknown as { __warm?: unknown }).__warm = {
      done: [...done],
      queued: queue.map(keyOf),
      running,
    };
  }
}

/** Enqueue a route's manifest (dedup vs already-done and already-queued). */
export function warmRoute(route: WarmRoute) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const it of MANIFEST[route] ?? []) {
    if (it.kind === "video" && reduced) continue; // posters only under reduced
    const k = keyOf(it);
    if (!done.has(k) && !queue.some((q) => keyOf(q) === k)) queue.push(it);
  }
  void pump();
}

/** True when warming would hurt (user opted into data saving / very slow link). */
export function warmingAllowed(): boolean {
  const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return false;
  return true;
}
