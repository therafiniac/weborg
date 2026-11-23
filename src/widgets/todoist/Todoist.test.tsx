import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { todoistWidget } from ".";
import * as api from "./api";
import { cacheItem, projectsItem, tokenItem } from "./storage";
import Todoist from "./Todoist";
import TodoistSettings from "./TodoistSettings";

vi.mock("./api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./api")>()),
  hasHostAccess: vi.fn(),
  requestHostAccess: vi.fn(),
}));

const instance = {
  id: "t",
  type: "todoist",
  position: "middle-centre" as const,
  order: 0,
  display: {},
};
const data = todoistWidget.defaultData;

const results = (...tasks: { id: string; content: string }[]) =>
  new Response(JSON.stringify({ results: tasks, next_cursor: null }), {
    status: 200,
  });

interface FakeTask {
  id: string;
  content: string;
  priority: number;
  project_id: string;
  due: { date: string; string: string } | null;
}

/** A tiny in-memory Todoist. Filtered lists show only tasks due "today". */
function fakeTodoist(initial: FakeTask[] = []) {
  const tasks = [...initial];
  const requests: { method: string; path: string; body: unknown }[] = [];
  let nextId = 100;
  let failNext: Response | Error | null = null;
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200 });

  const handler = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const path = url.pathname.replace("/api/v1", "");
    const method = init?.method ?? "GET";
    const body: unknown = init?.body ? JSON.parse(String(init.body)) : null;
    requests.push({ method, path, body });
    if (failNext) {
      const failure = failNext;
      failNext = null;
      if (failure instanceof Error) throw failure;
      return failure;
    }

    if (path === "/projects")
      return json({
        results: [
          { id: "p1", name: "My Project" },
          { id: "inbox", name: "Inbox" },
        ],
      });
    if (path === "/tasks/filter")
      return json({ results: tasks.filter((t) => t.due?.string === "today") });
    if (path === "/tasks/quick") {
      const text = (body as { text: string }).text;
      const task: FakeTask = {
        id: String(nextId++),
        content: text.replace(/\s*#\S+/g, "").replace(/\s*tomorrow/, ""),
        priority: 1,
        project_id: text.includes("#") ? "p1" : "inbox",
        due: text.includes("tomorrow")
          ? { date: "2026-11-24", string: "tomorrow" }
          : null,
      };
      tasks.push(task);
      return json(task);
    }
    const move = /^\/tasks\/(\w+)\/move$/.exec(path);
    if (move) {
      const task = tasks.find((t) => t.id === move[1]);
      if (!task) return new Response("{}", { status: 404 });
      task.project_id = (body as { project_id: string }).project_id;
      return json(task);
    }
    const close = /^\/tasks\/(\w+)\/close$/.exec(path);
    if (close) {
      tasks.splice(
        tasks.findIndex((t) => t.id === close[1]),
        1,
      );
      return new Response(null, { status: 204 });
    }
    const update = /^\/tasks\/(\w+)$/.exec(path);
    if (update && method === "POST") {
      const task = tasks.find((t) => t.id === update[1]);
      if (!task) return new Response("{}", { status: 404 });
      const changes = body as Record<string, string | number>;
      if (typeof changes.content === "string") task.content = changes.content;
      if (typeof changes.priority === "number")
        task.priority = changes.priority;
      if (changes.due_string === "no date") task.due = null;
      else if (typeof changes.due_string === "string")
        task.due = { date: "2026-11-23", string: changes.due_string };
      if (typeof changes.due_date === "string")
        task.due = { date: changes.due_date, string: changes.due_date };
      return json(task);
    }
    return new Response("{}", { status: 404 });
  };

  return {
    tasks,
    requests,
    handler,
    fail(response: Response | Error) {
      failNext = response;
    },
    writes: () => requests.filter((r) => r.method === "POST"),
  };
}

const task = (id: string, content: string, due = "today"): FakeTask => ({
  id,
  content,
  priority: 1,
  project_id: "inbox",
  due: due ? { date: "2026-11-23", string: due } : null,
});

