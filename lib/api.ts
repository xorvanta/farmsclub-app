import { Platform } from "react-native";
import type {
  ApiResponse,
  B2bContact,
  B2bFaq,
  B2bListing,
  ChatListingContext,
  ChatTurn,
  FarmCardApi,
  FarmEditSubmitResult,
  FarmEditView,
  FarmEnquiryRequest,
  FarmProfile,
  FarmRegistrationRequest,
  FarmRegistrationResult,
  FarmsPage,
  FcCategory,
  FcContent,
  FcFilters,
  FcLists,
  FcSearchResult,
  ListingSort,
  OwnerFarm,
  RfqRequest,
  UnavailableListing,
  UploadedPhoto,
} from "./types";

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

/**
 * The backend's own absolute URL, used only for the farm WhatsApp redirect (see farmWhatsappHref).
 */
const API_DIRECT = (process.env.EXPO_PUBLIC_API_DIRECT_URL || NATIVE_FALLBACK_API).replace(/\/+$/, "");

export const GENERIC_ERROR = "Something went wrong — please try again.";
export const NETWORK_ERROR = "Can't reach the server — check your connection.";

/**
 * `network`: the request never got an answer (offline, DNS, timeout).
 * `server`: a 5xx with no readable body — the backend itself failed.
 * `rejected`: the backend answered and said no (e.g. "This farm is not available.").
 */
export type ApiErrorKind = "network" | "server" | "rejected";

class ApiError extends Error {
  kind: ApiErrorKind;
  /** HTTP status of the answer (0 when there was none). */
  status: number;
  /** `data.code` the backend attached to a refusal, e.g. "LINK_INACTIVE" for a dead farm-edit link. */
  code: string | null;
  constructor(message: string, kind: ApiErrorKind = "rejected", status = 0, code: string | null = null) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
  }
}

/**
 * Backend `error`/`message` text is only shown when it reads like a normal, human-written
 * sentence (e.g. "Please enter a valid 10-digit Indian mobile number."). Anything that smells
 * like an internal/technical message is replaced with a generic line.
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
  // A FormData body (multipart uploads) must not carry a JSON content type — the browser sets
  // the multipart boundary itself.
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { ...(isForm ? {} : { "Content-Type": "application/json" }), ...(init?.headers ?? {}) },
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
    if (!body) throw new ApiError(GENERIC_ERROR, "server", res.status);
    const message = friendlyMessage(body.error ?? body.message);
    const data = body.data as unknown;
    const code =
      data && typeof data === "object" && typeof (data as { code?: unknown }).code === "string" ? (data as { code: string }).code : null;
    throw new ApiError(message, res.status >= 500 ? "server" : "rejected", res.status, code);
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

function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === "" || v === false) continue;
    p.set(k, v === true ? "1" : String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export const b2bApi = {
  getListings: (opts?: {
    category?: string | null;
    crop?: string | number | null;
    q?: string;
    sort?: ListingSort | null;
    limit?: number;
  }) =>
    request<B2bListing[]>(
      `/public/b2b/listings${qs({
        category: opts?.category ?? undefined,
        crop: opts?.crop ?? undefined,
        q: opts?.q?.trim() || undefined,
        sort: opts?.sort && opts.sort !== "name" ? opts.sort : undefined,
        limit: opts?.limit,
      })}`,
    ),

  /** A visible listing (`available: true`), or `{available:false, title}` for a hidden/unknown one. */
  getListing: (id: number) => request<B2bListing | UnavailableListing>(`/public/b2b/listings/${id}`),

  /** Resolves with the backend's own confirmation message (it differs when an earlier open
   *  enquiry for the same listing was updated rather than a new one created). */
  submitRfq: (payload: RfqRequest) => requestFull<number>("/public/b2b/rfq", post(payload)),

  /** Quote-form funnel (opens → submits) for the FarmsClub team's RFQ stats. The submit is
   *  recorded by the server itself, so only the open is sent from here. Never blocks the form. */
  trackRfqOpen: (listingId: number | null) =>
    request<unknown>(
      "/public/rfq/events",
      post({
        type: "rfq_open",
        sourceChannel: listingId != null ? "FARMSCLUB_LISTING" : "FARMSCLUB_GENERAL",
        page: listingId != null ? `/rfq/${listingId}` : "/contact",
      }),
    ).catch(() => undefined),

  getFaqs: () => request<B2bFaq[]>("/public/b2b/faqs"),

  getContact: () => request<B2bContact>("/public/b2b/contact"),

  askChat: (payload: { message: string; history?: ChatTurn[]; listingContext?: ChatListingContext }) =>
    request<{ reply: string }>("/public/b2b/chat/ask", post(payload)),
};

