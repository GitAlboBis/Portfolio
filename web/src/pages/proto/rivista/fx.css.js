/* fx.css: css/*.css concatenated in assemble.mjs's cascade order and shipped the same way (lib/site.mjs buildCss) */
import { buildCss } from "../../../lib/site.mjs";

export const prerender = true;
export function GET() {
  return new Response(buildCss(), { headers: { "Content-Type": "text/css; charset=utf-8" } });
}
