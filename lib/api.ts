import { Platform } from "react-native";
import type { ApiResponse, B2bBillingEntity, B2bContact, B2bFaq, B2bListing, Category, ChatListingContext, ChatTurn, ListingSort, RfqRequest } from "./types";

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

/**
 * `network`: the request never got an answer (offline, DNS, timeout).
 * `server`: a 5xx with no readable body — the backend itself failed.
 * `rejected`: the backend answered and said no (e.g. "This product isn't available…") — for a
 * listing lookup that means the listing is gone, not that retrying will help.
 */
export type ApiErrorKind = "network" | "server" | "rejected";

class ApiError extends Error {
  kind: ApiErrorKind;
  constructor(message: string, kind: ApiErrorKind = "rejected") {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
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

/** True when the error means "this thing doesn't exist / isn't available" rather than a failure
 *  a retry could fix. */
export function isNotFound(e: unknown): boolean {
  return e instanceof ApiError && e.kind === "rejected";
}

async function requestFull<T>(path: string, init?: RequestInit): Promise<{ data: T; message: string | null }> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(NETWORK_ERROR, "network");
  }
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    body = null; // HTML error page, empty body, proxy timeout…
  }
  if (!res.ok || !body || !body.success) {
    if (!body) throw new ApiError(GENERIC_ERROR, "server");
    const message = friendlyMessage(body.error ?? body.message);
    throw new ApiError(message, res.status >= 500 ? "server" : "rejected");
  }
  const message = typeof body.message === "string" && friendlyMessage(body.message) !== GENERIC_ERROR ? body.message.trim() : null;
  return { data: body.data as T, message };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return (await requestFull<T>(path, init)).data;
}

/** A listing/route id is only ever a positive integer — anything else is a not-found, not a request. */
export function parseListingId(raw: string | string[] | undefined | null): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d{1,15}$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export const b2bApi = {
  getListings: (opts?: { category?: Category | null; q?: string; sort?: ListingSort | null }) => {
    const params = new URLSearchParams();
    if (opts?.category) params.set("category", opts.category);
    if (opts?.q?.trim()) params.set("q", opts.q.trim());
    if (opts?.sort && opts.sort !== "name") params.set("sort", opts.sort);
    const qs = params.toString();
    return request<B2bListing[]>(`/public/b2b/listings${qs ? `?${qs}` : ""}`);
  },

  getListing: (id: number) => request<B2bListing>(`/public/b2b/listings/${id}`),

  /** Resolves with the backend's own confirmation message (it differs when an earlier open
   *  enquiry for the same listing was updated rather than a new one created). */
  submitRfq: (payload: RfqRequest) =>
    requestFull<number>("/public/b2b/rfq", {
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

  /** Categories switched on for the storefront (v1.4 §7.4). */
  getCategories: () => request<{ code: string; label: string }[]>("/public/b2b/categories"),

  getFaqs: () => request<B2bFaq[]>("/public/b2b/faqs"),

  getBillingEntity: () => request<B2bBillingEntity>("/public/b2b/billing-entity"),

  getContact: () => request<B2bContact>("/public/b2b/contact"),

  askChat: (payload: { message: string; history?: ChatTurn[]; listingContext?: ChatListingContext }) =>
    request<{ reply: string }>("/public/b2b/chat/ask", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export { ApiError };