/** True for a visible listing; false for the `{available:false}` placeholder. */
export function isAvailableListing(l: B2bListing | UnavailableListing | null | undefined): l is B2bListing {
  return !!l && l.available !== false && "id" in l;
}

/** FarmsClub farm network + storefront content (`/public/fc/...`). */
export const fcApi = {
  getCategories: () => request<FcCategory[]>("/public/fc/categories"),
  getContent: () => request<FcContent>("/public/fc/content"),
  getLists: () => request<FcLists>("/public/fc/lists"),
  getFilters: () => request<FcFilters>("/public/fc/filters"),
  search: (q: string) => request<FcSearchResult>(`/public/fc/search${qs({ q: q.trim() })}`),

  getFarms: (f: {
    state?: string | null;
    district?: string | null;
    type?: string | null;
    crop?: string | null;
    training?: boolean;
    featured?: boolean;
    sort?: string | null;
    page?: number;
    size?: number;
  }) =>
    request<FarmsPage>(
      `/public/fc/farms${qs({
        state: f.state,
        district: f.district,
        type: f.type,
        crop: f.crop,
        training: f.training,
        featured: f.featured,
        sort: f.sort && f.sort !== "featured" ? f.sort : undefined,
        page: f.page || undefined,
        size: f.size,
      })}`,
    ),

  /** 404 (→ ApiError kind "rejected") when the farm isn't live. An old slug resolves with `moved_from`. */
  getFarm: (slug: string) => request<FarmProfile>(`/public/fc/farms/${encodeURIComponent(slug)}`),
  getFarmListings: (slug: string) => request<B2bListing[]>(`/public/fc/farms/${encodeURIComponent(slug)}/listings`),
  getListingFarms: (id: number) => request<FarmCardApi[]>(`/public/fc/listings/${id}/farms`),

  /** JSON, or multipart (part `data` = the JSON text, parts `photos` = up to 3 images) when photos are attached. */
  registerFarm: (payload: FarmRegistrationRequest, photos: Blob[] = []) => {
    if (!photos.length) return requestFull<FarmRegistrationResult>("/public/fc/farm-registrations", post(payload));
    const form = new FormData();
    form.append("data", JSON.stringify(payload));
    photos.slice(0, 3).forEach((p, i) => form.append("photos", p, `photo-${i + 1}.jpg`));
    return requestFull<FarmRegistrationResult>("/public/fc/farm-registrations", { method: "POST", body: form });
  },

  enquireFarm: (payload: FarmEnquiryRequest) =>
    requestFull<{ enquiry_id: number }>("/public/fc/farm-enquiries", post(payload)),

  /** An inactive link rejects with ApiError code "LINK_INACTIVE". */
  getFarmEdit: (token: string) => request<FarmEditView>(`/public/fc/farm-edit/${encodeURIComponent(token)}`),
  submitFarmEdit: (token: string, farm: OwnerFarm) =>
    requestFull<FarmEditSubmitResult>(`/public/fc/farm-edit/${encodeURIComponent(token)}`, post(farm)),
  /** ≤10 files per call, JPG/PNG/WebP ≤10 MB each (enforced by the backend). Each result has `url` or `error`. */
  uploadFarmEditPhotos: (token: string, files: Blob[]) => {
    const form = new FormData();
    files.slice(0, 10).forEach((f, i) => form.append("files", f, `photo-${i + 1}.jpg`));
    return request<UploadedPhoto[]>(`/public/fc/farm-edit/${encodeURIComponent(token)}/photos`, { method: "POST", body: form });
  },
};

/**
 * WhatsApp button target (Storefront §6 block 11, Admin §3.9): the backend redirect, which counts
 * the click and 302s to wa.me — the number itself never reaches the page or any API response.
 * Deliberately the DIRECT backend URL (EXPO_PUBLIC_API_DIRECT_URL), not the same-origin Vercel
 * rewrite: through the rewrite every visitor would arrive from Vercel's IPs and the server-side
 * click de-dupe would undercount.
 */
export function farmWhatsappHref(slug: string, src: "profile" | "sticky"): string {
  return `${API_DIRECT}/public/fc/farms/${encodeURIComponent(slug)}/whatsapp?src=${src}`;
}

export { ApiError };