describe("Todoist widget", () => {
  const fetchMock = vi.fn<typeof fetch>();
  let server: ReturnType<typeof fakeTodoist>;

  const start = async (
    tasks: FakeTask[] = [],
    props: { locked?: boolean } = {},
  ) => {
    server = fakeTodoist(tasks);
    fetchMock.mockImplementation(server.handler);
    await tokenItem.setValue("tok");
    render(
      <Todoist instance={instance} data={data} setData={vi.fn()} {...props} />,
    );
  };

  beforeEach(() => {
    fakeBrowser.reset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(api.requestHostAccess).mockResolvedValue(true);
    vi.mocked(api.hasHostAccess).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks to connect when there is no token", async () => {
    render(<Todoist instance={instance} data={data} setData={vi.fn()} />);
    expect(
      await screen.findByText(/Connect Todoist in this widget's settings/),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("lists tasks and completes one", async () => {
    await start([task("1", "Write tests"), task("2", "Ship")]);
    expect(await screen.findByText("Write tests")).toBeInTheDocument();
    expect(await cacheItem.getValue()).toHaveProperty(["today | overdue"]);

    await userEvent.click(
      screen.getByRole("button", { name: 'Complete "Write tests"' }),
    );
    expect(screen.queryByText("Write tests")).not.toBeInTheDocument();
    expect(server.writes()).toEqual([
      { method: "POST", path: "/tasks/1/close", body: null },
    ]);
  });

  it("puts a task back when completing fails", async () => {
    await start([task("1", "Stay")]);
    await screen.findByText("Stay");

    server.fail(new TypeError("offline"));
    await userEvent.click(
      screen.getByRole("button", { name: 'Complete "Stay"' }),
    );
    expect(await screen.findByText("Stay")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Offline");
  });

  it("shows cached tasks when offline", async () => {
    await tokenItem.setValue("tok");
    await cacheItem.setValue({
      "today | overdue": {
        tasks: [{ id: "1", content: "Cached", priority: 1, due: null }],
        fetchedAt: 1,
      },
    });
    fetchMock.mockRejectedValue(new TypeError("offline"));
    render(<Todoist instance={instance} data={data} setData={vi.fn()} />);

    expect(await screen.findByText("Cached")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Offline. Showing saved tasks.",
    );
  });

  it("explains a rejected token", async () => {
    await tokenItem.setValue("bad");
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));
    render(<Todoist instance={instance} data={data} setData={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Todoist rejected the token",
    );
  });

  it("adds through Quick Add and gives undated tasks the default date", async () => {
    await start();
    await screen.findByText("Nothing to do.");

    const input = screen.getByRole("textbox", { name: "Add a task" });
    await userEvent.type(input, "Buy milk{Enter}");

    expect(
      await screen.findByRole("link", { name: "Buy milk today" }),
    ).toBeInTheDocument();
    expect(input).toHaveValue("");
    expect(server.writes()).toEqual([
      { method: "POST", path: "/tasks/quick", body: { text: "Buy milk" } },
      { method: "POST", path: "/tasks/100", body: { due_string: "today" } },
    ]);
  });

  it("keeps a typed date and says where a hidden task went", async () => {
    await start();
    await screen.findByText("Nothing to do.");
    await waitFor(async () =>
      expect(await projectsItem.getValue()).not.toBeNull(),
    );

    await userEvent.type(
      screen.getByRole("textbox", { name: "Add a task" }),
      "Plan trip tomorrow #My Project{Enter}",
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Added to My Project, tomorrow.",
    );
    // Known names with spaces are escaped for Quick Add; no default date added
    expect(server.writes()).toEqual([
      {
        method: "POST",
        path: "/tasks/quick",
        body: { text: "Plan trip tomorrow #My\\ Project" },
      },
    ]);
  });

  it("uses a picked date instead of the default", async () => {
    await start();
    await screen.findByText("Nothing to do.");

    const picker = document.querySelector<HTMLInputElement>(
      ".todoist-date__picker",
    );
    if (!picker) throw new Error("no date picker");
    fireEvent.change(picker, { target: { value: "2026-12-05" } });
    expect(
      screen.getByRole("button", { name: "Clear date" }),
    ).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole("textbox", { name: "Add a task" }),
      "Dentist{Enter}",
    );
    await waitFor(() => expect(server.writes()).toHaveLength(2));
    expect(server.writes()[1]).toEqual({
      method: "POST",
      path: "/tasks/100",
      body: { due_date: "2026-12-05" },
    });
    expect(
      screen.queryByRole("button", { name: "Clear date" }),
    ).not.toBeInTheDocument();
  });

  it("highlights Quick Add syntax while typing", async () => {
    await start();
    await screen.findByText("Nothing to do.");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Add a task" }),
      "Call mom tomorrow p1",
    );
    const marks = [...document.querySelectorAll("mark")].map(
      (m) => m.textContent,
    );
    expect(marks).toEqual(["tomorrow", "p1"]);
  });

  it("edits a task's name, date and priority", async () => {
    await start([task("1", "Draft")]);
    await userEvent.click(
      await screen.findByRole("button", { name: 'Edit "Draft"' }),
    );

    const editor = screen.getByRole("form", { name: 'Edit "Draft"' });
    const name = within(editor).getByRole("textbox", { name: "Task name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Final");
    await userEvent.clear(
      within(editor).getByRole("textbox", { name: "Due date" }),
    );
    await userEvent.click(within(editor).getByRole("radio", { name: "P1" }));
    await userEvent.click(within(editor).getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Final")).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(server.writes()).toEqual([
      {
        method: "POST",
        path: "/tasks/1",
        body: { content: "Final", priority: 4, due_string: "no date" },
      },
    ]);
  });

  it("moves a task to another project", async () => {
    await start([task("1", "Errand")]);
    await waitFor(async () =>
      expect(await projectsItem.getValue()).not.toBeNull(),
    );
    await userEvent.click(
      await screen.findByRole("button", { name: 'Edit "Errand"' }),
    );
    const project = screen.getByRole("combobox", { name: "Project" });
    expect(project).toHaveValue("inbox");

    await userEvent.selectOptions(project, "My Project");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.queryByRole("form")).toBeNull());
    // Only the move: nothing else changed
    expect(server.writes()).toEqual([
      { method: "POST", path: "/tasks/1/move", body: { project_id: "p1" } },
    ]);
    expect(server.tasks[0]?.project_id).toBe("p1");
  });

  it("cancels editing with Escape without saving", async () => {
    await start([task("1", "Keep")]);
    await userEvent.click(
      await screen.findByRole("button", { name: 'Edit "Keep"' }),
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Task name" }),
      " me{Escape}",
    );

    expect(screen.getByText("Keep")).toBeInTheDocument();
    expect(server.writes()).toEqual([]);
  });

  it("still adds and edits when the page is locked", async () => {
    await start([task("1", "Locked")], { locked: true });
    await screen.findByText("Locked");
    expect(
      screen.getByRole("textbox", { name: "Add a task" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: 'Edit "Locked"' }),
    ).toBeInTheDocument();
  });

  it("clears the added notice after a while", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await start();
      await screen.findByText("Nothing to do.");
      await user.type(
        screen.getByRole("textbox", { name: "Add a task" }),
        "Later tomorrow{Enter}",
      );
      await screen.findByRole("status");
      act(() => vi.advanceTimersByTime(8000));
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Todoist settings", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fakeBrowser.reset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.mocked(api.requestHostAccess).mockResolvedValue(true);
    vi.mocked(api.hasHostAccess).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderSettings = () =>
    render(
      <TodoistSettings instance={instance} data={data} setData={vi.fn()} />,
    );

  it("saves the token once Todoist accepts it", async () => {
    fetchMock.mockResolvedValue(results());
    renderSettings();
    await userEvent.type(
      await screen.findByLabelText("Todoist API token"),
      " tok ",
    );
    await userEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(
      await screen.findByText("Connected to Todoist."),
    ).toBeInTheDocument();
    expect(await tokenItem.getValue()).toBe("tok");
  });

  it("does not save a rejected token", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 401 }));
    renderSettings();
    await userEvent.type(
      await screen.findByLabelText("Todoist API token"),
      "bad",
    );
    await userEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(
      await screen.findByText(/That token was not accepted/),
    ).toBeInTheDocument();
    expect(await tokenItem.getValue()).toBe("");
  });

  it("stops when site access is declined", async () => {
    vi.mocked(api.requestHostAccess).mockResolvedValue(false);
    renderSettings();
    await userEvent.type(
      await screen.findByLabelText("Todoist API token"),
      "tok",
    );
    await userEvent.click(screen.getByRole("button", { name: "Connect" }));

    expect(await screen.findByText(/needs permission/)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("disconnects and clears cached tasks", async () => {
    await tokenItem.setValue("tok");
    await cacheItem.setValue({ x: { tasks: [], fetchedAt: 1 } });
    renderSettings();
    await userEvent.click(
      await screen.findByRole("button", { name: "Disconnect" }),
    );

    await waitFor(async () => expect(await tokenItem.getValue()).toBe(""));
    expect(await cacheItem.getValue()).toEqual({});
  });
});
