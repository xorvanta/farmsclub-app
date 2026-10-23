/** Mirrors the backend's ApiResponse<T> wrapper exactly (see common.response.ApiResponse). */
export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
};

/** Whitelisted server-side sort keys for GET /public/b2b/listings (see PublicB2bController). */
export type ListingSort = "name" | "price_asc" | "price_desc" | "moq" | "newest";

/** A FarmsClub category (fc_categories, managed by admin in FarmsClub → Categories). */
export type ListingCategory = {
  name: string | null;
  name_hi?: string | null;
  slug: string;
  image_url?: string | null;
};

export type ListingCrop = { id: number; name: string | null; name_hi?: string | null };

/**
 * GET /public/b2b/listings and /public/b2b/listings/{id} — see PublicB2bController.
 * The server applies the visibility rule (Storefront §3.1); the app never filters hidden data itself.
 * Buyers only ever see the buyer price range / tier table — never a seller rate.
 */
export type B2bPriceTier = {
  minQty: number;
  maxQty: number | null; // null = "and above"
  pricePerUnit: number;
};

export type B2bListing = {
  id: number;
  /** Only on GET /public/b2b/listings/{id}: false = hidden/unknown (then only `title` is set). */
  available?: boolean;
  category: ListingCategory | null;
  crop?: ListingCrop | null;
  title: string;
  /** Either a JSON-encoded object of category fields, or plain text ("Other spec text"). */
  specification: string | null;
  manufacturer_brand: string | null;
  variety?: string | null;
  propagation?: string | null;
  age?: string | null;
  height?: string | null;
  bag_size?: string | null;
  unit: string | null;
  moq: number | null;
  images: string[];
  photo_url: string | null; // first image, else the category image
  dispatch_states: string[];
  transport_modes: string[];
  gst_rate: number | null;
  price_from: number | null;
  price_to: number | null;
  /** Only on GET /public/b2b/listings/{id}. */
  tiers?: B2bPriceTier[];
  // Legacy aliases the backend still sends (= moq / unit).
  bulk_min_quantity?: number | null;
  bulk_unit?: string | null;
};

/** GET /public/b2b/listings/{id} for a listing that is not visible. */
export type UnavailableListing = { available: false; title: string | null };

/** GET /public/fc/categories — live categories with at least one visible listing. */
export type FcCategory = {
  name_en: string;
  name_hi?: string | null;
  slug: string;
  image_url?: string | null;
  description?: string | null;
  sort_order?: number | null;
  legacy_code?: string | null;
  listing_count?: number | null;
};

/** GET /public/b2b/faqs and content.homeFaqs. */
export type B2bFaq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  active?: boolean;
  showOnHome?: boolean;
  ctaLabel?: string | null;
  ctaHref?: string | null;
};

// ── Farm network ────────────────────────────────────────────────────────────────────────────

export type NamedSlug = { name: string; name_hi?: string | null; slug?: string | null };
export type Place = { name: string; slug: string };

/** Farm card as returned by /public/fc/farms, /search, cross-links and more_farms_in_state. */
export type FarmCardApi = {
  slug: string;
  name: string;
  fc_code: string | null;
  verified: boolean;
  self_listed: boolean;
  featured: boolean;
  state: Place | null;
  district: Place | null;
  area_name: string | null;
  farm_types: NamedSlug[];
  crops: NamedSlug[];
  other_crops: string | null;
  cover_url: string | null;
  card_image_url: string | null;
  has_video: boolean;
  training_available: boolean;
  published_at: string | null;
};

/** Farm card as returned by /public/fc/content featuredFarms (camelCase). */
export type HomeFarmCard = {
  name: string;
  slug: string;
  district: string | null;
  state: string | null;
  coverUrl: string | null;
  videoThumbnailUrl: string | null;
  types: { nameEn: string; nameHi?: string | null }[];
  crops: { nameEn: string; nameHi?: string | null }[];
  verified: boolean;
  training: boolean;
  heroVideo: boolean;
  /** The farm's own YouTube video id (shown in the home "See the farms" section). */
  heroVideoId?: string | null;
  featured: boolean;
};

