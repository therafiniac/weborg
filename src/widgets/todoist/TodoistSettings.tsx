import { useEffect, useState } from "react";

import { useStorageItem } from "@/core/storage/useStorageItem";
import type { WidgetSettingsProps } from "@/core/widgets/types";
import { CheckboxField, RangeField, TextField } from "@/ui/fields";

import type { TodoistData } from ".";
import {
  fetchTasks,
  hasHostAccess,
  requestHostAccess,
  TodoistError,
  TOKEN_SETTINGS_URL,
} from "./api";
import { clearTodoistCache, tokenItem } from "./storage";

type Status = { kind: "idle" | "busy" | "error"; message?: string };

export default function TodoistSettings({
  data,
  setData,
}: WidgetSettingsProps<TodoistData>) {
  const [token, setToken] = useStorageItem(tokenItem);

  return (
    <>
      {token === undefined ? null : token ? (
        <Connected
          onDisconnect={async () => {
            await setToken("");
            await clearTodoistCache();
          }}
        />
      ) : (
        <Connect onConnect={setToken} />
      )}
      <TextField
        label="Title"
        value={data.title}
        onChange={(title) => setData({ ...data, title })}
      />
      <TextField
        label="Filter"
        value={data.filter}
        placeholder="today | overdue"
        hint="A Todoist filter, like “today | overdue” or “#Work”. Leave empty for all tasks."
        onChange={(filter) => setData({ ...data, filter })}
      />
      <TextField
        label="Default date for new tasks"
        value={data.defaultDue}
        placeholder="No date"
        hint="Used when you add a task without a date, like “today”. Leave empty to add undated tasks to their project."
        onChange={(defaultDue) => setData({ ...data, defaultDue })}
      />
      <CheckboxField
        label="Hide tasks when a new tab opens"
        checked={data.hideOnOpen}
        onChange={(hideOnOpen) => setData({ ...data, hideOnOpen })}
      />
      <RangeField
        label="Tasks shown"
        min={3}
        max={30}
        value={data.maxTasks}
        onChange={(maxTasks) => setData({ ...data, maxTasks })}
      />
      <RangeField
        label="Width"
        unit="px"
        min={240}
        max={640}
        step={20}
        value={data.width}
        onChange={(width) => setData({ ...data, width })}
      />
    </>
  );
}

function Connect({
  onConnect,
}: {
  onConnect: (token: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const connect = async () => {
    const token = draft.trim();
    if (!token) return;
    setStatus({ kind: "busy" });
    try {
      // Ask first: browsers only allow it during the click
      if (!(await requestHostAccess())) {
        setStatus({
          kind: "error",
          message:
            "Weborg needs permission to connect to Todoist to load tasks.",
        });
        return;
      }
      await fetchTasks(token, "");
      await onConnect(token);
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof TodoistError
            ? error.kind === "auth"
              ? "That token was not accepted. Check it and try again."
              : error.message
            : "Could not connect to Todoist.",
      });
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void connect();
      }}
    >
      <TextField
        label="Todoist API token"
        type="password"
        value={draft}
        invalid={status.kind === "error"}
        onChange={setDraft}
        hint={
          status.kind === "error" ? (
            status.message
          ) : (
            <>
              Copy it from{" "}
              <a href={TOKEN_SETTINGS_URL} target="_blank" rel="noreferrer">
                Todoist → Settings → Integrations → Developer
              </a>
              . It stays on this device: it is not synced or included in
              backups, and is stored unencrypted, like other extension data.
            </>
          )
        }
      />
      <div className="field">
        <button
          type="submit"
          className="button button--primary"
          disabled={!draft.trim() || status.kind === "busy"}
        >
          {status.kind === "busy" ? "Connecting…" : "Connect"}
        </button>
      </div>
    </form>
  );
}

function Connected({ onDisconnect }: { onDisconnect: () => Promise<void> }) {
  // Firefox lets people revoke site access from the add-ons manager
  const [access, setAccess] = useState<boolean | null>(null);

  useEffect(() => {
    hasHostAccess()
      .then(setAccess)
      .catch(() => setAccess(false));
  }, []);

  return (
    <div className="field">
      <span className="hint">
        {access === false
          ? "Connected, but Weborg no longer has permission to reach Todoist."
          : "Connected to Todoist."}
      </span>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {access === false && (
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              requestHostAccess()
                .then(setAccess)
                .catch(() => setAccess(false));
            }}
          >
            Allow access
          </button>
        )}
        <button
          type="button"
          className="button button--danger"
          onClick={() => {
            onDisconnect().catch((error: unknown) =>
              console.error("Weborg: failed to disconnect Todoist", error),
            );
          }}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
