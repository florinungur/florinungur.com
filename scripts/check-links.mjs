import { readFileSync, statSync } from "fs";
import { join, posix } from "path";
import * as cheerio from "cheerio";

const SITE = "https://florinungur.com";

// Lists every href and src on the site's own pages that GitHub Pages wouldn't serve, or whose #fragment
// names no id on the page it reaches, one line per problem. Pages serves a path as the file itself, then
// with .html, then as a directory's index.html.
export function brokenLinks(pages, isFile) {
  const docs = new Map([...pages].map(([file, html]) => [file, cheerio.load(html)]));
  const problems = [];
  for (const [file, $] of docs) {
    const base = new URL(file.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, ""), `${SITE}/`);
    for (const el of $("[href], [src]").toArray()) {
      const ref = $(el).attr("href") ?? $(el).attr("src");
      const url = new URL(ref, base);
      if (url.origin !== SITE) continue;
      const path = decodeURIComponent(url.pathname).slice(1);
      const target = [path, `${path}.html`, posix.join(path, "index.html")].find(isFile);
      if (!target) {
        problems.push(`${file}: ${ref} isn't served`);
        continue;
      }
      const id = decodeURIComponent(url.hash.slice(1));
      const $target = docs.get(target);
      if (id && !$target?.("[id]").toArray().some((e) => e.attribs.id === id))
        problems.push(`${file}: ${ref} – ${target} has no id "${id}"`);
    }
  }
  return problems;
}

if (import.meta.main) {
  const [root] = process.argv.slice(2);
  if (!root) {
    console.error("Usage: bun scripts/check-links.mjs <site-dir>");
    process.exit(1);
  }
  const files = [...new Bun.Glob("**/*.html").scanSync({ cwd: root })];
  const pages = new Map(files.map((f) => [f, readFileSync(join(root, f), "utf8")]));
  const isFile = (p) => statSync(join(root, p), { throwIfNoEntry: false })?.isFile() ?? false;
  const problems = brokenLinks(pages, isFile);
  for (const p of problems) console.error(`error: ${p}`);
  if (problems.length > 0) process.exit(1);
  console.log(`Checked every link on ${pages.size} pages`);
}
