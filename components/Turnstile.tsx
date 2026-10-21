import { useEffect, useRef } from "react";
import { Platform, View } from "react-native";

/** Cloudflare Turnstile site key. Unset = no widget; the backend then relies on the honeypot and
 *  the minimum fill time (FcBotGuard). */
export const TURNSTILE_SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("turnstile failed to load"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * Cloudflare Turnstile widget (web only, and only when EXPO_PUBLIC_TURNSTILE_SITE_KEY is set).
 * `onToken` gets the token on success and "" when it expires/errors, so the form can keep its
 * submit button disabled until there is a fresh token. `resetKey` re-runs the challenge (change it
 * after a failed submit — a token can only be used once).
 */
export function Turnstile({ onToken, resetKey = 0, language }: { onToken: (token: string) => void; resetKey?: number; language?: "en" | "hi" }) {
  const ref = useRef<View>(null);
  const tokenCb = useRef(onToken);
  tokenCb.current = onToken;

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || Platform.OS !== "web") return;
    let widgetId: string | null = null;
    let cancelled = false;
    loadScript()
      .then((ts) => {
        const el = ref.current as unknown as HTMLElement | null;
        if (cancelled || !el) return;
        widgetId = ts.render(el, {
          sitekey: TURNSTILE_SITE_KEY,
          language: language ?? "auto",
          callback: (t: string) => tokenCb.current(t),
          "expired-callback": () => tokenCb.current(""),
          "error-callback": () => tokenCb.current(""),
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // already gone
        }
      }
      tokenCb.current("");
    };
  }, [resetKey, language]);

  if (!TURNSTILE_SITE_KEY || Platform.OS !== "web") return null;
  return <View ref={ref} style={{ minHeight: 65 }} accessibilityLabel="Security check" />;
}