export type FarmsPage = { items: FarmCardApi[]; page: number; size: number; total: number; has_more: boolean };

export type FarmFactKey =
  | "total_land"
  | "established_year"
  | "soil_type"
  | "irrigation"
  | "farming_method"
  | "annual_production"
  | "mother_plant_stock"
  | "workforce_size"
  | "main_markets"
  | "certifications";

export type FarmFacts = Partial<Record<FarmFactKey, string | number | null>>;

export type FarmProfile = FarmCardApi & {
  moved_from?: string | null;
  facts: FarmFacts;
  short_intro: string | null;
  story: string | null;
  owner_quote: string | null;
  advice: string | null;
  owner: { name: string | null; role: string | null; photo_url: string | null; languages: string[] } | null;
  hero_video: { video_id: string; title: string } | null;
  photo_credit: string | null;
  gallery: { url: string; caption: string | null; category: string | null; is_cover: boolean }[];
  videos: { video_id: string; title: string | null }[];
  grown: {
    crop: string | null;
    crop_hi?: string | null;
    variety: string | null;
    area_or_count: string | null;
    harvest_months: number[];
    photo_url: string | null;
    note: string | null;
  }[];
  services: { name: string; description: string | null }[];
  training: {
    onsite: {
      duration: string | null;
      topics: string | null;
      language: string | null;
      batch_size: string | null;
      fee_text: string | null;
      months: number[];
    } | null;
    course: { title: string | null; language: string | null; status: string | null } | null;
  } | null;
  products: { name: string; note: string | null }[];
  whatsapp_available: boolean;
  whatsapp_url: string | null;
  more_farms_in_state: FarmCardApi[];
};

/** GET /public/fc/content */
export type FcContent = {
  hero: { headline?: string; subline?: string; searchPlaceholder?: string } | null;
  offers: { title: string; line: string }[] | null;
  banner: { title?: string; subline?: string; buttonLabel?: string } | null;
  shareImageUrl: string | null;
  registrationOpen: boolean;
  /** Admin Settings "Hindi on registration & edit pages". */
  hindiOnRegistration?: boolean;
  featuredFarms: HomeFarmCard[];
  /** Admin-uploaded home carousel photos (empty = the storefront's built-in slides). */
  heroSlides?: { imageUrl: string; title: string; subline?: string; ctaLabel?: string; ctaHref?: string }[] | null;
  /** Admin-picked YouTube videos; farmSlug/farmName only while that farm is Live. */
  homeVideos?: { videoId: string; title: string; farmSlug?: string | null; farmName?: string | null }[] | null;
  featuredListingIds: number[];
  featuredListings: B2bListing[];
  featuredListingsSource: string;
  homeFaqs: B2bFaq[];
};

export type ListItem = { id: number; nameEn: string; nameHi?: string | null };
export type CropItem = ListItem & { categoryId?: number | null };
export type FcState = { id: number; name: string; code: string | null; districts: { id: number; name: string }[] };

/** GET /public/fc/lists — dropdown values for the farm forms. */
export type FcLists = {
  farmTypes: ListItem[];
  crops: CropItem[];
  services: ListItem[];
  languages: ListItem[];
  photoCategories: ListItem[];
  states: FcState[];
};

/** GET /public/fc/filters */
export type FcFilters = {
  states: { name: string; code: string | null; slug: string; farms: number }[];
  farm_types: { id: number; name: string; name_hi?: string | null; slug: string; farms: number }[];
  crops: { id: number; name: string; name_hi?: string | null; slug: string; farms: number }[];
  training_farms: number;
  listing_crops: { id: number; name: string; name_hi?: string | null; listings: number }[];
  listing_categories: { slug: string; name: string; listings: number }[];
};

export type FcSearchResult = { q: string; farms: FarmCardApi[]; listings: B2bListing[] };

/** Bot-protection fields every public farm POST carries (see FcBotGuard). */
export type BotFields = { turnstile_token?: string; hp: string; form_elapsed_ms: number };

