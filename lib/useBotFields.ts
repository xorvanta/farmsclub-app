import { useCallback, useRef, useState } from "react";
import { TURNSTILE_SITE_KEY } from "@/components/Turnstile";
import type { BotFields } from "./types";

/**
 * Bot-protection state for the public farm forms (registration, "Ask about this farm"): the
 * honeypot value, the time since the form rendered, and — when Turnstile is configured — the
 * widget token. `fields()` builds the `{turnstile_token, hp, form_elapsed_ms}` every POST carries.
 */
export function useBotFields() {
  const renderedAt = useRef(Date.now());
  const [hp, setHp] = useState("");
  const [token, setToken] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const fields = useCallback(
    (): BotFields => ({
      ...(token ? { turnstile_token: token } : {}),
      hp,
      form_elapsed_ms: Math.max(0, Date.now() - renderedAt.current),
    }),
    [hp, token],
  );

  /** After a refused submit: a Turnstile token is single-use, so run the challenge again. */
  const reset = useCallback(() => {
    if (TURNSTILE_SITE_KEY) {
      setToken("");
      setResetKey((k) => k + 1);
    }
  }, []);

  return {
    hp,
    setHp,
    setToken,
    resetKey,
    reset,
    fields,
    /** False while Turnstile is configured but not yet solved — keep submit disabled. */
    ready: !TURNSTILE_SITE_KEY || !!token,
  };
}
