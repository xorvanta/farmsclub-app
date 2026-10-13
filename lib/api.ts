import { Platform } from "react-native";
import type { ApiResponse, B2bBillingEntity, B2bFaq, B2bListing, Category, ChatListingContext, ChatTurn, RfqRequest } from "./types";

/**
 * Base URL including the backend's /api/v1 context path.
 *
 * - EXPO_PUBLIC_API_URL, when set, always wins.
 * - Web (unset): same-origin "/api/v1" — on Vercel, vercel.json rewrites that to the Cloud Run
 *   backend, so the browser never makes a cross-origin call and the backend needs no CORS entry.
 *   For local `expo start --web` without a proxy, set EXPO_PUBLIC_API_URL to the absolute URL.
 * - Native (unset): there is no rewrite layer in front of an app binary, so fall back to the
 *   absolute Cloud Run URL.
 */
const NATIVE_FALLBACK_API = "https://xoms-backend-752519899091.asia-south1.run.app/api/v1";
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || (Platform.OS === "web" ? "/api/v1" : NATIVE_FALLBACK_API);

export const GENERIC_ERROR = "Something went wrong — please try again.";
export const NETWORK_ERROR = "Can't reach the server — check your connection.";

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Backend `error`/`message` text is only shown to a buyer when it reads like a normal,
 * human-written sentence (e.g. "Please enter a valid 10-digit Indian mobile number.").
 * Anything that smells like an internal/technical message is replaced with a generic line.
 */
const TECHNICAL_PATTERNS: RegExp[] = [
  /\b(select|insert|update|delete)\b.+\b(from|into|set|where)\b/i, // SQL
  /\bsql\b|sqlstate|jdbc|hibernate|postgres|psql|constraint|violates|duplicate key|relation "/i,
  /preparedstatement|resultset|statementcallback|bad sql grammar/i,
  /failed to convert|cannot deserialize|json parse|jsonparse|unexpected token|unrecognized field|parse error/i,
  /exception|stack ?trace|nullpointer|\bnull\b|undefined|\bat [\w$.]+\(/i,
  /\b[a-z]+(\.[a-z_$][\w$]*){2,}\b/i, // dotted class/package names (java.lang.X, com.marketplace...)
  /\b[A-Z][a-z]+[A-Z]\w*(Exception|Error|Service|Controller|Repository|Request)\b/, // CamelCase class names
  /status code|\bhttp\s*\/?\s*\d|\b(status|code|error)\s*[:=]?\s*[1-5]\d\d\b|^[1-5]\d\d\b|\b[1-5]\d\d\s+(bad request|not found|unauthori[sz]ed|forbidden|internal|service unavailable|gateway)/i, // status codes
  /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/, // ALL_CAPS_CODES
  /^[A-Z0-9_]+$/, // a bare ALL-CAPS token
  /[{}<>[\]\`]|=>|::/, // code-ish punctuation
];

export function friendlyMessage(raw: unknown): string {
  if (typeof raw !== "string") return GENERIC_ERROR;
  const text = raw.trim();
  if (text.length < 4 || text.length > 200) return GENERIC_ERROR;
  if (!/^[A-Z]/.test(text)) return GENERIC_ERROR; // a sentence starts with a capital letter
  if (TECHNICAL_PATTERNS.some((re) => re.test(text))) return GENERIC_ERROR;
  return text;
}

/** Message to show for any caught error — ApiError text is already sanitised. */
export function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : GENERIC_ERROR;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(NETWORK_ERROR);
  }
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    body = null; // HTML error page, empty body, proxy timeout…
  }
  if (!res.ok || !body || !body.success) {
    if (res.status >= 500 && !body) throw new ApiError(GENERIC_ERROR);
    throw new ApiError(friendlyMessage(body?.error ?? body?.message));
  }
  return body.data as T;
}

/** A listing/route id is only ever a positive integer — anything else is a not-found, not a request. */
export function parseListingId(raw: string | string[] | undefined | null): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d{1,15}$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export const b2bApi = {
  getListings: (opts?: { category?: Category | null; q?: string }) => {
    const params = new URLSearchParams();
    if (opts?.category) params.set("category", opts.category);
    if (opts?.q?.trim()) params.set("q", opts.q.trim());
    const qs = params.toString();
    return request<B2bListing[]>(`/public/b2b/listings${qs ? `?${qs}` : ""}`);
  },

  getListing: (id: number) => request<B2bListing>(`/public/b2b/listings/${id}`),

  submitRfq: (payload: RfqRequest) =>
    request<number>("/public/b2b/rfq", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Quote-form funnel for the trade desk's RFQ stats (opens → submits). The submit is recorded
   *  by the server itself, so only the open is sent from here. Never blocks the form. */
  trackRfqOpen: (listingId: number | null) =>
    request<unknown>("/public/rfq/events", {
      method: "POST",
      body: JSON.stringify({
        type: "rfq_open",
        sourceChannel: listingId != null ? "FARMSCLUB_LISTING" : "FARMSCLUB_GENERAL",
        page: listingId != null ? `/rfq/${listingId}` : "/contact",
      }),
    }).catch(() => undefined),

  getFaqs: () => request<B2bFaq[]>("/public/b2b/faqs"),

  getBillingEntity: () => request<B2bBillingEntity>("/public/b2b/billing-entity"),

  askChat: (payload: { message: string; history?: ChatTurn[]; listingContext?: ChatListingContext }) =>
    request<{ reply: string }>("/public/b2b/chat/ask", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export { ApiError };
