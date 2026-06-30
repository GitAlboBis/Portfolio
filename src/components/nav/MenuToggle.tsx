"use client";

/*
  MenuToggle — the hamburger ⇄ X control for the mobile menu (replaces the old
  "Menu" / "Close" text). Two currentColor bars that cross into an X when the menu
  is open, eased on --ease-tide. Reads/writes the shared `menuOpen` state, so the
  same component drives both the nav trigger and the overlay's close — they morph
  in sync. Colour follows `currentColor` (text-ink in the nav, paper inside the
  .night overlay). Keeps the bilingual aria-label (nav.menu / nav.close).
*/

import { useDict } from "@/content/dict";
import { useUI } from "@/store/ui";

const BAR =
  "absolute left-0 block h-[2px] w-full rounded-full bg-current transition-[top,transform] duration-300 ease-[var(--ease-tide)]";

export function MenuToggle({ className = "" }: { className?: string }) {
  const t = useDict();
  const open = useUI((s) => s.menuOpen);
  const setMenu = useUI((s) => s.setMenu);

  return (
    <button
      type="button"
      onClick={() => setMenu(!open)}
      aria-label={open ? t.nav.close : t.nav.menu}
      aria-expanded={open}
      aria-controls="menu-overlay"
      className={`relative inline-flex h-11 w-11 items-center justify-center ${className}`}
    >
      <span className="relative block h-3.5 w-6" aria-hidden>
        <span
          className={BAR}
          style={
            open
              ? { top: "50%", transform: "translateY(-50%) rotate(45deg)" }
              : { top: "10%", transform: "none" }
          }
        />
        <span
          className={BAR}
          style={
            open
              ? { top: "50%", transform: "translateY(-50%) rotate(-45deg)" }
              : { top: "90%", transform: "none" }
          }
        />
      </span>
    </button>
  );
}

export default MenuToggle;
