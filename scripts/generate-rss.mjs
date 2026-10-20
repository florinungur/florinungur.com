import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as cheerio from "cheerio";
import { readEssay, readCards, checkCards } from "./essays.mjs";

const [outPath, srcDir] = process.argv.slice(2);
if (!outPath || !srcDir) {
  console.error("Usage: bun scripts/generate-rss.mjs <out-path> <src-dir>");
  process.exit(1);
}

try {
  const read = (file) => readFileSync(join(srcDir, file), "utf8");
  const files = [...new Bun.Glob("essays/**/*.html").scanSync({ cwd: srcDir })];
  if (files.length === 0) {
    console.error(`error: no essay pages under ${join(srcDir, "essays")}`);
    process.exit(1);
  }
  const essays = files.map((file) => readEssay(read(file), file));

  const indexHtml = read("essays.html");
  const problems = checkCards(essays, readCards(indexHtml));
  if (problems.length > 0) {
    for (const p of problems) console.error(`error: ${p}`);
    process.exit(1);
  }

  const items = essays.sort((a, b) => b.published.localeCompare(a.published));
  const description = cheerio
    .load(indexHtml)('meta[name="description"]')
    .attr("content")
    ?.replace(/\s+/g, " ")
    .trim();
  if (!description) throw new Error("essays.html: missing meta description");

  const escapeXml = (s) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const itemsXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid isPermaLink="true">${escapeXml(item.url)}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${new Date(item.published).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Florin Ungur&apos;s Essays</title>
    <link>https://florinungur.com</link>
    <atom:link href="https://florinungur.com/rss.xml" rel="self" type="application/rss+xml"/>
    <description>${escapeXml(description)}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`;

  writeFileSync(outPath, rss, "utf8");
  console.log(`Wrote ${items.length} items to ${outPath}`);
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exit(1);
}
