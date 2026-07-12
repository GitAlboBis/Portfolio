"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { coverAndNavigate } from "@/components/transition/CoverOverlay";

/*
  TransitionLink — drop-in next/link that plays the sunset-curtain EXIT cover
  before navigating (Continuous Curtain; see CoverOverlay for the handshake).

  It intercepts ONLY the navigations the curtain should own. Everything else
  falls through to the untouched <Link> (and browser) semantics:
  • modifier clicks (cmd/ctrl/shift/alt) and non-primary buttons — new tab /
    window / download semantics stay native (middle-click never fires onClick
    anyway, only auxclick);
  • external/mailto/target links and non-string hrefs;
  • same-pathname (hash-only) hops — template.tsx does NOT remount, so no
    enter would ever lift a cover;
  • prefers-reduced-motion — plain instant navigation, zero cover;
  • a call-site onClick that already preventDefault()ed;
  • clicks while a cover is in flight — swallowed by the latch (no queueing).

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (coverAndNavigate(() => router.push(href))) e.preventDefault();
  };

  return <Link href={href} {...rest} onClick={handleClick} />;
}
