/** Mirrors the backend's ApiResponse<T> wrapper exactly (see common.response.ApiResponse). */
export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
};

export type Category = "PLANT" | "POT" | "TOOL" | "SOIL_FERTILISER" | "OTHER";

/** One row from b2b_price_tiers — snake_case, as JdbcTemplate returns it untransformed. */
export type PriceTier = {
  min_qty: number;
  max_qty: number | null; // null = largest tier, no upper bound
  buyer_price: number;
};

/** GET /public/b2b/listings and /public/b2b/listings/{id} — see PublicB2bController. */
export type B2bListing = {
  id: number;
  category: Category;
  title: string;
  specification: string | null;
  unit: string;
  moq: number | null;
  photo_url: string | null;
  manufacturer_brand: string | null;
  priceTiers: PriceTier[];
  dispatchStates: string[];
  transportModes: string[];
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
  listingId?: number;
  quantityInterest?: number;
  // Anti-spam honeypot — AntiSpamGuard rejects a submission where this is filled, or where
  // formRenderedAt is suspiciously recent (a bot submitting faster than a human could type).
  honeypot?: string;
  formRenderedAt?: number;
};
