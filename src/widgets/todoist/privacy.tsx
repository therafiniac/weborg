import { useState } from "react";

import {
  hashPassword,
  securityItem,
  type PasswordRecord,
} from "@/core/security/password";
import { useStorageItem } from "@/core/storage/useStorageItem";
import { SelectField } from "@/ui/fields";
import { NewPasswordForm, PasswordPrompt } from "@/ui/PasswordFields";

import type { ShowPassword, TodoistData } from ".";
import { todoistPasswordItem } from "./storage";

/**
 * The password that showing hidden tasks needs: a record, null for none,
 * or undefined while storage is still loading (callers must wait, or a
 * protected list could show for a moment).
 */
export function useShowPassword(
  mode: ShowPassword,
): PasswordRecord | null | undefined {
  const [security] = useStorageItem(securityItem);
  const [own] = useStorageItem(todoistPasswordItem);
  if (mode === "weborg")
    return security === undefined ? undefined : security.password;
  if (mode === "separate") return own;
  return null;
}

const OPTIONS = [
  { value: "none", label: "No password" },
  { value: "weborg", label: "The Weborg password" },
  { value: "separate", label: "A separate Todoist password" },
] as const;

type Pending =
  { kind: "mode"; mode: ShowPassword } | { kind: "change-own" } | null;

/** Settings for which password guards hidden tasks. */
export function ShowPasswordSettings({
  data,
  setData,
}: {
  data: TodoistData;
  setData: (data: TodoistData) => void;
}) {
  const current = useShowPassword(data.showPassword);
  const [security] = useStorageItem(securityItem);
  const [own, setOwn] = useStorageItem(todoistPasswordItem);
  // A change waiting for the current password
  const [pending, setPending] = useState<Pending>(null);
  const [settingOwn, setSettingOwn] = useState(false);

  const apply = (next: Exclude<Pending, null>) => {
    setPending(null);
    if (next.kind === "change-own") setSettingOwn(true);
    else setData({ ...data, showPassword: next.mode });
  };

  /** Loosening or replacing protection needs the password in force now. */
  const guarded = (next: Exclude<Pending, null>) => {
    if (current) setPending(next);
    else if (current === null) apply(next);
  };

  if (pending && current)
    return (
      <PasswordPrompt
        record={current}
        label={
          data.showPassword === "weborg"
            ? "Weborg password"
            : "Current Todoist password"
        }
        submitLabel="Continue"
        onSuccess={() => apply(pending)}
        onCancel={() => setPending(null)}
      />
    );

  if (settingOwn || (data.showPassword === "separate" && own === null))
    return (
      <>
        <p className="hint">
          Choose the password for showing hidden tasks. You will need to
          remember it as well as the Weborg password, if you set one.
        </p>
        <NewPasswordForm
          submitLabel={own ? "Change Todoist password" : "Set Todoist password"}
          onCancel={() => {
            setSettingOwn(false);
            // Backing out of a separate password that was never set
            if (!own) setData({ ...data, showPassword: "none" });
          }}
          onSubmit={async (password) => {
            await setOwn(await hashPassword(password));
            setSettingOwn(false);
          }}
        />
      </>
    );

  return (
    <>
      <SelectField
        label="Password to show hidden tasks"
        value={data.showPassword}
        options={OPTIONS}
        onChange={(mode) => {
          if (mode !== data.showPassword) guarded({ kind: "mode", mode });
        }}
      />
      {data.showPassword === "weborg" && security?.password === null && (
        <p className="hint">
          No Weborg password is set yet, so tasks show without one. Set it in
          Settings → Password.
        </p>
      )}
      {data.showPassword === "separate" && own && (
        <div className="password-form__actions password-form__actions--start">
          <button
            type="button"
            className="button"
            onClick={() => guarded({ kind: "change-own" })}
          >
            Change Todoist password
          </button>
        </div>
      )}
    </>
  );
}
