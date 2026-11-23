import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { todoistWidget } from ".";
import * as api from "./api";
import {
  hashPassword,
  securityItem,
  verifyPassword,
} from "@/core/security/password";

import {
  cacheItem,
  projectsItem,
  todoistPasswordItem,
  tokenItem,
} from "./storage";
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
  description?: string;
  labels?: string[];
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
          { id: "inbox", name: "Inbox", inbox_project: true },
        ],
      });
    if (path === "/labels")
      return json({
        results: [
          { id: "l1", name: "phone" },
          { id: "l2", name: "home" },
        ],
      });
    if (path === "/tasks" && method === "POST") {
      const fields = body as Record<string, unknown>;
      const task: FakeTask = {
        id: String(nextId++),
        content: String(fields.content),
        priority: Number(fields.priority ?? 1),
        project_id: String(fields.project_id ?? "inbox"),
        description: String(fields.description ?? ""),
        labels: (fields.labels as string[] | undefined) ?? [],
        due:
          typeof fields.due_string === "string"
            ? { date: "2026-11-23", string: fields.due_string }
            : null,
      };
      tasks.push(task);
      return json(task);
    }
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
    if (update && method === "DELETE") {
      tasks.splice(
        tasks.findIndex((t) => t.id === update[1]),
        1,
      );
      return new Response(null, { status: 204 });
    }
    if (update && method === "POST") {
      const task = tasks.find((t) => t.id === update[1]);
      if (!task) return new Response("{}", { status: 404 });
      const changes = body as Record<string, string | number>;
      if (typeof changes.content === "string") task.content = changes.content;
      if (typeof changes.description === "string")
        task.description = changes.description;
      if (Array.isArray(changes.labels))
        task.labels = changes.labels as unknown as string[];
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
    writes: () => requests.filter((r) => r.method !== "GET"),
  };
}

const task = (id: string, content: string, due = "today"): FakeTask => ({
  id,
  content,
  priority: 1,
  project_id: "inbox",
  due: due ? { date: "2026-11-23", string: due } : null,
});

