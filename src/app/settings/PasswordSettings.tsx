import { useState } from "react";

import {
  hashPassword,
  securityItem,
  type SecuritySettings,
} from "@/core/security/password";
import { useStorageItem } from "@/core/storage/useStorageItem";
import { CheckboxField } from "@/ui/fields";
import { NewPasswordForm, PasswordPrompt } from "@/ui/PasswordFields";

/** What the current password must be entered for before it happens. */
type Guarded = "change" | "remove" | "unlock-off";

type Step =
  { kind: "idle" } | { kind: "verify"; then: Guarded } | { kind: "new" };

export default function PasswordSettings() {
  const [security, setSecurity] = useStorageItem(securityItem);
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [message, setMessage] = useState("");

  if (security === undefined) return null;
  const save = (next: SecuritySettings, done: string) =>
    setSecurity(next).then(() => {
      setStep({ kind: "idle" });
      setMessage(done);
    });

  const afterVerify = (action: Guarded) => {
    if (action === "change") return setStep({ kind: "new" });
    if (action === "remove")
      return void save(
        { password: null, requireForUnlock: false },
        "Password removed.",
      );
    void save(
      { ...security, requireForUnlock: false },
      "Unlocking no longer asks for the password.",
    );
  };

  return (
    <>
      <p className="hint">
        An optional password to unlock the page, and to show hidden Todoist
        tasks if you choose. It keeps out people glancing at your screen, not
        someone determined: anyone using this computer could still reach your
        data another way. It stays on this device and is not in backups.
      </p>

      {step.kind === "new" || (!security.password && step.kind === "idle") ? (
        <NewPasswordForm
          submitLabel={security.password ? "Change password" : "Set password"}
          onCancel={
            security.password ? () => setStep({ kind: "idle" }) : undefined
          }
          onSubmit={async (password) => {
            await save(
              { ...security, password: await hashPassword(password) },
              security.password ? "Password changed." : "Password set.",
            );
          }}
        />
      ) : step.kind === "verify" && security.password ? (
        <PasswordPrompt
          record={security.password}
          label="Current password"
          submitLabel="Continue"
          onSuccess={() => afterVerify(step.then)}
          onCancel={() => setStep({ kind: "idle" })}
        />
      ) : (
        security.password && (
          <>
            <CheckboxField
              label="Require password to unlock the page"
              checked={security.requireForUnlock}
              onChange={(checked) => {
                setMessage("");
                if (checked)
                  void save(
                    { ...security, requireForUnlock: true },
                    "Unlocking now asks for the password.",
                  );
                // Turning protection off needs the password, or anyone could
                else setStep({ kind: "verify", then: "unlock-off" });
              }}
            />
            <div className="password-form__actions password-form__actions--start">
              <button
                type="button"
                className="button"
                onClick={() => {
                  setMessage("");
                  setStep({ kind: "verify", then: "change" });
                }}
              >
                Change password
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={() => {
                  setMessage("");
                  setStep({ kind: "verify", then: "remove" });
                }}
              >
                Remove password
              </button>
            </div>
            <p className="hint">
              Forgot it? It cannot be recovered. Removing and adding the
              extension again clears it, along with your settings; a backup can
              restore those.
            </p>
          </>
        )
      )}

      {message && (
        <p className="hint" role="status">
          {message}
        </p>
      )}
    </>
  );
}
