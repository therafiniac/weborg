import { Eye, EyeOff } from "lucide-react";
import {
  useId,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
} from "react";

import {
  MIN_PASSWORD_LENGTH,
  passwordAttempts,
  verifyPassword,
  type PasswordRecord,
} from "@/core/security/password";

/**
 * "panel": inside the settings panel (themed fields and buttons).
 * "glass": on the page itself, over the background.
 */
type Variant = "panel" | "glass";

const buttonClass = (variant: Variant, primary = false) =>
  variant === "panel"
    ? `button${primary ? " button--primary" : ""}`
    : `password-glass__button${primary ? " password-glass__button--primary" : ""}`;

/**
 * Password input with an optional show/hide button. It always starts
 * hidden; the choice is never remembered.
 */
function PasswordInput({
  revealable,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  revealable: boolean;
}) {
  const [visible, setVisible] = useState(false);
  if (!revealable) return <input {...props} type="password" />;
  return (
    <span className="password-input">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="icon-button password-input__toggle"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        onClick={() => setVisible(!visible)}
      >
        {visible ? (
          <EyeOff size={16} aria-hidden />
        ) : (
          <Eye size={16} aria-hidden />
        )}
      </button>
    </span>
  );
}

/** Asks for a password and calls onSuccess once it matches. */
export function PasswordPrompt({
  record,
  label,
  submitLabel = "Unlock",
  variant = "panel",
  onSuccess,
  onCancel,
}: {
  record: PasswordRecord;
  label: string;
  submitLabel?: string;
  variant?: Variant;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const id = useId();
  const [attempt, setAttempt] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!attempt || checking) return;
    const wait = passwordAttempts.waitMs();
    if (wait > 0) {
      setError(`Too many tries. Wait ${Math.ceil(wait / 1000)} seconds.`);
      return;
    }
    setChecking(true);
    try {
      if (await verifyPassword(record, attempt)) {
        passwordAttempts.succeed();
        onSuccess();
        return;
      }
      passwordAttempts.fail();
      setAttempt("");
      const lockedFor = passwordAttempts.waitMs();
      setError(
        lockedFor > 0
          ? `Too many tries. Wait ${Math.ceil(lockedFor / 1000)} seconds.`
          : "Wrong password.",
      );
    } catch (failure) {
      console.error("Weborg: password check failed", failure);
      setError("Could not check the password.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <form
      className={`password-form password-form--${variant}`}
      onSubmit={(event) => void submit(event)}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          onCancel();
        }
      }}
    >
      <div className={variant === "panel" ? "field" : "password-glass__field"}>
        <label htmlFor={id}>{label}</label>
        <PasswordInput
          // Only in settings: on the page, someone may be looking
          revealable={variant === "panel"}
          id={id}
          autoComplete="current-password"
          value={attempt}
          autoFocus
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => setAttempt(event.target.value)}
        />
        {error && (
          <span id={`${id}-error`} className="field__error" role="alert">
            {error}
          </span>
        )}
      </div>
      <div className="password-form__actions">
        <button
          type="button"
          className={buttonClass(variant)}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={buttonClass(variant, true)}
          disabled={!attempt || checking}
        >
          {checking ? "Checking…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

/** New password plus confirmation; hands the plain text to onSubmit. */
export function NewPasswordForm({
  submitLabel,
  onSubmit,
  onCancel,
}: {
  submitLabel: string;
  onSubmit: (password: string) => Promise<void>;
  onCancel?: () => void;
}) {
  const id = useId();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH)
      return setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (password !== confirm) return setError("The passwords do not match.");
    setSaving(true);
    try {
      await onSubmit(password);
    } catch (failure) {
      console.error("Weborg: saving the password failed", failure);
      setError("Could not save the password.");
      setSaving(false);
    }
  };

  return (
    <form
      className="password-form password-form--panel"
      onSubmit={(event) => void submit(event)}
    >
      <div className="field">
        <label htmlFor={`${id}-new`}>New password</label>
        <PasswordInput
          revealable
          id={`${id}-new`}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`${id}-confirm`}>Repeat the password</label>
        <PasswordInput
          revealable
          id={`${id}-confirm`}
          autoComplete="new-password"
          value={confirm}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => setConfirm(event.target.value)}
        />
        {error && (
          <span id={`${id}-error`} className="field__error" role="alert">
            {error}
          </span>
        )}
      </div>
      <div className="password-form__actions">
        {onCancel && (
          <button type="button" className="button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="button button--primary"
          disabled={!password || !confirm || saving}
        >
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
