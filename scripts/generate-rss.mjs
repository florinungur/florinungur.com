import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as cheerio from "cheerio";

const [outPath, srcDir] = process.argv.slice(2);
if (!outPath || !srcDir) {
  console.error("Usage: bun scripts/generate-rss.mjs <out-path> <src-dir>");
  process.exit(1);
}

const html = readFileSync(join(srcDir, "essays.html"), "utf8");
const $ = cheerio.load(html);

const items = [];

$(".content-list > a").each((_, el) => {
  const $el = $(el);
  const url = $el.attr("href");
  const title = $el.find("h2").text().trim();
  const excerpt = $el.find("p").text().trim().replace(/\s+/g, " ");
  const timeText = $el.find("time").text().trim();

  // Parse date from text content (e.g. "Jul 25, 2021") using "%b %d, %Y" format
  // Append "UTC" so the date is parsed as UTC, avoiding timezone offset issues
  const date = new Date(timeText + " UTC");

  items.push({ url, title, excerpt, date });
});

const description =
  "These words are my words. They are me — as much as I can make them and as much as words are people — and are intended for me and people like me, however you are.";

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
      <description>${escapeXml(item.excerpt)}</description>
      <pubDate>${rfc822(item.date)}</pubDate>
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
