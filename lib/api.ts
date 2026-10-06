import type { ApiResponse, B2bFaq, B2bListing, Category, ChatListingContext, ChatTurn, RfqRequest } from "./types";

/**
 * Same pattern the dashboard frontend uses: EXPO_PUBLIC_API_URL must include the backend's
 * /api/v1 context path. In production on Vercel, set this via a vercel.json rewrite to the
 * same Cloud Run backend (see vercel.json) so requests are same-origin and the backend never
 * needs a CORS entry for this app at all — exactly how paudhewale-dashboard-frontend avoids it.
 * Falls back to the real backend directly for local `expo start` dev, where there's no Vercel
 * rewrite layer in front of you.
 */
const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "https://xoms-backend-752519899091.asia-south1.run.app/api/v1";

class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body: ApiResponse<T> = await res.json();
  if (!res.ok || !body.success) {
    throw new ApiError(body.error ?? body.message ?? "Something went wrong. Please try again.");
  }
  return body.data as T;
}

export const b2bApi = {
  getListings: (category?: Category) =>
    request<B2bListing[]>(`/public/b2b/listings${category ? `?category=${category}` : ""}`),

  getListing: (id: number) => request<B2bListing>(`/public/b2b/listings/${id}`),

  submitRfq: (payload: RfqRequest) =>
    request<number>("/public/b2b/rfq", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getFaqs: () => request<B2bFaq[]>("/public/b2b/faqs"),

  askChat: (payload: { message: string; history?: ChatTurn[]; listingContext?: ChatListingContext }) =>
    request<{ reply: string }>("/public/b2b/chat/ask", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export { ApiError };
