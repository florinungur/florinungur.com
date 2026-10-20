// Serves _site/ the way GitHub Pages does: the path itself, then with .html, then as a directory's index.html.
import { join, sep } from "path";

const root = join(import.meta.dir, "..", "_site");

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 8080,
  async fetch(req) {
    const path = decodeURIComponent(new URL(req.url).pathname);
    for (const candidate of [path, `${path}.html`, join(path, "index.html")]) {
      const file = join(root, candidate);
      if (!file.startsWith(root + sep)) break;
      if ((await Bun.file(file).stat().catch(() => null))?.isFile()) return new Response(Bun.file(file));
    }
    return new Response(Bun.file(join(root, "404.html")), { status: 404 });
  },
});

console.log(`Serving _site/ at ${server.url}`);
