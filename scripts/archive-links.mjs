import { readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";
import * as cheerio from "cheerio";

const SKIP_DOMAINS = ["florinungur.com", "web.archive.org"];
// The site's own GitHub repo, which only disappears if it's deleted from here, like the site itself.
const OWN_REPO = "/florinungur/florinungur.com";

function hostname(href) {
  try {
    return new URL(href).hostname;
  } catch {
    return null;
  }
}

function isConsidered(href) {
  if (!href?.startsWith("http://") && !href?.startsWith("https://")) return false;
  const host = hostname(href);
  if (host === null || SKIP_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))) return false;
  const { pathname } = new URL(href);
  return !(host === "github.com" && (pathname === OWN_REPO || pathname.startsWith(`${OWN_REPO}/`)));
}

// Already archived: a Wayback <a> follows the link, or the elements the link closes, with at most
// whitespace and a "[" between.
function isArchived(el) {
  let node = el;
  while (!node.nextSibling && node.parent?.type === "tag") node = node.parent;
  let next = node.nextSibling;
  if (next?.type === "text" && /^\s*\[?\s*$/.test(next.data)) next = next.nextSibling;
  return next?.type === "tag" && next.name === "a" && hostname(next.attribs.href) === "web.archive.org";
}

// Returns the page with an archive link after every considered link that lacks one, and one outcome
// per considered link in document order. Every byte outside the inserted links is left as it was.
// Lookups are cached by URL in `results`, which a caller can share across pages.
export async function annotate(html, lookup, { only, results = new Map() } = {}) {
  const $ = cheerio.load(html, { sourceCodeLocationInfo: true });
  const outcomes = [];
  const insertions = [];

  for (const el of $("a[href]").toArray()) {
    const href = el.attribs.href;
    if (!isConsidered(href) || (only && href !== only)) continue;

    if (isArchived(el)) {
      outcomes.push({ href, status: "already" });
      continue;
    }

    if (!results.has(href)) results.set(href, await lookup(href));
    const { archiveUrl, reason } = results.get(href);
    if (!archiveUrl) {
      outcomes.push({ href, status: "skipped", reason });
      continue;
    }

    const url = archiveUrl.replace(/^http:\/\/web\.archive\.org\//, "https://web.archive.org/");
    outcomes.push({ href, status: "archived", archiveUrl: url });
    const attr = url.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
    insertions.push({
      offset: el.sourceCodeLocation.endOffset,
      text: `\n            [<a href="${attr}" rel="noopener" target="_blank">archived link</a>]`,
    });
  }

  for (const { offset, text } of insertions.reverse()) {
    html = html.slice(0, offset) + text + html.slice(offset);
  }
  return { html, outcomes };
}

async function checkAvailability(url) {
  try {
    const res = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
    );
    if (!res.ok)
      return { url: null, reason: `availability check failed (${res.status})` };
    const data = await res.json();
    // Only a 200 capture shows the page, and the closest capture can have any status.
    const closest = data?.archived_snapshots?.closest;
    if (closest?.status === "200") return { url: closest.url, reason: null };
    return {
      url: null,
      reason: closest
        ? `closest snapshot has status ${closest.status}`
        : "no snapshot found in Wayback Machine",
    };
  } catch (e) {
    return { url: null, reason: `availability check error: ${e.message}` };
  }
}

async function savePageNow(url) {
  const MAX_TRIES = 5;
  let lastReason = "unknown error";

  for (let tries = 0; tries < MAX_TRIES; tries++) {
    if (tries >= 1) {
      await delay(tries % 3 === 0 ? 10000 : 5000);
    }

    try {
      const res = await fetch(`https://web.archive.org/save/${url}`, {
        redirect: "follow",
      });

      if (res.status === 429) {
        return { url: null, reason: "Save Page Now rate-limited (429) – try again in 5 minutes" };
      }
      if (res.status === 509) {
        return { url: null, reason: "Save Page Now session limit reached (509)" };
      }

      // Collect all headers into a single string to run regex over (matching waybackpy's approach)
      const headersStr = [...res.headers.entries()]
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");

      const m1 = headersStr.match(/content-location: (\/web\/\d{14}\/.*)/i);
      if (m1) return { url: `https://web.archive.org${m1[1]}`, reason: null };

      const m2 = headersStr.match(/rel="memento.*?(web\.archive\.org\/web\/\d{14}\/.*?)>/i);
      if (m2) return { url: `https://${m2[1]}`, reason: null };

      const m3 = headersStr.match(/x-cache-key:\shttps(.*)[A-Z]{2}/i);
      if (m3) return { url: `https${m3[1]}`, reason: null };

      // Final fallback: check the response URL after redirects
      const m4 = res.url.match(/web\.archive\.org\/web\/\d*?\/.+$/);
      if (m4) return { url: `https://${m4[0]}`, reason: null };

      lastReason = `no archive URL found in response (status ${res.status})`;
    } catch (e) {
      lastReason = `fetch error: ${e.message}`;
    }
  }

  return { url: null, reason: `Save Page Now failed after ${MAX_TRIES} tries: ${lastReason}` };
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// The production lookup: an existing Wayback snapshot, else a fresh Save Page Now capture.
export async function waybackLookup(url) {
  const availability = await checkAvailability(url);
  await delay(1000);
  if (availability.url) return { archiveUrl: availability.url };

  const save = await savePageNow(url);
  if (!save.url) return { reason: save.reason };
  await delay(1000);
  return { archiveUrl: save.url };
}

async function main() {
  const rawArgs = process.argv.slice(2);

  // Parse --url <url> flag
  let targetUrl = null;
  const args = [];
  for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i] === "--url" && i + 1 < rawArgs.length) {
      targetUrl = rawArgs[++i];
    } else {
      args.push(rawArgs[i]);
    }
  }

  if (args.length === 0) {
    console.error(
      "Usage: bun scripts/archive-links.mjs <file-or-directory> [...] [--url <url>]",
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

  const totals = { already: 0, archived: 0, skipped: 0 };
  const results = new Map();

  for (const filePath of htmlFiles) {
    console.log(`\nProcessing ${filePath}...`);
    const before = readFileSync(filePath, "utf8");
    const { html, outcomes } = await annotate(before, waybackLookup, { only: targetUrl, results });

    for (const { href, status, reason } of outcomes) {
      totals[status]++;
      if (status === "archived") console.log(`  ✓ archived: ${href}`);
      if (status === "skipped") console.log(`  ✗ skipped: ${href} – ${reason}`);
    }

    if (html !== before) {
      writeFileSync(filePath, html, "utf8");
      const written = outcomes.filter((o) => o.status === "archived").length;
      console.log(`  wrote ${written} archive links to ${filePath}`);
    }
  }

  console.log(`\nSummary:`);
  console.log(`  checked:          ${totals.already + totals.archived + totals.skipped}`);
  console.log(`  already archived: ${totals.already}`);
  console.log(`  newly archived:   ${totals.archived}`);
  console.log(`  skipped:          ${totals.skipped}`);
}

if (import.meta.main) await main();
