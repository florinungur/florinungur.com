import * as cheerio from "cheerio";

const squash = (s) => s?.replace(/\s+/g, " ").trim();
const text = ($el) => squash($el.text());

// The display form essay pages and cards use: short month, unpadded day, year.
const displayDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

function readTime($, el, where) {
  const iso = $(el).attr("datetime");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? "")) throw new Error(`${where}: datetime "${iso}" isn't YYYY-MM-DD`);
  if (text($(el)) !== displayDate(iso))
    throw new Error(`${where}: "${text($(el))}" should read "${displayDate(iso)}" for ${iso}`);
  return iso;
}

// Reads an essay page's own facts. Throws naming the page and the first fact missing or malformed.
export function readEssay(html, where = "essay") {
  const $ = cheerio.load(html);
  const record = {
    url: $('link[rel="canonical"]').attr("href"),
    title: squash($('meta[property="og:title"]').attr("content")),
    description: squash($('meta[name="description"]').attr("content")),
  };
  for (const [field, value] of Object.entries(record)) {
    if (!value) throw new Error(`${where}: missing ${field}`);
  }
  const times = $(".datetime time").toArray();
  if (times.length === 0) throw new Error(`${where}: missing published date`);
  [record.published] = times.map((t) => readTime($, t, where));
  return record;
}

// Reads the cards on essays.html, in page order.
export function readCards(html) {
  const $ = cheerio.load(html);
  return $(".content-list > a")
    .toArray()
    .map((a) => {
      const url = $(a).attr("href");
      return {
        url,
        title: text($(a).find("h2")),
        description: text($(a).find("p")),
        published: readTime($, $(a).find("time").get(0), `card ${url}`),
      };
    });
}

// Lists every way the cards disagree with the essays: one line per problem, empty when they agree.
export function checkCards(essays, cards) {
  const problems = [];
  const byUrl = new Map();
  for (const card of cards) {
    if (byUrl.has(card.url)) problems.push(`${card.url}: more than one card on essays.html`);
    byUrl.set(card.url, card);
  }
  for (const essay of essays) {
    const card = byUrl.get(essay.url);
    if (!card) {
      problems.push(`${essay.url}: no card on essays.html`);
      continue;
    }
    for (const field of ["title", "description", "published"]) {
      if (card[field] !== essay[field])
        problems.push(`${essay.url}: card ${field} "${card[field]}" differs from the essay's "${essay[field]}"`);
    }
  }
  const urls = new Set(essays.map((e) => e.url));
  for (const card of cards) {
    if (!urls.has(card.url)) problems.push(`${card.url}: card has no essay page`);
  }
  for (let i = 1; i < cards.length; i++) {
    if (cards[i].published > cards[i - 1].published)
      problems.push(`${cards[i].url}: card is below an older essay; cards run newest first`);
  }
  return problems;
}

// The latest date among the page's <time datetime> values, or null when it has none.
export function lastModified(html) {
  const $ = cheerio.load(html);
  const dates = $("time[datetime]")
    .map((_, t) => $(t).attr("datetime").match(/^\d{4}-\d{2}-\d{2}/)?.[0])
    .get()
    .sort();
  return dates.at(-1) ?? null;
}