/** A task's title in the list (not the add box's highlight mirror). */
const findTask = (name: string) =>
  screen.findByText(name, { selector: ".todoist__name" });

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

    expect(await findTask("Buy milk")).toBeInTheDocument();
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

  it("creates a task with every detail from the full form", async () => {
    await start();
    await screen.findByText("Nothing to do.");
    await waitFor(async () =>
      expect(await projectsItem.getValue()).not.toBeNull(),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "New task with details" }),
    );

    // One form at a time
    expect(
      screen.queryByRole("textbox", { name: "Add a task" }),
    ).not.toBeInTheDocument();
    const form = screen.getByRole("form", { name: "New task" });
    expect(within(form).getByRole("textbox", { name: "Due date" })).toHaveValue(
      "today",
    );
    expect(within(form).getByRole("combobox", { name: "Project" })).toHaveValue(
      "inbox",
    );

    await userEvent.type(
      within(form).getByRole("textbox", { name: "Task name" }),
      "Book flights",
    );
    await userEvent.type(
      within(form).getByRole("textbox", { name: "Description" }),
      "Window seat",
    );
    await userEvent.selectOptions(
      within(form).getByRole("combobox", { name: "Project" }),
      "My Project",
    );
    await userEvent.click(
      await within(form).findByRole("button", { name: "@phone" }),
    );
    await userEvent.click(within(form).getByRole("radio", { name: "P2" }));
    await userEvent.click(
      within(form).getByRole("button", { name: "Add task" }),
    );

    expect(await findTask("Book flights")).toBeInTheDocument();
    expect(server.writes()).toEqual([
      {
        method: "POST",
        path: "/tasks",
        body: {
          content: "Book flights",
          description: "Window seat",
          labels: ["phone"],
          priority: 3,
          project_id: "p1",
          due_string: "today",
        },
      },
    ]);
    expect(
      screen.getByRole("textbox", { name: "Add a task" }),
    ).toBeInTheDocument();
  });

  it("shows details when a task is clicked, without leaving the page", async () => {
    await start([
      {
        ...task("1", "Plan offsite"),
        priority: 4,
        project_id: "p1",
        description: "Pick a venue",
        labels: ["home"],
      },
    ]);
    await waitFor(async () =>
      expect(await projectsItem.getValue()).not.toBeNull(),
    );
    const title = await screen.findByRole("button", { name: /^Plan offsite/ });
    expect(title).toHaveTextContent("P1");
    expect(title).toHaveTextContent("My Project");

    await userEvent.click(title);
    const details = screen.getByRole("region", {
      name: 'Details of "Plan offsite"',
    });
    expect(details).toHaveTextContent("Pick a venue");
    expect(details).toHaveTextContent("@home");
    expect(title).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(title);
    expect(
      screen.queryByRole("region", { name: /^Details of/ }),
    ).not.toBeInTheDocument();
  });

  it("deletes a task only after confirming", async () => {
    await start([task("1", "Old idea")]);
    await userEvent.click(
      await screen.findByRole("button", { name: 'Edit "Old idea"' }),
    );

    const remove = screen.getByRole("button", { name: "Delete" });
    await userEvent.click(remove);
    expect(server.writes()).toEqual([]);
    expect(remove).toHaveTextContent("Delete task?");

    await userEvent.click(remove);
    await waitFor(() => expect(screen.queryByText("Old idea")).toBeNull());
    expect(server.writes()).toEqual([
      { method: "DELETE", path: "/tasks/1", body: null },
    ]);
  });

  it("edits the description and labels", async () => {
    await start([{ ...task("1", "Call"), labels: ["home"] }]);
    await userEvent.click(
      await screen.findByRole("button", { name: 'Edit "Call"' }),
    );
    const form = screen.getByRole("form", { name: 'Edit "Call"' });
    // The add box hides while editing
    expect(
      screen.queryByRole("textbox", { name: "Add a task" }),
    ).not.toBeInTheDocument();

    await userEvent.type(
      within(form).getByRole("textbox", { name: "Description" }),
      "About the lease",
    );
    expect(within(form).getByRole("button", { name: "@home" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await userEvent.click(within(form).getByRole("button", { name: "@home" }));
    await userEvent.click(within(form).getByRole("button", { name: "@phone" }));
    await userEvent.click(within(form).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.queryByRole("form")).toBeNull());
    expect(server.writes()).toEqual([
      {
        method: "POST",
        path: "/tasks/1",
        body: { description: "About the lease", labels: ["phone"] },
      },
    ]);
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

    expect(await findTask("Final")).toBeInTheDocument();
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

  it("hides tasks behind the eye button and remembers it", async () => {
    server = fakeTodoist([task("1", "Secret plan"), task("2", "Gift for Sam")]);
    fetchMock.mockImplementation(server.handler);
    await tokenItem.setValue("tok");
    const setData = vi.fn();
    const { rerender } = render(
      <Todoist instance={instance} data={data} setData={setData} />,
    );
    await findTask("Secret plan");

    await userEvent.click(screen.getByRole("button", { name: "Hide tasks" }));
    expect(setData).toHaveBeenLastCalledWith({ ...data, hidden: true });

    // The saved value is what a new tab reads
    rerender(
      <Todoist
        instance={instance}
        data={{ ...data, hidden: true }}
        setData={setData}
      />,
    );
    expect(screen.getByText("2 tasks hidden.")).toBeInTheDocument();
    expect(screen.queryByText(/Secret plan|Gift for Sam/)).toBeNull();
    expect(
      screen.queryByRole("textbox", { name: "Add a task" }),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Show tasks" }));
    expect(setData).toHaveBeenLastCalledWith({ ...data, hidden: false });
  });

  it("starts every tab hidden when hide on open is set", async () => {
    server = fakeTodoist([task("1", "Private")]);
    fetchMock.mockImplementation(server.handler);
    await tokenItem.setValue("tok");
    const setData = vi.fn();
    render(
      <Todoist
        instance={instance}
        data={{ ...data, hideOnOpen: true }}
        setData={setData}
      />,
    );

    expect(await screen.findByText("1 task hidden.")).toBeInTheDocument();
    expect(screen.queryByText("Private")).toBeNull();

    // Showing lasts for this tab only, so nothing is saved
    await userEvent.click(screen.getByRole("button", { name: "Show tasks" }));
    expect(await findTask("Private")).toBeInTheDocument();
    expect(setData).not.toHaveBeenCalled();
  });

  it("closes an open form when hiding", async () => {
    await start([task("1", "Draft")]);
    await userEvent.click(
      await screen.findByRole("button", { name: 'Edit "Draft"' }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Hide tasks" }));
    // The test's setData does not persist, so the widget stays shown
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("asks for the Weborg password before showing hidden tasks", async () => {
    await securityItem.setValue({
      password: await hashPassword("letmein", 1000),
      requireForUnlock: false,
    });
    server = fakeTodoist([task("1", "Private")]);
    fetchMock.mockImplementation(server.handler);
    await tokenItem.setValue("tok");
    const setData = vi.fn();
    render(
      <Todoist
        instance={instance}
        data={{ ...data, hidden: true, showPassword: "weborg" }}
        setData={setData}
      />,
    );

    await screen.findByText("1 task hidden.");
    await waitFor(async () =>
      expect((await securityItem.getValue()).password).not.toBeNull(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Show tasks" }));
    await userEvent.type(
      screen.getByLabelText("Weborg password"),
      "guess{Enter}",
    );
    expect(await screen.findByText("Wrong password.")).toBeInTheDocument();
    expect(setData).not.toHaveBeenCalled();

    await userEvent.type(
      screen.getByLabelText("Weborg password"),
      "letmein{Enter}",
    );
    await waitFor(() =>
      expect(setData).toHaveBeenCalledWith({
        ...data,
        hidden: false,
        showPassword: "weborg",
      }),
    );
  });

  it("uses a separate Todoist password when chosen", async () => {
    await todoistPasswordItem.setValue(await hashPassword("tasks!", 1000));
    server = fakeTodoist([task("1", "Private")]);
    fetchMock.mockImplementation(server.handler);
    await tokenItem.setValue("tok");
    render(
      <Todoist
        instance={instance}
        data={{ ...data, hideOnOpen: true, showPassword: "separate" }}
        setData={vi.fn()}
      />,
    );
    await screen.findByText("1 task hidden.");
    await waitFor(async () =>
      expect(await todoistPasswordItem.getValue()).not.toBeNull(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Show tasks" }));
    await userEvent.type(
      screen.getByLabelText("Todoist password"),
      "tasks!{Enter}",
    );
    expect(await findTask("Private")).toBeInTheDocument();
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

  it("sets a separate Todoist password", async () => {
    const setData = vi.fn();
    render(
      <TodoistSettings
        instance={instance}
        data={{ ...data, showPassword: "separate" }}
        setData={setData}
      />,
    );
    await userEvent.type(
      await screen.findByLabelText("New password"),
      "tasks!",
    );
    await userEvent.type(
      screen.getByLabelText("Repeat the password"),
      "tasks!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Set Todoist password" }),
    );

    await waitFor(async () =>
      expect(await todoistPasswordItem.getValue()).not.toBeNull(),
    );
    const record = await todoistPasswordItem.getValue();
    expect(record && (await verifyPassword(record, "tasks!"))).toBe(true);
  });

  it("needs the current password to stop protecting hidden tasks", async () => {
    await todoistPasswordItem.setValue(await hashPassword("tasks!", 1000));
    const setData = vi.fn();
    render(
      <TodoistSettings
        instance={instance}
        data={{ ...data, showPassword: "separate" }}
        setData={setData}
      />,
    );
    const select = await screen.findByRole("combobox", {
      name: "Password to show hidden tasks",
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Change Todoist password" }),
      ).toBeInTheDocument(),
    );
    await userEvent.selectOptions(select, "No password");
    expect(setData).not.toHaveBeenCalled();

    await userEvent.type(
      screen.getByLabelText("Current Todoist password"),
      "tasks!{Enter}",
    );
    await waitFor(() =>
      expect(setData).toHaveBeenCalledWith({ ...data, showPassword: "none" }),
    );
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
