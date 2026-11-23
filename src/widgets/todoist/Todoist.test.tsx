import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fakeBrowser } from "wxt/testing/fake-browser";

import { todoistWidget } from ".";
import * as api from "./api";
import { cacheItem, tokenItem } from "./storage";
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

describe("Todoist widget", () => {
  const fetchMock = vi.fn<typeof fetch>();
  const call = (n: number) => {
    const args = fetchMock.mock.calls[n];
    if (!args) throw new Error(`fetch call ${n} was not made`);
    return args;
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
    await tokenItem.setValue("tok");
    fetchMock.mockResolvedValueOnce(
      results(
        { id: "1", content: "Write tests" },
        { id: "2", content: "Ship" },
      ),
    );
    render(<Todoist instance={instance} data={data} setData={vi.fn()} />);

    expect(await screen.findByText("Write tests")).toBeInTheDocument();
    expect(await cacheItem.getValue()).toHaveProperty(["today | overdue"]);

    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await userEvent.click(
      screen.getByRole("button", { name: 'Complete "Write tests"' }),
    );
    expect(screen.queryByText("Write tests")).not.toBeInTheDocument();
    expect(call(1)[0]).toBe("https://api.todoist.com/api/v1/tasks/1/close");
  });

  it("puts a task back when completing fails", async () => {
    await tokenItem.setValue("tok");
    fetchMock.mockResolvedValueOnce(results({ id: "1", content: "Stay" }));
    render(<Todoist instance={instance} data={data} setData={vi.fn()} />);
    await screen.findByText("Stay");

    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
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

  it("adds a task and reloads", async () => {
    await tokenItem.setValue("tok");
    fetchMock.mockResolvedValueOnce(results());
    render(<Todoist instance={instance} data={data} setData={vi.fn()} />);
    await screen.findByText("Nothing to do.");

    fetchMock
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(results({ id: "9", content: "Buy milk" }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Add a task" }),
      "Buy milk{Enter}",
    );
    expect(await screen.findByText("Buy milk")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Add a task" })).toHaveValue("");
  });

  it("still adds tasks when the page is locked", async () => {
    await tokenItem.setValue("tok");
    fetchMock.mockResolvedValueOnce(results());
    render(
      <Todoist instance={instance} data={data} setData={vi.fn()} locked />,
    );
    await screen.findByText("Nothing to do.");
    expect(
      screen.getByRole("textbox", { name: "Add a task" }),
    ).toBeInTheDocument();
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