export type FarmRegistrationRequest = BotFields & {
  owner_name: string;
  mobile: string;
  mobile_is_whatsapp: boolean;
  farm_name: string;
  state_id: number;
  district_id?: number;
  farm_type_ids: number[];
  crop_ids: number[];
  other_crops?: string;
  total_land?: string;
  service_ids: number[];
  offers_training: boolean;
  bulk_interest: boolean;
  consent: boolean;
};

export type FarmRegistrationResult = { outcome: "CREATED" | "DUPLICATE"; photos_saved: number; photos_failed: number };

export type FarmEnquiryInterest = "visit" | "training" | "services" | "other";

export type FarmEnquiryRequest = BotFields & {
  farm_slug: string;
  name: string;
  mobile: string;
  message: string;
  interest: FarmEnquiryInterest;
};

/** The owner-editable farm payload (Admin spec §3.3 "Owner ✓"), as loaded and as submitted. */
export type OwnerFarm = {
  name?: string | null;
  farm_type_ids?: number[];
  crop_ids?: number[];
  other_crops?: string | null;
  state_id?: number | null;
  district_id?: number | null;
  area_name?: string | null;
  address?: string | null;
  map_url?: string | null;
  owner_name?: string | null;
  owner_role?: string | null;
  owner_photo_url?: string | null;
  language_ids?: number[];
  mobile?: string | null;
  mobile_is_whatsapp?: boolean;
  whatsapp_number?: string | null;
  email?: string | null;
  links?: string[];
  facts?: Record<string, string | number | null>;
  short_intro?: string | null;
  story?: string | null;
  owner_quote?: string | null;
  advice?: string | null;
  cover_url?: string | null;
  gallery?: { url: string; caption: string | null; photo_category_id: number | null }[];
  videos?: { url?: string; video_id?: string | null; title: string | null }[];
  grown?: {
    crop_id: number | null;
    variety: string | null;
    area_or_count: string | null;
    harvest_months: number[];
    photo_url: string | null;
    note: string | null;
  }[];
  services?: { preset_id: number | null; name: string | null; description: string | null }[];
  training?: {
    onsite_available: boolean;
    duration?: string | null;
    topics?: string | null;
    language?: string | null;
    batch_size?: string | null;
    fee_text?: string | null;
    months?: number[];
    course_available?: boolean;
    course_title?: string | null;
    course_language?: string | null;
  };
  products?: { name: string; note: string | null }[];
};

export type FarmEditView = {
  farm: OwnerFarm;
  pending: OwnerFarm | null;
  has_pending: boolean;
  pending_submitted_at: string | null;
  status_banner: "UNDER_REVIEW" | "LIVE" | "PREPARING";
  status_banner_text: string;
  verified: boolean;
  verification_contact_text: string | null;
  farm_name: string | null;
  profile_url: string | null;
  hero_video: { video_id: string; title: string } | null;
  hindi_enabled: boolean;
  max_gallery_photos: number;
};

export type FarmEditSubmitResult = { pending_edit_id: number; status_banner: string; contact_flags: unknown };
export type UploadedPhoto = { filename: string | null; url?: string; error?: string };

// ── Chat / RFQ / contact ────────────────────────────────────────────────────────────────────

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** POST /public/b2b/chat/ask — see B2bChatService ("Trellis"). */
export type ChatListingContext = {
  title?: string;
  category?: string;
  bulkPrice?: string; // bare buyer price range, e.g. "40–55 per plant"
  bulkUnit?: string;
  bulkMinQuantity?: string;
};

/**
 * GET /public/b2b/contact — the FarmsClub team's own contact details (Admin > B2B Console >
 * Settings). Each value is null until an admin sets it, and the UI shows nothing for a null.
 */
export type B2bContact = {
  supportEmail: string | null;
  whatsappNumber: string | null;
  phone: string | null;
  hoursLabel: string | null; // e.g. "Mon-Sat, 10am-6pm IST"
  whatsappAvailableNow: boolean;
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
  notes?: string;
  originUrl?: string;
  honeypot?: string;
  formRenderedAt?: number;
  formElapsedMs?: number;
};
