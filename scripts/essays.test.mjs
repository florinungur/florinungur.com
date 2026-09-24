import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { checkCards, lastModified, readCards, readEssay } from "./essays.mjs";

const fixture = (name) => readFileSync(new URL(`fixtures/essays/${name}`, import.meta.url), "utf8");
const essay = (url, published) => ({ url, title: "T", description: "D", published });
const asCard = ({ url, title, description, published }) => ({ url, title, description, published });

describe("readEssay", () => {
  test("reads the essay's own facts", () => {
    expect(readEssay(fixture("essay.html"))).toEqual({
      url: "https://florinungur.com/essays/2024/10/06/x",
      title: "X & Y",
      description: "An essay about people.",
      published: "2024-10-06",
    });
  });

  test("rejects a Last updated date whose text disagrees with its datetime", () => {
    expect(() => readEssay(fixture("wrong-update-text.html"))).toThrow('should read "Mar 16, 2026"');
  });

  test("names the page and the missing field", () => {
    expect(() => readEssay(fixture("no-canonical.html"), "essays/x.html")).toThrow("essays/x.html: missing url");
  });

  test("rejects a date whose text disagrees with its datetime", () => {
    expect(() => readEssay(fixture("wrong-date-text.html"))).toThrow('should read "Oct 6, 2024"');
  });
});

test("readCards reads each card in page order", () => {
  expect(readCards(fixture("cards.html"))).toEqual([
    { url: "https://florinungur.com/essays/2026/04/06/a", title: "A & B", description: "First card.", published: "2026-04-06" },
    { url: "https://florinungur.com/essays/2020/09/01/b", title: "B", description: "Second card.", published: "2020-09-01" },
  ]);
});

describe("checkCards", () => {
  const a = essay("https://a", "2026-04-06");
  const b = essay("https://b", "2020-09-01");

  test("agrees when every essay has a matching card, newest first", () => {
    expect(checkCards([b, a], [asCard(a), asCard(b)])).toEqual([]);
  });

  test("reports each disagreement once", () => {
    const stray = asCard(essay("https://c", "2019-01-01"));
    expect(checkCards([a, b], [asCard(b), { ...asCard(a), title: "Old" }, stray])).toEqual([
      'https://a: card title "Old" differs from the essay\'s "T"',
      "https://c: card has no essay page",
      "https://a: card is below an older essay; cards run newest first",
    ]);
  });

  test("reports a card listed twice", () => {
    expect(checkCards([a, b], [{ ...asCard(a), title: "Stale" }, asCard(a), asCard(b)])).toEqual([
      "https://a: more than one card on essays.html",
    ]);
  });

  test("reports an essay without a card", () => {
    expect(checkCards([a, b], [asCard(a)])).toEqual(["https://b: no card on essays.html"]);
  });
});

test("lastModified is the page's latest date, or null without one", () => {
  expect(lastModified(fixture("essay.html"))).toBe("2026-03-16");
  expect(lastModified(fixture("cards.html"))).toBe("2026-04-06");
  expect(lastModified("")).toBeNull();
  expect(lastModified('<time datetime="2024-01-01">x</time><time datetime="PT5M">y</time>')).toBe("2024-01-01");
});
