import { todoistWidget } from ".";
import type { TodoistTask } from "./api";
import {
  dayLabel,
  decodeView,
  dueText,
  encodeView,
  groupTasks,
  showsProject,
  viewQuery,
  type TodoistView,
} from "./views";

const TODAY = "2026-11-23";

const task = (id: string, date: string | null): TodoistTask => ({
  id,
  content: id,
  priority: 1,
  due: date ? { date, string: date } : null,
});

describe("view queries", () => {
  it("includes overdue tasks in Today and the upcoming views, like Todoist", () => {
    expect(viewQuery({ kind: "today" })).toEqual({
      kind: "filter",
      query: "today | overdue",
    });
    expect(viewQuery({ kind: "next7" })).toEqual({
      kind: "filter",
      query: "overdue | 7 days",
    });
    expect(viewQuery({ kind: "upcoming" })).toEqual({
      kind: "filter",
      query: "!no date",
    });
  });

  it("loads projects and labels by exact id and name", () => {
    expect(viewQuery({ kind: "project", id: "42" })).toEqual({
      kind: "project",
      id: "42",
    });
    expect(viewQuery({ kind: "label", name: "deep work" })).toEqual({
      kind: "label",
      name: "deep work",
    });
    expect(viewQuery({ kind: "filter", query: "  " })).toEqual({ kind: "all" });
  });

  it("round-trips views through select values", () => {
    const views: TodoistView[] = [
      { kind: "today" },
      { kind: "inbox" },
      { kind: "next7" },
      { kind: "upcoming" },
      { kind: "project", id: "7" },
      { kind: "label", name: "a:b" },
    ];
    for (const view of views)
      expect(decodeView(encodeView(view))).toEqual(view);
    expect(decodeView("filter", "#Work")).toEqual({
      kind: "filter",
      query: "#Work",
    });
  });
});

describe("sections", () => {
  it("splits Today into Overdue and Today", () => {
    const groups = groupTasks(
      [task("late", "2026-11-20"), task("now", TODAY)],
      { kind: "today" },
      TODAY,
    );
    expect(groups.map((g) => [g.title, g.tasks.map((t) => t.id)])).toEqual([
      ["Overdue", ["late"]],
      ["Today", ["now"]],
    ]);
  });

  it("needs no heading when Today has nothing overdue", () => {
    expect(
      groupTasks([task("now", TODAY)], { kind: "today" }, TODAY)[0]?.title,
    ).toBeNull();
  });

  it("groups the upcoming views by day", () => {
    const groups = groupTasks(
      [
        task("late", "2026-11-01"),
        task("a", TODAY),
        task("b", "2026-11-24T09:00:00"),
        task("c", "2026-11-24"),
        task("d", "2026-12-10"),
      ],
      { kind: "upcoming" },
      TODAY,
    );
    expect(groups.map((g) => [g.title, g.tasks.length])).toEqual([
      ["Overdue", 1],
      ["Today", 1],
      ["Tomorrow", 2],
      [dayLabel("2026-12-10", TODAY), 1],
    ]);
  });

  it("does not split project views", () => {
    const groups = groupTasks(
      [task("a", "2026-11-01"), task("b", null)],
      { kind: "project", id: "1" },
      TODAY,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.title).toBeNull();
  });
});

describe("row details", () => {
  it("shows only what the view does not already say", () => {
    const today: TodoistView = { kind: "today" };
    expect(dueText(task("a", TODAY), today, TODAY)).toBe("");
    expect(dueText(task("a", "2026-11-23T17:00:00"), today, TODAY)).toMatch(
      /5:00/,
    );
    expect(dueText(task("a", "2026-11-22"), today, TODAY)).toBe("Yesterday");

    const project: TodoistView = { kind: "project", id: "1" };
    expect(dueText(task("a", TODAY), project, TODAY)).toBe("Today");
    expect(dueText(task("a", "2026-11-24"), project, TODAY)).toBe("Tomorrow");
    expect(showsProject(project)).toBe(false);
    expect(showsProject({ kind: "inbox" })).toBe(false);
    expect(showsProject(today)).toBe(true);
  });
});

describe("data migration", () => {
  const migrate = todoistWidget.migrations![2]!;

  it("turns the old default filter into the Today view", () => {
    expect(
      migrate({ title: "Today", filter: "today | overdue", maxTasks: 8 }),
    ).toEqual({ title: "", view: { kind: "today" }, maxTasks: 8 });
  });

  it("keeps a custom filter and title", () => {
    expect(migrate({ title: "Work", filter: "#Work" })).toEqual({
      title: "Work",
      view: { kind: "filter", query: "#Work" },
    });
  });
});
