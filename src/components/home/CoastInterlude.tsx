"use client";

import { useDict } from "@/content/dict";
import { FilmScrub } from "@/components/home/FilmScrub";

/*
  CoastInterlude — "LA COSTA": the real place the whole site language comes
  from. A full-bleed, scroll-scrubbed drone film of Pan di Zucchero at golden
  hour (the same sunset the hero cubemap and the tokens are built from),
  pinned between the works and the stack section. The clip ENDS UNDERWATER in
  teal god-rays — the scroll literally performs the site's dive, then you
  resurface onto paper. Mechanics live in FilmScrub (shared with LA ROCCIA on
  /about); footage prep in HANDOFF (ffmpeg -g 6 scrub encode, public/coast).
*/

export function CoastInterlude() {
  const t = useDict();
  return (
    <FilmScrub
      srcDesktop="/coast/coast-1600.mp4"
      srcMobile="/coast/coast-960.mp4"
      poster="/coast/coast-poster.jpg"
      eyebrow={t.coast.eyebrow}
      title={t.coast.title}
      meta={t.coast.meta}
    />
  );
}
