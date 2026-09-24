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

  const rfc822 = (d) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${days[d.getUTCDay()]}, ${String(d.getUTCDate()).padStart(2, "0")} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} 00:00:00 +0000`;
  };

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
      <description>${escapeXml(item.description)}</description>
      <pubDate>${rfc822(new Date(item.published))}</pubDate>
    </item>`,
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Florin Ungur&apos;s Essays</title>
    <link>https://florinungur.com</link>
    <description>${escapeXml(description)}</description>
    <lastBuildDate>${rfc822(new Date())}</lastBuildDate>
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
