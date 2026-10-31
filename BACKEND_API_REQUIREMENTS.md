# FarmsClub Storefront v2 (Executive B2B Wholesale Edition) — Backend API Requirements

This document specifies the **4 backward-compatible backend enhancements** in `xoms-backend` (context path `/api/v1`) to power the new interactive B2B tools in `farmsclub-app`:
1. **3D Orchard & Bulk Load Visualizer** (`components/tools/Orchard3DPlanner.tsx`)
2. **Interactive Wholesale Slab & Lot Value Simulator** (`components/BulkPriceCard.tsx`)
3. **3-Step B2B RFQ Procurement Desk & GSTIN Auto-Fill** (`components/RfqFormBody.tsx`)
4. **Regional Logistics & Dispatch Corridor Matrix** (`app/listings/[id].tsx`)

---

## Global Rules & Constraints

1. **100% Backward Compatibility**: Every new request and response field MUST be optional/nullable so existing storefront builds, mobile binaries, and admin screens continue working without breaking changes.
2. **Standard Response Wrapper**: All endpoints must return the standard `ApiResponse<T>` wrapper:
   ```json
   {
     "success": true,
     "message": "Optional human-readable message",
     "data": {},
     "error": null,
     "timestamp": "2026-10-31T14:40:00Z"
   }
   ```
3. **Storefront §3.1 Privacy Rule**: Never expose seller identity, seller phone numbers, or seller rates (`seller_price`) in any `/public/**` endpoint. Only buyer-facing price slabs (`B2bPriceTier`) and `price_from` / `price_to` may be returned.
4. **Friendly Error Messages**: Any validation error returned in `error` or `message` must be a clean, human-readable sentence starting with a capital letter (e.g., `"Please enter a valid 15-character GSTIN."`). The storefront automatically masks technical/SQL/stacktrace strings.

---

## Enhancement 1: Include `tiers` & Plantation/Logistics Metadata on `B2bListing`

### Endpoints Affected
- `GET /api/v1/public/b2b/listings` (`PublicB2bController`)
- `GET /api/v1/public/b2b/listings/{id}` (`PublicB2bController`)
- `GET /api/v1/public/fc/content` (`featuredListings` inside `FcContent`)
- `GET /api/v1/public/fc/farms/{slug}/listings`
- `GET /api/v1/public/fc/search` (`listings` array)

### Requirements

#### 1.1 Populate `tiers` in List Responses
Currently, `tiers: B2bPriceTier[]` (`[{ minQty, maxQty, pricePerUnit }]`) is only populated on `GET /public/b2b/listings/{id}`.
- Populate `tiers` on `GET /public/b2b/listings` and `featuredListings` in `GET /public/fc/content` using a batch query (`WHERE listing_id IN (...)`) to avoid N+1 queries.
- This allows the Home page 3D Orchard Planner and catalog cards to compute live multi-slab rate unlocks without an extra network hop.

#### 1.2 Add Agronomic Spacing & Vehicle Load Fields to `B2bListing`
Add the following optional `snake_case` fields to the public `B2bListing` JSON payload:

```json
{
  "id": 42,
  "title": "Taiwan Pink Guava Grafted Saplings",
  "unit": "plant",
  "moq": 500,
  "price_from": 42,
  "price_to": 55,
  "tiers": [
    { "minQty": 500, "maxQty": 1999, "pricePerUnit": 55 },
    { "minQty": 2000, "maxQty": 4999, "pricePerUnit": 48 },
    { "minQty": 5000, "maxQty": null, "pricePerUnit": 42 }
  ],
  "recommended_row_spacing_ft": 12,
  "recommended_plant_spacing_ft": 12,
  "unit_weight_kg": 2.5,
  "units_per_14ft_truck": 2500,
  "estimated_dispatch_days": "3-5"
}
```

