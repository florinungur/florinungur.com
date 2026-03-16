import { readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import * as cheerio from "cheerio";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "Usage: bun scripts/archive-links.mjs <file-or-directory> [...]",
  );
  process.exit(1);
}

// Collect all HTML file paths from arguments
const htmlFiles = [];
for (const arg of args) {
  const stat = statSync(arg, { throwIfNoEntry: false });
  if (!stat) {
    console.error(`warning: ${arg} does not exist, skipping`);
    continue;
  }
  if (stat.isDirectory()) {
    const glob = new Bun.Glob("**/*.html");
    for (const file of glob.scanSync({ cwd: arg })) {
      htmlFiles.push(join(arg, file));
    }
  } else {
    htmlFiles.push(arg);
  }
}

if (htmlFiles.length === 0) {
  console.error("error: no HTML files found");
  process.exit(1);
}

const SKIP_DOMAINS = ["florinungur.com", "web.archive.org"];

async function checkAvailability(url) {
  try {
    const res = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.archived_snapshots?.closest?.url || null;
  } catch {
    return null;
  }
}

async function savePageNow(url) {
  try {
    const res = await fetch(`https://web.archive.org/save/${url}`, {
      method: "POST",
    });
    if (res.status === 429 || res.status === 503) {
      console.log(`  rate-limited saving ${url}, skipping`);
      return null;
    }
    if (!res.ok) {
      console.log(`  save failed (${res.status}) for ${url}, skipping`);
      return null;
    }
    const contentLocation = res.headers.get("content-location");
    if (contentLocation) {
      return `https://web.archive.org${contentLocation}`;
    }
    const location = res.headers.get("location");
    if (location && location.includes("web.archive.org")) {
      return location;
    }
    return null;
  } catch {
    return null;
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let totalChecked = 0;
let totalAlreadyArchived = 0;
let totalNewlyArchived = 0;
let totalSkipped = 0;

for (const filePath of htmlFiles) {
  console.log(`\nProcessing ${filePath}...`);
  let html = readFileSync(filePath, "utf8");
  const $ = cheerio.load(html, { decodeEntities: false });

  // Collect insertions: {position in original string, archive link HTML}
  // We'll insert in reverse order so positions don't shift
  const insertions = [];

  const links = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || (!href.startsWith("http://") && !href.startsWith("https://")))
      return;

    // Skip self-links and existing archive links
    try {
      const hostname = new URL(href).hostname;
      if (SKIP_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`)))
        return;
    } catch {
      return;
    }

    links.push(el);
  });

  for (const el of links) {
    const $el = $(el);
    const href = $el.attr("href");
    totalChecked++;

    // Check if already followed by an archive link
    const nextSibling = el.nextSibling;
    if (nextSibling) {
      const nextText =
        nextSibling.type === "text" ? nextSibling.data || "" : "";
      if (nextText.match(/^\s*\[/)) {
        const nextA = $el.next("a");
        if (
          nextA.length &&
          (nextA.attr("href") || "").includes("web.archive.org")
        ) {
          totalAlreadyArchived++;
          continue;
        }
      }
    }

    // Check Wayback Machine availability
    let archiveUrl = await checkAvailability(href);
    await delay(1000);

    if (!archiveUrl) {
      archiveUrl = await savePageNow(href);
      if (archiveUrl) {
        await delay(1000);
      }
    }

    if (archiveUrl) {
      // Find the closing </a> tag position for this link in the original HTML.
      // We search for the href to locate the right <a> tag, then find its </a>.
      const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const linkPattern = new RegExp(
        `<a\\b[^>]*href="${escapedHref}"[^>]*>[\\s\\S]*?</a>`,
        "g",
      );

      let match;
      let found = false;
      while ((match = linkPattern.exec(html)) !== null) {
        const endPos = match.index + match[0].length;
        // Check this isn't already followed by an archive link
        const after = html.slice(endPos, endPos + 100);
        if (after.match(/^\s*\[?\s*<a[^>]*web\.archive\.org/)) {
          continue; // Already archived, try next match
        }
        insertions.push({
          position: endPos,
          text: `\n            [<a href="${archiveUrl}" rel="noopener" target="_blank">archived link</a>]`,
        });
        found = true;
        totalNewlyArchived++;
        console.log(`  ✓ archived: ${href}`);
        break;
      }

      if (!found) {
        totalSkipped++;
        console.log(`  ✗ skipped (could not locate in source): ${href}`);
      }
    } else {
      totalSkipped++;
      console.log(`  ✗ skipped: ${href}`);
    }
  }

  if (insertions.length > 0) {
    // Sort by position descending so insertions don't shift earlier positions
    insertions.sort((a, b) => b.position - a.position);
    for (const ins of insertions) {
      html = html.slice(0, ins.position) + ins.text + html.slice(ins.position);
    }
    writeFileSync(filePath, html, "utf8");
    console.log(`  wrote ${insertions.length} archive links to ${filePath}`);
  }
}

console.log(`\nSummary:`);
console.log(`  checked:          ${totalChecked}`);
console.log(`  already archived: ${totalAlreadyArchived}`);
console.log(`  newly archived:   ${totalNewlyArchived}`);
console.log(`  skipped:          ${totalSkipped}`);
