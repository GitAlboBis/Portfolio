"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { coverAndNavigate } from "@/components/transition/CoverOverlay";
import { dropFlip, stashFlip } from "@/lib/sheet";

/*
  TransitionLink — drop-in next/link that prints the paper sheet over the page
  before navigating (THE JOB ORDER; see CoverOverlay for the handshake and
  src/lib/sheet.ts for the artwork).

  It intercepts ONLY the navigations the sheet should own. Everything else
  falls through to the untouched <Link> (and browser) semantics:
  • modifier clicks (cmd/ctrl/shift/alt) and non-primary buttons — new tab /
    window / download semantics stay native (middle-click never fires onClick
    anyway, only auxclick);
  • external/mailto/target links and non-string hrefs;
  • same-pathname (hash-only) hops — template.tsx does NOT remount, so no
    enter would ever lift a cover;
  • a call-site onClick that already preventDefault()ed;
  • clicks while a cover is in flight — swallowed by the latch (no queueing).

  Reduced motion is NOT an exception any more: it still covers, as a 150ms
  opacity swap of the same sheet (§C.7), so the latch / inert window / bail all
  behave identically on every visit.

  FLIP HAND-OFF (§E.8): if the clicked link contains an element carrying
  `data-flip-id` (convention: `work-title-<slug>` on a Work performed row
  title), its state is captured here and replayed onto the entering page's
  element with the same id — see stashFlip/playFlip. No attribute, no hand-off:
  the plain sheet transition is unaffected.

  Keyboard activation (Enter) fires a real click with button 0 → covered too.
  Prefetch is untouched (the underlying <Link> still does it).
*/
export function TransitionLink({
  href,
  onClick,
  ...rest
}: React.ComponentProps<typeof Link>) {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (typeof href !== "string" || !href.startsWith("/")) return;
    const target = (rest as { target?: string }).target;
    if (target && target !== "_self") return;
    const targetPath = href.split(/[?#]/)[0] || "/";
    if (targetPath === pathname) return; // hash-only: no template remount

    // Capture BEFORE the cover starts (the row is still in its resting layout).
    stashFlip(e.currentTarget);
    if (coverAndNavigate(() => router.push(href))) {
      e.preventDefault();
    } else {
      dropFlip(); // no overlay mounted → plain Link navigation, no hand-off
    }
  };

  return <Link href={href} {...rest} onClick={handleClick} />;
}