#### Database & Fallback Logic
```sql
ALTER TABLE b2b_listings
  ADD COLUMN IF NOT EXISTS recommended_row_spacing_ft NUMERIC(5,2) NULL,
  ADD COLUMN IF NOT EXISTS recommended_plant_spacing_ft NUMERIC(5,2) NULL,
  ADD COLUMN IF NOT EXISTS unit_weight_kg NUMERIC(6,2) NULL,
  ADD COLUMN IF NOT EXISTS units_per_14ft_truck INTEGER NULL,
  ADD COLUMN IF NOT EXISTS estimated_dispatch_days VARCHAR(32) NULL;

ALTER TABLE fc_crops
  ADD COLUMN IF NOT EXISTS default_row_spacing_ft NUMERIC(5,2) NULL,
  ADD COLUMN IF NOT EXISTS default_plant_spacing_ft NUMERIC(5,2) NULL;
```
- If `recommended_row_spacing_ft` / `recommended_plant_spacing_ft` are `NULL` on `b2b_listings`, fall back to `fc_crops.default_row_spacing_ft` / `default_plant_spacing_ft` when the listing is linked to a crop.
- Expose these optional fields in the Admin B2B Listing create/edit form.

---

## Enhancement 2: Persist 3D Orchard Planner & Slab Simulator Telemetry on `POST /api/v1/public/b2b/rfq`

### Endpoint Affected
- `POST /api/v1/public/b2b/rfq` (`PublicB2bController`)

### Request Payload (`RfqRequest`)
Extend `RfqRequest` and the backing RFQ / B2B Lead table to accept these optional `camelCase` fields:

```json
{
  "contactName": "Ramesh Patel",
  "phone": "9876543210",
  "email": "ramesh@patelagro.in",
  "customerGstin": "24AAAAA0000A1Z5",
  "billingName": "Patel Agro Estates",
  "billingAddress": "Plot 14, GIDC",
  "deliverySameAsBilling": false,
  "deliveryCity": "Nashik",
  "deliveryState": "Maharashtra",
  "deliveryPincode": "422001",
  "destinationRailwayStation": "Nashik Road (NK)",
  "listingId": 42,
  "quantityInterest": 3326,
  "notes": "Need grafted stock ready for monsoon planting.",
  "originUrl": "https://farmsclub.com/rfq/42?qty=3326",

  "plannedAcres": 10.0,
  "spacingPreset": "12x12 ft",
  "includeMortalityBuffer": true,
  "preferredTransportMode": "14ft Nursery Truck",
  "simulatedUnitRate": 48.0,
  "simulatedOrderValue": 159648.0
}
```

### Field Specification & Migration
| JSON Field | Java Type | DB Column | Description |
|---|---|---|---|
| `plannedAcres` | `BigDecimal` (nullable) | `planned_acres NUMERIC(8,2)` | Land size selected in the 3D Orchard Planner (e.g., `10.0`) |
| `spacingPreset` | `String` (nullable, max 40) | `spacing_preset VARCHAR(40)` | Spacing geometry selected (e.g., `"12x12 ft"`, `"8x8 ft"`, `"10x6 ft"`, `"20x20 ft"`) |
| `includeMortalityBuffer` | `Boolean` (nullable) | `include_mortality_buffer BOOLEAN` | Whether the buyer enabled the +10% mortality replacement buffer |
| `preferredTransportMode` | `String` (nullable, max 60) | `preferred_transport_mode VARCHAR(60)` | e.g., `"Indian Rail Parcel"`, `"14ft Nursery Truck"`, `"17ft Carrier"`, `"Multi-Axle Fleet"` |
| `simulatedUnitRate` | `BigDecimal` (nullable) | `simulated_unit_rate NUMERIC(12,2)` | Unlocked slab price per unit at the time of quote request |
| `simulatedOrderValue` | `BigDecimal` (nullable) | `simulated_order_value NUMERIC(14,2)` | Estimated total lot value (`quantityInterest * simulatedUnitRate`) |

- **Open Enquiry Deduplication**: When an existing open enquiry for the same phone + `listingId` is updated (existing backend behavior), overwrite these new columns if they are non-null in the incoming request.
- **Admin Console**: Return these fields in the Admin B2B Lead / RFQ detail view so the sales team sees the buyer's exact acreage, spacing plan, and simulated order value.

---

## Enhancement 3: Public GSTIN Verification & Auto-Fill Endpoint

### New Endpoint
- `GET /api/v1/public/b2b/gstin/{gstin}` (`PublicB2bController`)

### Purpose
Allows the B2B RFQ and Contact forms to validate a buyer's 15-character Indian GSTIN and auto-populate their `billingName`, `billingAddress`, `deliveryState`, `deliveryCity`, and `deliveryPincode` in one tap.

