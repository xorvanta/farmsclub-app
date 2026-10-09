/** Mirrors the backend's ApiResponse<T> wrapper exactly (see common.response.ApiResponse). */
export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
};

export type Category = "PLANT" | "POT" | "TOOL" | "SOIL_FERTILISER" | "OTHER";

/**
 * GET /public/b2b/listings and /public/b2b/listings/{id} — see PublicB2bController.
 * Reviewed B2B listings (b2b_listings), priced by quantity tiers. Buyers only ever see the
 * buyer price range / tier table (before GST) — never a seller rate or retail MRP, which the
 * backend no longer returns at all.
 */
export type B2bPriceTier = {
  minQty: number;
  maxQty: number | null; // null = "and above"
  pricePerUnit: number;
};

export type B2bListing = {
  id: number;
  category: Category;
  title: string;
  /** Either a JSON-encoded object of category fields, or plain text. */
  specification: string | null;
  manufacturer_brand: string | null; // packaged goods only
  unit: string | null;
  moq: number | null;
  images: string[];
  photo_url: string | null; // first image
  dispatch_states: string[];
  transport_modes: string[];
  gst_rate: number | null;
  price_from: number | null; // per-unit buyer price range, before GST
  price_to: number | null;
  /** Only on GET /public/b2b/listings/{id}. */
  tiers?: B2bPriceTier[];
  // Legacy aliases the backend still sends (= moq / unit / category).
  bulk_min_quantity?: number | null;
  bulk_unit?: string | null;
  bulk_category?: Category;
};

/** GET /public/b2b/faqs — see B2bFaqService / AdminFaqController's B2B audience. */
export type B2bFaq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  active: boolean;
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** POST /public/b2b/chat/ask — see B2bChatService ("Trellis"). */
export type ChatListingContext = {
  title?: string;
  category?: string;
  bulkPrice?: string; // the buyer price range string, e.g. "₹40–₹55 per tray (before GST)"
  bulkUnit?: string;
  bulkMinQuantity?: string;
};

/**
 * GET /public/b2b/billing-entity — the real "Formulate India" legal entity (admin-editable at
 * Admin > B2B Console > Billing Entity, same feature retail's own company profile uses). Public
 * subset only — no GSTIN/PAN/bank fields. `registeredAddress` is null until an admin has
 * actually entered it; a sole-proprietorship entity distinct from the retail business, so its
 * address was never assumed or invented here — see B2bFaqService memory / V127 migration note.
 */
export type B2bBillingEntity = {
  legalName: string;
  registeredAddress: string | null;
  state: string | null;
};

export type RfqRequest = {
  contactName: string;
  phone: string;
  email?: string;
  customerGstin?: string;
  billingName?: string;
  billingAddress?: string;
  deliverySameAsBilling?: boolean;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPincode?: string;
  destinationRailwayStation?: string;
  listingId?: number; // a b2b_listings.id (same id the listing pages use)
  quantityInterest?: number;
  // Anti-spam honeypot — AntiSpamGuard rejects a submission where this is filled, or where
  // formRenderedAt is suspiciously recent (a bot submitting faster than a human could type).
  honeypot?: string;
  formRenderedAt?: number;
};
