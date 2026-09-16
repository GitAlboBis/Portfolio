# Archivo — static instances for `next/og`

The site itself loads **Archivo** through `next/font/google` (variable, `wdth` 62–125).
`next/og` (Satori) cannot read variable axes and cannot read woff2, so the three widths
the sheet actually prints are vendored here as static TTF instances:

| file | instance | used for |
|---|---|---|
| `archivo-wide-800.ttf` | `wdth 125` · `wght 800` | `.f-name`, `.f-headline` |
| `archivo-cond-700.ttf` | `wdth 75` · `wght 700` | `.f-caption`, `.f-stamp`, labels |
| `archivo-400.ttf` | `wdth 100` · `wght 400` | `.f-body`, `.f-cell`, values |

**Provenance.** Cut on 2026-09-16 from `google/fonts` → `ofl/archivo/Archivo[wdth,wght].ttf`
with fontTools 4.63 (`varLib.instancer.instantiateVariableFont` + `subset` to the Latin
glyphs this site prints, incl. `·  — – → ← ↗ ↖ ° ©` and the Italian accents). ~21 KB each.

**Licence.** Archivo — Omnibus-Type, SIL Open Font License 1.1
(<https://github.com/google/fonts/blob/main/ofl/archivo/OFL.txt>). Redistribution of the
instances is permitted under the same licence; no Reserved Font Name is claimed here.

Consumed by `src/app/fonts/og-fonts.ts` (read once per server process, with a graceful
fallback to the built-in face if the files are not present in a deployment).