### Validation & Resolution Rules
1. Normalize `{gstin}` (trim + uppercase) and validate against the standard 15-character Indian GSTIN regex:
   ```regex
   ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
   ```
   - If invalid, return HTTP `400` with `ApiResponse`:
     ```json
     {
       "success": false,
       "error": "Please enter a valid 15-character GSTIN.",
       "timestamp": "2026-10-31T14:40:00Z"
     }
     ```
2. Resolve the 2-digit Indian GST State Code prefix (`01` = Jammu & Kashmir ... `09` = Uttar Pradesh ... `24` = Gujarat ... `27` = Maharashtra ... `37` = Andhra Pradesh) using a built-in static map.
   - **Important**: Even if an external GST registry provider is not configured or times out, the endpoint MUST still succeed with `validFormat: true`, `stateCode`, and `state`.
3. Check previous verified B2B records / cache or configured GST registry provider for `legalName`, `tradeName`, `billingAddress`, `city`, and `pincode`:
   ```json
   {
     "success": true,
     "data": {
       "gstin": "27AAPFU0939F1ZV",
       "validFormat": true,
       "verifiedFromRegistry": true,
       "legalName": "Sahyadri Horticulture Pvt Ltd",
       "tradeName": "Sahyadri Farms",
       "billingAddress": "Gat No 314, Mohadi, Dindori",
       "city": "Nashik",
       "state": "Maharashtra",
       "stateCode": "27",
       "pincode": "422202"
     },
     "timestamp": "2026-10-31T14:40:00Z"
   }
   ```
4. Rate-limit this endpoint per IP (e.g., 20 requests/minute) to prevent scraping.

---

## Enhancement 4: Regional Dispatch Corridor & Transit Estimator on `GET /api/v1/public/b2b/listings/{id}`

### Endpoint Affected
- `GET /api/v1/public/b2b/listings/{id}` (`PublicB2bController`)

### Response Addition
Add optional `origin_zone` and `dispatch_corridors` fields to `B2bListing` on the single-listing detail response so the storefront's **Logistics & Dispatch Corridor** card can show realistic transit windows by destination region without revealing the seller's farm identity:

```json
{
  "origin_zone": "North & Central Nursery Belt",
  "dispatch_corridors": [
    {
      "region": "North India (UP, HR, PB, RJ, DL)",
      "rail_transit_hours": "18-30 hrs",
      "truck_transit_days": "1-2 days",
      "recommended_mode": "14ft Nursery Truck / Rail Parcel"
    },
    {
      "region": "West & Central India (MH, GJ, MP)",
      "rail_transit_hours": "24-42 hrs",
      "truck_transit_days": "2-4 days",
      "recommended_mode": "17ft Covered Carrier"
    },
    {
      "region": "South & East India (KA, TG, AP, WB, BR)",
      "rail_transit_hours": "36-60 hrs",
      "truck_transit_days": "4-6 days",
      "recommended_mode": "Indian Rail Parcel Van (VPU)"
    }
  ]
}
```
- Can be generated dynamically from the listing's `dispatch_states` / `transport_modes` or configured in Admin -> B2B Console -> Settings.

---

## Acceptance Checklist
- [ ] `GET /api/v1/public/b2b/listings` includes `tiers` and the optional spacing/truck fields (`recommended_row_spacing_ft`, `recommended_plant_spacing_ft`, `unit_weight_kg`, `units_per_14ft_truck`, `estimated_dispatch_days`) on every item.
- [ ] `GET /api/v1/public/b2b/listings/{id}` includes `tiers`, spacing/truck fields, `origin_zone`, and `dispatch_corridors`.
- [ ] `POST /api/v1/public/b2b/rfq` accepts and persists `plannedAcres`, `spacingPreset`, `includeMortalityBuffer`, `preferredTransportMode`, `simulatedUnitRate`, and `simulatedOrderValue`.
- [ ] `GET /api/v1/public/b2b/gstin/{gstin}` validates 15-character GSTINs, always resolves `state` + `stateCode` from the 2-digit prefix, and returns cached/registry `legalName`/`tradeName`/`billingAddress`/`city`/`pincode` when available.
- [ ] Seller identity and seller rates remain 100% hidden on all `/public/**` endpoints.
