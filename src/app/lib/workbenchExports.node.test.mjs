import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkbenchExport, closestAvailableWeight } from "./workbenchExports.ts";
import { DEFAULT_WORKBENCH_SETTINGS, parseWorkbenchSearch, sameSerializedSearch, serializeWorkbenchSearch } from "./workbenchUrl.ts";

const roles = [
  {
    role: "heading",
    family: "Example Serif",
    stack: "'Example Serif', serif",
    fallback: "serif",
    weight: 500,
    style: "normal",
    lineHeight: 1.1,
    tracking: -0.02,
    sourceLabel: "Google Fonts",
    sourceUrl: "https://fonts.google.com/specimen/Example+Serif",
    sourceCss: '@import url("https://fonts.googleapis.com/css2?family=Example+Serif:wght@500&display=swap");',
  },
  {
    role: "body",
    family: "Example Sans",
    stack: "'Example Sans', sans-serif",
    fallback: "sans-serif",
    weight: 400,
    style: "normal",
    lineHeight: 1.55,
    tracking: 0,
    sourceLabel: "Independent",
    sourceUrl: "https://example.test/font",
    sourceCss: "/* Example Sans: connect stylesheet from verified source https://example.test/font; no font binary embedded. */",
  },
];

test("URL codec is canonical, includes an authoritative empty fonts marker, and strips legacy text", () => {
  const parsed = parseWorkbenchSearch("?ratio=1.250&content=private&h=old-heading&fonts=");
  assert.equal(parsed.settings.scaleRatio, 1.25);
  assert.equal(parsed.settings.headingFontId, "old-heading");
  assert.equal(parsed.sharedText, "private");
  assert.equal(parsed.hasFontsMarker, true);
  assert.deepEqual(parsed.fontIds, []);

  const serialized = serializeWorkbenchSearch(parsed.settings, [], "?ratio=1.250&content=private&h=old-heading");
  assert.equal(serialized.get("fonts"), "");
  assert.equal(serialized.get("ratio"), "1.25");
  assert.equal(serialized.has("content"), false);
  assert.equal(serialized.has("h"), false);
  assert.equal(serializeWorkbenchSearch(parsed.settings, [], serialized).toString(), serialized.toString());
  assert.equal(sameSerializedSearch(serialized, serializeWorkbenchSearch(parsed.settings, [], serialized)), true);
});

test("invalid URL values fall back to stable defaults", () => {
  const parsed = parseWorkbenchSearch("?mode=nope&preset=nope&base=&ratio=1.3&line=9&tracking=-1");
  assert.deepEqual(parsed.settings, DEFAULT_WORKBENCH_SETTINGS);
});

test("sharing text is opt-in and bounded", () => {
  const serialized = serializeWorkbenchSearch(DEFAULT_WORKBENCH_SETTINGS, ["a", "b"], "", "x".repeat(1200));
  assert.equal(serialized.get("shareText"), "1");
  assert.equal(serialized.get("content")?.length, 1000);
});

test("export formats carry real role typography and source guidance", () => {
  const config = { version: 1, roles };
  const css = buildWorkbenchExport("css", config);
  const v4 = buildWorkbenchExport("tailwind-v4", config);
  const v3 = buildWorkbenchExport("tailwind-v3", config);
  const json = JSON.parse(buildWorkbenchExport("json", config));

  assert.match(css, /--onod-weight-heading: 500/);
  assert.match(css, /--onod-fallback-heading: serif/);
  assert.match(css, /no font binary embedded/);
  assert.match(v4, /@theme/);
  assert.match(v3, /Legacy Tailwind CSS v3/);
  assert.equal(json.version, 1);
  assert.equal(json.roles.heading.style, "normal");
  assert.equal(json.roles.body.source.label, "Independent");
});

test("normal preview weight selects 400 or the closest real weight", () => {
  assert.equal(closestAvailableWeight(["300", "500"]), 300);
  assert.equal(closestAvailableWeight(["400", "700"]), 400);
  assert.equal(closestAvailableWeight([], 400), 400);
});
