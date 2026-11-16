import {
  addItem,
  findLink,
  moveItem,
  moveLinkTo,
  parentOf,
  removeItem,
  updateItem,
} from "./items";
import type { Folder, Item, Link } from "./model";
import {
  glassPreset,
  hexToRgba,
  plainPreset,
  resolveStyle,
  styleClasses,
  styleVars,
} from "./style";
import { hostname, linkLabel, normalizeUrl } from "./url";

const link = (id: string): Link => ({
  kind: "link",
  id,
  url: `https://${id}.test/`,
  name: "",
  icon: "auto",
});
const folder = (id: string, links: Link[] = []): Folder => ({
  kind: "folder",
  id,
  name: id,
  icon: "folder",
  links,
});
const ids = (items: Item[]) =>
  items.map((item) =>
    item.kind === "folder"
      ? `${item.id}[${item.links.map((l) => l.id).join(",")}]`
      : item.id,
  );

describe("normalizeUrl()", () => {
  it.each([
    ["github.com", "https://github.com/"],
    ["  https://example.com/a?b=1 ", "https://example.com/a?b=1"],
    ["http://localhost:3000", "http://localhost:3000/"],
    ["localhost:3000", "https://localhost:3000/"],
    ["example.com:8080/x", "https://example.com:8080/x"],
  ])("accepts %s", (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });

  it.each([
    "",
    "javascript:alert(1)",
    "data:text/html,hi",
    "ftp://example.com",
    "not a url",
    "intranet",
  ])("rejects %j", (input) => {
    expect(normalizeUrl(input)).toBeNull();
  });

  it("labels links by name, then domain", () => {
    expect(linkLabel({ name: " Mail ", url: "https://x.test" })).toBe("Mail");
    expect(linkLabel({ name: "", url: "https://www.example.com/a" })).toBe(
      "example.com",
    );
    expect(hostname("::bad")).toBe("::bad");
  });
});

describe("link items", () => {
  const items: Item[] = [
    link("a"),
    folder("f", [link("b"), link("c")]),
    link("d"),
  ];

  it("finds links and their parent at any level", () => {
    expect(findLink(items, "c")?.id).toBe("c");
    expect(parentOf(items, "a")).toBeNull();
    expect(parentOf(items, "c")).toBe("f");
    expect(parentOf(items, "zzz")).toBeUndefined();
  });

  it("adds links at the top level or into a folder, never nests folders", () => {
    expect(ids(addItem(items, link("e")))).toEqual(["a", "f[b,c]", "d", "e"]);
    expect(ids(addItem(items, link("e"), "f"))).toEqual(["a", "f[b,c,e]", "d"]);
    expect(ids(addItem(items, folder("g"), "f"))).toEqual(ids(items));
  });

  it("updates and removes items at any level", () => {
    const updated = updateItem<Link>(items, "b", { name: "Bee" });
    expect(findLink(updated, "b")?.name).toBe("Bee");
    expect(ids(removeItem(items, "b"))).toEqual(["a", "f[c]", "d"]);
    expect(ids(removeItem(items, "f"))).toEqual(["a", "d"]);
  });

  it("moves items within their own list", () => {
    expect(ids(moveItem(items, "d", -1))).toEqual(["a", "d", "f[b,c]"]);
    expect(ids(moveItem(items, "b", 1))).toEqual(["a", "f[c,b]", "d"]);
    expect(ids(moveItem(items, "a", -1))).toEqual(ids(items));
  });

  it("moves links between top level and folders", () => {
    expect(ids(moveLinkTo(items, "a", "f"))).toEqual(["f[b,c,a]", "d"]);
    expect(ids(moveLinkTo(items, "b", null))).toEqual(["a", "f[c]", "d", "b"]);
    expect(ids(moveLinkTo(items, "a", "missing"))).toEqual(ids(items));
    expect(ids(moveLinkTo(items, "f", null))).toEqual(ids(items));
  });
});

describe("link style", () => {
  it("fills missing style fields from the glass preset", () => {
    expect(resolveStyle({ radius: 4 })).toEqual({ ...glassPreset, radius: 4 });
  });

  it("converts colours with opacity", () => {
    expect(hexToRgba("#1e1e2e", 0.7)).toBe("rgba(30, 30, 46, 0.7)");
    expect(hexToRgba("#fff", 2)).toBe("rgba(255, 255, 255, 1)");
    expect(hexToRgba("nope", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
  });

  it("builds variables and classes", () => {
    const vars = styleVars(glassPreset, 0) as Record<string, string>;
    expect(vars["--links-columns"]).toBe("1");
    expect(vars["--links-border"]).toBe("rgba(205, 214, 244, 0.16)");
    expect(styleClasses(glassPreset)).toBe(
      "links links--tiles links--lift links--glow links--shine",
    );
    expect(styleClasses(plainPreset)).toBe("links links--plain links--lift");
  });
});
