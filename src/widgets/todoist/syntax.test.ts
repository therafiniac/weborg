import { prepareQuickAdd, tokenize, type TokenKind } from "./syntax";

/** Only the highlighted parts, as [kind, text]. */
const tokens = (text: string, projects: string[] = []) =>
  tokenize(text, projects)
    .filter((segment) => segment.kind)
    .map((segment) => [segment.kind as TokenKind, segment.text]);

describe("Quick Add highlighting", () => {
  it("keeps the text intact", () => {
    const text = "Call mom tomorrow 5pm #Personal @phone p1 // bring cake";
    expect(
      tokenize(text)
        .map((s) => s.text)
        .join(""),
    ).toBe(text);
  });

  it("finds each kind of token", () => {
    expect(
      tokens("Call mom tomorrow 5pm #Personal @phone p1 // bring cake"),
    ).toEqual([
      ["date", "tomorrow 5pm"],
      ["project", "#Personal"],
      ["label", "@phone"],
      ["priority", "p1"],
      ["description", " // bring cake"],
    ]);
  });

  it("recognises common date forms", () => {
    const date = (text: string) =>
      tokens(text).find(([kind]) => kind === "date")?.[1];
    expect(date("pay rent today")).toBe("today");
    expect(date("gym next monday at 7am")).toBe("next monday at 7am");
    expect(date("standup every weekday 9:30")).toBe("every weekday 9:30");
    expect(date("trip Dec 5th")).toBe("Dec 5th");
    expect(date("report 5 jan 2027")).toBe("5 jan 2027");
    expect(date("dentist 2026-12-05")).toBe("2026-12-05");
    expect(date("review in 3 days")).toBe("in 3 days");
    expect(date("call at 5pm")).toBe("at 5pm");
    expect(date("fri drinks")).toBe("fri");
  });

  it("does not mistake ordinary words for dates", () => {
    expect(tokens("I may sun the plants on sat")).toEqual([["date", "on sat"]]);
    expect(tokens("todays plan")).toEqual([]);
    expect(tokens("#today is a project")).toEqual([["project", "#today"]]);
  });

  it("takes the first date and priority only, like Todoist", () => {
    expect(tokens("today p1 tomorrow p2")).toEqual([
      ["date", "today"],
      ["priority", "p1"],
    ]);
  });

  it("matches known project names with spaces", () => {
    expect(tokens("plan #My Project /Next", ["My Project"])).toEqual([
      ["project", "#My Project"],
      ["section", "/Next"],
    ]);
    expect(tokens("plan #My\\ Project")).toEqual([
      ["project", "#My\\ Project"],
    ]);
  });

  it("only highlights sections after a project", () => {
    expect(tokens("read /docs")).toEqual([]);
  });

  it("leaves tokens inside a description alone", () => {
    expect(tokens("Buy milk // today p1")).toEqual([
      ["description", " // today p1"],
    ]);
  });

  it("highlights deadlines and reminders", () => {
    expect(tokens("Essay {friday} !30m")).toEqual([
      ["deadline", "{friday}"],
      ["reminder", "!30m"],
    ]);
  });
});

describe("prepareQuickAdd", () => {
  it("escapes spaces in known project names", () => {
    expect(
      prepareQuickAdd("plan #my project today", ["My Project", "Work"]),
    ).toBe("plan #my\\ project today");
    expect(prepareQuickAdd("plan #Work", ["Work"])).toBe("plan #Work");
  });
});
