import { expect, test } from "bun:test";
import { readFileSync } from "fs";
import { annotate } from "./archive-links.mjs";

const fixture = (name) =>
  readFileSync(new URL(`fixtures/archive-links/${name}`, import.meta.url), "utf8");

const SNAPSHOT = "https://web.archive.org/web/20240101000000/https://example.com/a";
const archiveLink = (url) =>
  `\n            [<a href="${url}" rel="noopener" target="_blank">archived link</a>]`;

// A lookup backed by a map from URL to result, recording every URL it's asked for.
function fakeLookup(results) {
  const lookup = async (url) => {
    lookup.calls.push(url);
    return results[url] ?? { reason: "not in fake" };
  };
  lookup.calls = [];
  return lookup;
}

test("archives each occurrence of a repeated link after its own </a>, looking it up once", async () => {
  const lookup = fakeLookup({ "https://example.com/a": { archiveUrl: SNAPSHOT } });
  const { html, outcomes } = await annotate(fixture("repeated.html"), lookup);
  expect(html).toContain(`one</a>${archiveLink(SNAPSHOT)},`);
  expect(html).toContain(`two</a>${archiveLink(SNAPSHOT)}.`);
  expect(outcomes.map((o) => o.status)).toEqual(["archived", "archived"]);
  expect(lookup.calls).toEqual(["https://example.com/a"]);
});

test("a link followed by a Wayback link is already archived", async () => {
  const lookup = fakeLookup({});
  const { outcomes } = await annotate(fixture("already.html"), lookup);
  expect(outcomes).toEqual([{ href: "https://example.com/a", status: "already" }]);
  expect(lookup.calls).toEqual([]);
});

test("a quoted link with its archive link inside the <q> is already archived", async () => {
  const { outcomes } = await annotate(fixture("quoted.html"), fakeLookup({}));
  expect(outcomes).toEqual([{ href: "https://example.com/a", status: "already" }]);
});

test("a link wrapped in an inline element with its archive link after the wrapper is already archived", async () => {
  const { outcomes } = await annotate(fixture("wrapped.html"), fakeLookup({}));
  expect(outcomes).toEqual([{ href: "https://example.com/a", status: "already" }]);
});

test("a failed lookup is skipped with its reason and leaves the page untouched", async () => {
  const input = fixture("single.html");
  const lookup = fakeLookup({ "https://example.com/a": { reason: "blocked" } });
  const { html, outcomes } = await annotate(input, lookup);
  expect(outcomes).toEqual([{ href: "https://example.com/a", status: "skipped", reason: "blocked" }]);
  expect(html).toBe(input);
});

test("an http Wayback URL is inserted as https", async () => {
  const lookup = fakeLookup({
    "https://example.com/a": { archiveUrl: SNAPSHOT.replace("https:", "http:") },
  });
  const { html } = await annotate(fixture("single.html"), lookup);
  expect(html).toContain(archiveLink(SNAPSHOT));
});

test("an archive URL is escaped in the inserted attribute", async () => {
  const lookup = fakeLookup({ "https://example.com/a": { archiveUrl: `${SNAPSHOT}?x=1&copy&y="2"` } });
  const { html } = await annotate(fixture("single.html"), lookup);
  expect(html).toContain(archiveLink(`${SNAPSHOT}?x=1&amp;copy&amp;y=&quot;2&quot;`));
});

test("only restricts the pass to the one href", async () => {
  const lookup = fakeLookup({ "https://example.com/b": { archiveUrl: SNAPSHOT } });
  const { outcomes } = await annotate(fixture("two-links.html"), lookup, {
    only: "https://example.com/b",
  });
  expect(outcomes).toEqual([{ href: "https://example.com/b", status: "archived", archiveUrl: SNAPSHOT }]);
  expect(lookup.calls).toEqual(["https://example.com/b"]);
});

test("changes nothing but the inserted archive link", async () => {
  const input = fixture("single.html");
  const lookup = fakeLookup({ "https://example.com/a": { archiveUrl: SNAPSHOT } });
  const { html } = await annotate(input, lookup);
  expect(html).toContain('<meta charset="utf-8"/>');
  expect(html.replace(archiveLink(SNAPSHOT), "")).toBe(input);
});

test("own-site, Wayback, mailto, and anchor links are not considered", async () => {
  const lookup = fakeLookup({});
  const { outcomes } = await annotate(fixture("ignored.html"), lookup);
  expect(outcomes).toEqual([]);
  expect(lookup.calls).toEqual([]);
});
