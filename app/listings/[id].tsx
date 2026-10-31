import { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Platform, Pressable, useWindowDimensions, type ScrollView } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { StickyBar } from "@/components/StickyBar";
import { Tag } from "@/components/Tag";
import { BulkPriceCard } from "@/components/BulkPriceCard";
import { SpecificationSection, ImageGallery, specificationSummary } from "@/components/ListingSpecs";
import { Button } from "@/components/Button";
import { RfqFormBody } from "@/components/RfqFormBody";
import { FarmCard, fromFarmCard } from "@/components/FarmCard";
import { Orchard3DPlanner } from "@/components/tools/Orchard3DPlanner";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { LogoMark } from "@/components/graphics/LogoMark";
import { b2bApi, fcApi, errorMessage, isAvailableListing, isNotFound, parseListingId } from "@/lib/api";
import { formatQty } from "@/lib/format";
import { listingBarePrice, listingCategoryName, listingMoq, listingMoqLabel, listingPriceLabel, listingUnit, showsGst } from "@/lib/listing";
import { useChat } from "@/lib/chat-context";
import type { B2bListing, FarmCardApi } from "@/lib/types";

const DETAIL_MAX_WIDTH = 1140;

export default function ListingDetail() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { openChat, setListingContext } = useChat();
  const formScrollRef = useRef<ScrollView>(null);
  const [listing, setListing] = useState<B2bListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<{ title: string | null } | null>(null);
  const [farms, setFarms] = useState<FarmCardApi[]>([]);
  const [selectedQty, setSelectedQty] = useState<number | null>(null);
  const [simUnitRate, setSimUnitRate] = useState<number | null>(null);
  const [simOrderValue, setSimOrderValue] = useState<number | null>(null);
  const [mobilePlannerOpen, setMobilePlannerOpen] = useState(false);
  const listingId = parseListingId(id);

  const load = useCallback(() => {
    setError(null);
    setUnavailable(null);
    setListing(null);
    setFarms([]);
    if (listingId == null) return;
    b2bApi
      .getListing(listingId)
      .then((l) => (isAvailableListing(l) ? setListing(l) : setUnavailable({ title: l?.title ?? null })))
      .catch((e) => (isNotFound(e) ? setUnavailable({ title: null }) : setError(errorMessage(e))));
    fcApi
      .getListingFarms(listingId)
      .then((rows) => setFarms(Array.isArray(rows) ? rows.slice(0, 4) : []))
      .catch(() => setFarms([]));
  }, [listingId]);

  useEffect(() => void load(), [load]);

  useEffect(() => {
    if (!listing) return;
    const moq = listingMoq(listing);
    setSelectedQty(moq ?? null);
    setListingContext({
      title: listing.title,
      category: listingCategoryName(listing) ?? undefined,
      bulkPrice: listingBarePrice(listing) ?? undefined,
      bulkUnit: listingUnit(listing) ?? undefined,
      bulkMinQuantity: moq != null ? String(moq) : undefined,
    });
    return () => setListingContext(null);
  }, [listing, setListingContext]);

  const handleSimulation = useCallback((sim: { qty: number; unitRate: number | null; orderValue: number | null }) => {
    setSelectedQty(sim.qty);
    setSimUnitRate(sim.unitRate);
    setSimOrderValue(sim.orderValue);
  }, []);

  const idPending = id === undefined || id === "" || id === "[id]";
  if (idPending) {
    return (
      <AppShell noScroll>
        <LoadingState label="Loading…" />
      </AppShell>
    );
  }

  if (listingId == null || unavailable) {
    const title = unavailable?.title ?? null;
    return (
      <AppShell
        keyboardAware
        hideBottomNav
        scrollRef={formScrollRef}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 680, width: "100%", alignSelf: "center" }}
      >
        <SeoHead title={title ? `${title} · FarmsClub` : "Not available · FarmsClub"} noindex />
        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
          <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink, lineHeight: 30 }}>
            This item is currently not available
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.inkSoft, lineHeight: 21 }}>
            {title ? `${title} isn't listed right now. ` : ""}Tell us what you need and the FarmsClub team will get back to you.
          </Text>
          <Link href="/listings" style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.brand, paddingVertical: 8 }}>
            Browse bulk supply →
          </Link>
        </View>
        <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.xl }}>
          <RfqFormBody listing={null} listingId={null} scrollRef={formScrollRef} initialNotes={title ?? undefined} />
        </View>
      </AppShell>
    );
  }

  if (!listing && !error) {
    return (
      <AppShell noScroll>
        <LoadingState label="Loading…" />
      </AppShell>
    );
  }
  if (error || !listing) {
    return (
      <AppShell noScroll>
        <SeoHead title="Bulk supply · FarmsClub" noindex />
        <ErrorState message={error ?? "This item couldn't be loaded."} onRetry={load} />
      </AppShell>
    );
  }

  const category = listingCategoryName(listing);
  const price = listingPriceLabel(listing);
  const moq = listingMoqLabel(listing);
  const gst = showsGst(listing);
  const specSummary = specificationSummary(listing.specification);
  const fallbackImage = listing.photo_url || listing.category?.image_url || null;
  const images = listing.images?.length ? listing.images : fallbackImage ? [fallbackImage] : [];
  const metaDescription = [
    `${listing.title} in bulk on FarmsClub`,
    price ? `${price}, priced by quantity` : null,
    moq,
    specSummary,
  ]
    .filter(Boolean)
    .join(" · ");
  const wide = width >= 880;
  const isPhone = width < 560;
  const column = { width: "100%" as const, maxWidth: DETAIL_MAX_WIDTH, alignSelf: "center" as const };

  const rfqParams: Record<string, string> = { listingId: String(listing.id) };
  if (selectedQty != null) rfqParams.qty = String(selectedQty);
  if (simUnitRate != null) rfqParams.unitRate = String(simUnitRate);
  if (simOrderValue != null) rfqParams.orderVal = String(simOrderValue);

  const rfqHref = {
    pathname: "/rfq/[listingId]" as const,
    params: rfqParams,
  };

  const corridors = listing.dispatch_corridors ?? [];
  const uniqueFromZones = new Set(corridors.map((c) => c.from_zone).filter(Boolean));
  const showFromZoneBadge = uniqueFromZones.size > 1;
  const hasLogisticsCard =
    (listing.dispatch_states?.length ?? 0) > 0 ||
    (listing.transport_modes?.length ?? 0) > 0 ||
    !!listing.origin_zone ||
    corridors.length > 0 ||
    !!listing.estimated_dispatch_days ||
    listing.units_per_14ft_truck != null;

  const gallery = (
    <View style={{ gap: isPhone ? spacing.sm : spacing.md }}>
      <ImageGallery
        images={images}
        aspectRatio={wide ? 1.25 : 1.35}
        maxHeight={500}
        alt={listing.title}
        fallback={
          <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", backgroundColor: colors.brandSoft }]}>
            <LogoMark size={56} />
          </View>
        }
      />

      {/* Visual Trade Guarantees under Gallery — Single non-wrapping row on mobile */}
      <View style={{ flexDirection: "row", gap: isPhone ? 6 : spacing.sm }}>
        {[
          { title: "Nursery Graded", sub: "Batch checked" },
          { title: "Road & Rail", sub: "Pan-India" },
          { title: "Single Desk", sub: "Quote to door" },
        ].map((g) => (
          <View
            key={g.title}
            style={{
              flex: 1,
              minWidth: 0,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              paddingVertical: isPhone ? 8 : 10,
              paddingHorizontal: isPhone ? 6 : 10,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
            }}
          >
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: isPhone ? 11 : 12, color: colors.brand }}>
              {g.title}
            </Text>
            <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: isPhone ? 10 : 11, color: colors.inkSoft }}>
              {g.sub}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const info = (
    <View style={{ gap: isPhone ? 12 : spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <Link href="/listings" style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.brand }}>
          ← Bulk Supply
        </Link>
        {category ? <Tag label={category} tone="brand" /> : null}
      </View>

      <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: wide ? 30 : 23, color: colors.ink, lineHeight: wide ? 36 : 29 }}>
        {listing.title}
      </Text>

      <BulkPriceCard listing={listing} onSelectQuantity={setSelectedQty} onSelectSimulation={handleSimulation} />

      {/* Visual Logistics & Dispatch Corridor */}
      {hasLogisticsCard ? (
        <View
          style={{
            gap: isPhone ? 10 : spacing.md,
            backgroundColor: colors.surface,
            padding: isPhone ? 14 : spacing.lg,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.brandSoft, alignItems: "center", justifyContent: "center" }}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={colors.brand} strokeWidth={2}>
                <Rect x={2} y={7} width={13} height={9} rx={1} />
                <Path d="M15 10h4l3 3v3h-7" />
                <Circle cx={6.5} cy={18} r={2} />
                <Circle cx={18.5} cy={18} r={2} />
              </Svg>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.ink }}>
                Logistics & Dispatch Corridor
              </Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.inkSoft }}>
                {listing.origin_zone
                  ? `Origin: ${listing.origin_zone}`
                  : "Direct nursery loading via road carrier or Indian Railways parcel van"}
              </Text>
            </View>
          </View>

          {listing.dispatch_states?.length > 0 && <InfoLine label="Origin Belts" values={listing.dispatch_states} />}
          {listing.transport_modes?.length > 0 && <InfoLine label="Transit Modes" values={listing.transport_modes} />}

          {(listing.estimated_dispatch_days || listing.units_per_14ft_truck != null || listing.unit_weight_kg != null) ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {listing.estimated_dispatch_days ? (
                <Tag label={`Dispatch in ${listing.estimated_dispatch_days} days`} tone="accent" />
              ) : null}
              {listing.units_per_14ft_truck != null && Number(listing.units_per_14ft_truck) > 0 ? (
                <Tag label={`14ft Truck: ~${formatQty(Number(listing.units_per_14ft_truck))} units`} tone="neutral" />
              ) : null}
              {listing.unit_weight_kg != null && Number(listing.unit_weight_kg) > 0 ? (
                <Tag label={`Unit Wt: ${listing.unit_weight_kg} kg`} tone="neutral" />
              ) : null}
            </View>
          ) : null}

          {corridors.length > 0 ? (
            <View
              style={{
                marginTop: 2,
                borderRadius: radius.md,
                backgroundColor: colors.paper,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  backgroundColor: colors.brandSoft,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.5, color: colors.brand, textTransform: "uppercase" }}>
                  DESTINATION REGION
                </Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.5, color: colors.brand, textTransform: "uppercase" }}>
                  EST. TRANSIT (RAIL / ROAD)
                </Text>
              </View>
              {corridors.map((c, idx) => (
                <View
                  key={`${c.from_zone ?? ""}-${c.region}-${idx}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderTopWidth: idx > 0 ? StyleSheet.hairlineWidth : 0,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.ink }}>
                      {c.region}
                    </Text>
                    {(showFromZoneBadge && c.from_zone) || c.recommended_mode ? (
                      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft }}>
                        {[showFromZoneBadge && c.from_zone ? `From ${c.from_zone}` : null, c.recommended_mode].filter(Boolean).join(" · ")}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.brand }}>
                      {[
                        c.rail_transit_hours ? `🚆 ${c.rail_transit_hours}` : null,
                        c.truck_transit_days ? `🚚 ${c.truck_transit_days}` : null,
                      ]
                        .filter(Boolean)
                        .join("  ·  ") || "On quote"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {listing.dispatch_corridors_note ? (
            <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, lineHeight: 16 }}>
              {listing.dispatch_corridors_note}
            </Text>
          ) : null}
        </View>
      ) : null}

      <SpecificationSection listing={listing} />

      {/* Trade Desk Action Row */}
      <View
        style={{
          backgroundColor: colors.brandSoft,
          borderRadius: radius.lg,
          padding: isPhone ? 14 : spacing.lg,
          borderWidth: 1,
          borderColor: "rgba(18,56,36,0.15)",
          gap: spacing.sm,
        }}
      >
        <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.heading, fontSize: 15, color: colors.brand }}>
          Brokered by the FarmsClub Trade Desk
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 19 }}>
          Lock your volume slab above or request a custom quote. Our team confirms batch readiness and transit charges to your city or railway station.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: 2 }}>
          <Link href={rfqHref} asChild>
            <Button label={selectedQty ? `Request Quote (${formatQty(selectedQty)}) →` : "Request a quote →"} />
          </Link>
          <Button label="Ask Trellis AI" variant="outline" onPress={() => openChat()} />
        </View>
      </View>
    </View>
  );

  return (
    <AppShell
      stickyBar={
        <StickyBar maxWidth={DETAIL_MAX_WIDTH}>
          <View style={{ flex: 1, minWidth: 0 }}>
            {price ? (
              <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: wide ? 18 : 15, color: colors.brand }}>
                {price}
                {gst ? <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft }}> + GST</Text> : null}
              </Text>
            ) : null}
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.inkSoft }}>
              {selectedQty ? `Lot: ${formatQty(selectedQty)} units` : moq ?? "Wholesale bulk lot"}
            </Text>
          </View>
          <View style={{ flexShrink: 0 }}>
            <Link href={rfqHref} asChild>
              <Button label={selectedQty ? (isPhone ? `Quote (${formatQty(selectedQty)}) →` : `Quote ${formatQty(selectedQty)} units →`) : "Get Quote →"} />
            </Link>
          </View>
        </StickyBar>
      }
    >
      <SeoHead title={`${listing.title} · FarmsClub`} description={metaDescription} image={images[0] ?? null} />
      <View style={[column, { padding: isPhone ? 14 : spacing.lg, gap: isPhone ? spacing.xl : spacing.xxl }]}>
        {wide ? (
          <View style={{ flexDirection: "row", gap: spacing.xl, alignItems: "flex-start" }}>
            <View style={{ flex: 1, position: Platform.OS === "web" ? ("sticky" as "relative") : "relative", top: 16 }}>{gallery}</View>
            <View style={{ flex: 1.12 }}>{info}</View>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {gallery}
            {info}
          </View>
        )}

        {/* Interactive 3D Orchard & Acreage Simulator — Collapsible on Mobile to keep Product Page compact */}
        {wide ? (
          <Orchard3DPlanner listing={listing} />
        ) : (
          <View style={{ gap: spacing.sm }}>
            <LinearGradient
              colors={["#071A10", "#123824"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: radius.lg,
                padding: 14,
                borderWidth: 1,
                borderColor: "rgba(229,180,98,0.35)",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.8, color: "#E5B462", textTransform: "uppercase" }}>
                  📐 3D ACREAGE & LOAD CALCULATOR
                </Text>
                <Text style={{ fontFamily: fonts.heading, fontSize: 14.5, color: "#FFFFFF", lineHeight: 19 }}>
                  Calculating saplings for your land?
                </Text>
              </View>
              <Pressable
                onPress={() => setMobilePlannerOpen((v) => !v)}
                accessibilityRole="button"
                style={{
                  backgroundColor: mobilePlannerOpen ? "rgba(255,255,255,0.14)" : "#E5B462",
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radius.pill,
                }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: mobilePlannerOpen ? "#FFFFFF" : "#081E12" }}>
                  {mobilePlannerOpen ? "Hide ✕" : "Open 3D Sim →"}
                </Text>
              </Pressable>
            </LinearGradient>
            {mobilePlannerOpen ? <Orchard3DPlanner listing={listing} /> : null}
          </View>
        )}

        {farms.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: wide ? 24 : 20, color: colors.ink }}>
              Verified farms growing this crop
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
              {farms.map((f) => (
                <View key={f.slug} style={{ flexBasis: width >= 1100 ? "23%" : width >= 600 ? "47%" : "100%", flexGrow: 1, maxWidth: width >= 600 ? undefined : "100%" }}>
                  <FarmCard farm={fromFarmCard(f)} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </AppShell>
  );
}

function InfoLine({ label, values }: { label: string; values: string[] }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.inkSoft, minWidth: 92 }}>{label}</Text>
      {values.map((v) => (
        <Tag key={v} label={v} tone="brand" />
      ))}
    </View>
  );
}
