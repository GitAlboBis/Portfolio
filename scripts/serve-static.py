"""Static file server for the prototype and the probes.

Usage: python scripts/serve-static.py <port> <directory> [<directory> ...]

With two folders (lane o-router: `python scripts/serve-static.py 5330 web/dist public`) the first one is the build
whose PAGES are served (every .html, and Astro's /_astro/ bundles), and the shared files (fx-*.js, stage/, fx.css,
captures, icons) come from the LAST folder that has them: so a script or stage edit under public/ is live on the
Astro pages without a rebuild. A path missing from one folder is looked up in the others.

`python -m http.server` keeps a listen backlog of 5: a page that opens more
connections at once (one browser is enough, two always) gets some of them
refused, which shows up as ERR_CONNECTION_REFUSED on scripts and images.
This is the same handler with a backlog that holds.
"""
import functools
import http.server
import sys


class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 512
    daemon_threads = True


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".webp": "image/webp",
        ".webmanifest": "application/manifest+json",
    }

    roots = []

    def translate_path(self, path):
        if len(self.roots) < 2:
            return super().translate_path(path)
        import os
        import posixpath
        import urllib.parse
        clean = posixpath.normpath(urllib.parse.unquote(path.split("?", 1)[0].split("#", 1)[0]))
        page = clean.endswith(".html") or clean.endswith("/") or "/_astro/" in clean or clean in ("", "/", ".")
        order = self.roots if page else list(reversed(self.roots))
        first = None
        for root in order:
            self.directory = root
            p = super().translate_path(path)
            if first is None:
                first = p
            if os.path.exists(p) and (not os.path.isdir(p) or os.path.exists(os.path.join(p, "index.html"))):
                return p
        self.directory = order[0]
        return first

    def log_message(self, format, *args):  # quiet: the probes read the page's console, not this log
        pass


def main():
    port = int(sys.argv[1])
    directory = sys.argv[2]
    roots = [__import__("os").path.abspath(d) for d in sys.argv[2:]]
    Handler.roots = roots if len(roots) > 1 else []
    handler = functools.partial(Handler, directory=roots[0])
    with Server(("127.0.0.1", port), handler) as httpd:
        print(f"serving {' + '.join(sys.argv[2:])} on http://127.0.0.1:{port}", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
