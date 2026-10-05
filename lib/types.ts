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
 * As of 2026-10-06 this is sourced directly from `products` (a seller's real retail listing
 * flagged bulk_enabled with its own flat price), not a separate B2B catalogue — "one listing
 * serves two websites". A single flat price + MOQ, no tiered pricing.
 */
export type B2bListing = {
  id: number;
  title: string;
  specification: string | null;
  photo_url: string | null;
  bulk_price: number;
  bulk_min_quantity: number | null;
  bulk_unit: string | null;
  bulk_category: Category;
  compare_price: number | null; // retail MRP, shown struck through for a credibility anchor
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
  listingId?: number; // a products.id
  quantityInterest?: number;
  // Anti-spam honeypot — AntiSpamGuard rejects a submission where this is filled, or where
  // formRenderedAt is suspiciously recent (a bot submitting faster than a human could type).
  honeypot?: string;
  formRenderedAt?: number;
};
