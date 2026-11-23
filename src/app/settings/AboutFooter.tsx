import { Code, Coffee } from "lucide-react";
import { browser } from "wxt/browser";

import { ABOUT } from "@/core/about";

function version(): string | null {
  try {
    return browser.runtime.getManifest().version ?? null;
  } catch {
    return null;
  }
}

/** Who made Weborg, its licence and links; under every settings section. */
export default function AboutFooter() {
  const v = version();
  return (
    <footer className="settings-about">
      <p>
        <strong>{ABOUT.name}</strong>
        {v && ` v${v}`} · by {ABOUT.author} · {ABOUT.license} licence
      </p>
      <p>
        Free and open source. No accounts, no tracking: your data stays in this
        browser.
      </p>
      {(ABOUT.repositoryUrl || ABOUT.supportUrl) && (
        <p className="settings-about__links">
          {ABOUT.repositoryUrl && (
            <a href={ABOUT.repositoryUrl} target="_blank" rel="noreferrer">
              <Code size={14} aria-hidden /> Source code
            </a>
          )}
          {ABOUT.supportUrl && (
            <a
              className="settings-about__support"
              href={ABOUT.supportUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Coffee size={14} aria-hidden /> Support Weborg on Ko-fi
            </a>
          )}
        </p>
      )}
    </footer>
  );
}
