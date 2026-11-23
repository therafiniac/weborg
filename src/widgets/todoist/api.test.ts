import {
  addTask,
  closeTask,
  fetchTasks,
  parseTasks,
  sortTasks,
  TodoistError,
  type TodoistTask,
} from "./api";

const task = (
  id: string,
  priority = 1,
  date: string | null = null,
): TodoistTask => ({
  id,
  content: id,
  priority,
  due: date ? { date, string: date } : null,
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("Todoist API client", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const call = (n: number) => {
    const args = fetchMock.mock.calls[n];
    if (!args) throw new Error(`fetch call ${n} was not made`);
    return args;
  };

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the filter endpoint with a bearer token", async () => {
    fetchMock.mockResolvedValue(json({ results: [], next_cursor: null }));
    await fetchTasks("tok", " today | overdue ");

    const [url, init] = call(0);
    expect(url).toBe(
      "https://api.todoist.com/api/v1/tasks/filter?limit=50&query=today+%7C+overdue",
    );
    expect(init?.headers).toEqual({ Authorization: "Bearer tok" });
  });

  it("lists every task when the filter is empty", async () => {
    fetchMock.mockResolvedValue(json({ results: [] }));
    await fetchTasks("tok", "  ");
    expect(call(0)[0]).toBe("https://api.todoist.com/api/v1/tasks?limit=50");
  });

  it("maps status codes to error kinds", async () => {
    const kindFor = async (response: Response | Error) => {
      if (response instanceof Error) fetchMock.mockRejectedValueOnce(response);
      else fetchMock.mockResolvedValueOnce(response);
      const error = await fetchTasks("tok", "").catch((e: unknown) => e);
      return error instanceof TodoistError ? error.kind : error;
    };

    expect(await kindFor(json({}, 401))).toBe("auth");
    expect(await kindFor(json({}, 403))).toBe("auth");
    expect(await kindFor(json({}, 429))).toBe("rate");
    expect(await kindFor(json({}, 500))).toBe("server");
    expect(await kindFor(new TypeError("offline"))).toBe("network");
  });

  it("closes and adds tasks", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await closeTask("tok", "a/b");
    expect(call(0)[0]).toBe("https://api.todoist.com/api/v1/tasks/a%2Fb/close");
    expect(call(0)[1]?.method).toBe("POST");

    fetchMock.mockResolvedValue(json(task("new")));
    await addTask("tok", "Buy milk");
    const [url, init] = call(1);
    expect(url).toBe("https://api.todoist.com/api/v1/tasks");
    expect(init?.body).toBe(JSON.stringify({ content: "Buy milk" }));
  });

  it("drops malformed tasks and normalises fields", () => {
    expect(
      parseTasks({
        results: [
          { id: "a", content: "A", priority: 9, due: { date: 3 } },
          { id: 1, content: "bad id" },
          null,
          {
            id: "b",
            content: "B",
            priority: 4,
            due: { date: "2026-01-01", string: "Jan 1" },
          },
        ],
      }),
    ).toEqual([
      { id: "a", content: "A", priority: 1, due: null },
      {
        id: "b",
        content: "B",
        priority: 4,
        due: { date: "2026-01-01", string: "Jan 1" },
      },
    ]);
    expect(parseTasks({ nope: true })).toEqual([]);
  });

  it("sorts dated tasks first, then by priority", () => {
    const sorted = sortTasks([
      task("undated-low", 1),
      task("late", 1, "2026-02-01"),
      task("undated-urgent", 4),
      task("early-low", 1, "2026-01-01"),
      task("early-urgent", 4, "2026-01-01"),
    ]);
    expect(sorted.map((t) => t.id)).toEqual([
      "early-urgent",
      "early-low",
      "late",
      "undated-urgent",
      "undated-low",
    ]);
  });
});
