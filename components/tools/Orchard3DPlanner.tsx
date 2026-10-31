import { useState, useMemo, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Svg, { Polygon, Circle, Line, Path, Rect, Ellipse, G, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { formatRupees, formatQty } from "@/lib/format";
import type { B2bListing } from "@/lib/types";

type PresetKey = "crop_default" | "orchard" | "high_density" | "timber" | "canopy";

type SpacingPreset = {
  key: PresetKey;
  label: string;
  shortLabel: string;
  spacingFt: string;
  plantsPerAcre: number;
  cropsHint: string;
  gridCols: number;
  gridRows: number;
  foliageColor: string;
  crownColor: string;
  fruitDotColor: string;
};

const PRESETS: SpacingPreset[] = [
  {
    key: "orchard",
    label: "Standard Orchard",
    shortLabel: "Orchard",
    spacingFt: "12×12 ft",
    plantsPerAcre: 302,
    cropsHint: "Mango · Guava · Citrus · Litchi",
    gridCols: 5,
    gridRows: 4,
    foliageColor: "#28844E",
    crownColor: "#52C388",
    fruitDotColor: "#E5B462",
  },
  {
    key: "high_density",
    label: "High-Density",
    shortLabel: "HD Grid",
    spacingFt: "8×8 ft",
    plantsPerAcre: 680,
    cropsHint: "HD Guava · Pomegranate · Apple Ber",
    gridCols: 6,
    gridRows: 5,
    foliageColor: "#1E6F40",
    crownColor: "#6FC28F",
    fruitDotColor: "#E06D24",
  },
  {
    key: "timber",
    label: "Timber / Boundary",
    shortLabel: "Timber",
    spacingFt: "10×6 ft",
    plantsPerAcre: 726,
    cropsHint: "Tissue Teak · Mahogany · Bamboo",
    gridCols: 6,
    gridRows: 4,
    foliageColor: "#165B33",
    crownColor: "#42A86C",
    fruitDotColor: "#C89D54",
  },
  {
    key: "canopy",
    label: "Large Canopy",
    shortLabel: "Canopy",
    spacingFt: "20×20 ft",
    plantsPerAcre: 109,
    cropsHint: "Grafted Mango · Coconut · Jackfruit",
    gridCols: 4,
    gridRows: 3,
    foliageColor: "#237A48",
    crownColor: "#5ED193",
    fruitDotColor: "#F2C14E",
  },
];

const ACRE_OPTIONS = [1, 3, 5, 10, 25, 50] as const;

type CameraMode = "isometric" | "blueprint" | "elevation";

export function Orchard3DPlanner({ listing, compactMode = false }: { listing?: B2bListing | null; compactMode?: boolean }) {
  const { colors, fonts, radius, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 920 && !compactMode;
  const isPhone = width < 560;

  const customCropPreset = useMemo<SpacingPreset | null>(() => {
    const rFt = listing?.recommended_row_spacing_ft != null ? Number(listing.recommended_row_spacing_ft) : 0;
    const pFt = listing?.recommended_plant_spacing_ft != null ? Number(listing.recommended_plant_spacing_ft) : 0;
    if (rFt > 0 && pFt > 0) {
      const perAcre = Math.max(1, Math.round(43560 / (rFt * pFt)));
      return {
        key: "crop_default",
        label: "Crop Recommended",
        shortLabel: "Crop Rec",
        spacingFt: `${rFt}×${pFt} ft`,
        plantsPerAcre: perAcre,
        cropsHint: listing?.crop?.name ? `${listing.crop.name} standard spacing` : listing?.title ?? "Recommended spacing",
        gridCols: perAcre >= 500 ? 6 : perAcre <= 150 ? 4 : 5,
        gridRows: perAcre >= 500 ? 5 : perAcre <= 150 ? 3 : 4,
        foliageColor: "#25854D",
        crownColor: "#58CC8E",
        fruitDotColor: "#E5B462",
      };
    }
    return null;
  }, [listing]);

  const activePresets = useMemo<SpacingPreset[]>(() => {
    if (!customCropPreset) return PRESETS;
    // Keep 4 pills so mobile single-row layout stays compact and unclipped
    return [customCropPreset, ...PRESETS.slice(0, 3)];
  }, [customCropPreset]);

  const [presetKey, setPresetKey] = useState<PresetKey>(customCropPreset ? "crop_default" : "orchard");
  useEffect(() => {
    if (customCropPreset) setPresetKey("crop_default");
  }, [customCropPreset]);

  const [acres, setAcres] = useState<number>(5);
  const [includeBuffer, setIncludeBuffer] = useState<boolean>(true);
  const [camera, setCamera] = useState<CameraMode>("isometric");

  const preset = useMemo(
    () => activePresets.find((p) => p.key === presetKey) ?? activePresets[0],
    [activePresets, presetKey],
  );

  const basePlants = Math.round(acres * preset.plantsPerAcre);
  const totalPlants = includeBuffer ? Math.round(basePlants * 1.1) : basePlants;

  // Calculate active unit rate if a specific B2bListing is attached
  const pricingEstimate = useMemo(() => {
    if (!listing) return null;
    const tiers = listing.tiers ?? [];
    if (tiers.length > 0) {
      const sorted = [...tiers].sort((a, b) => Number(a.minQty) - Number(b.minQty));
      let matched = sorted[0];
      for (const t of sorted) {
        if (totalPlants >= Number(t.minQty)) matched = t;
      }
      const unitRate = Number(matched.pricePerUnit);
      const baseRate = Number(sorted[0].pricePerUnit);
      const totalCost = unitRate * totalPlants;
      const saved = Math.max(0, (baseRate - unitRate) * totalPlants);
      return { unitRate, totalCost, saved };
    }
    if (listing.price_from != null) {
      const unitRate = Number(listing.price_from);
      return { unitRate, totalCost: unitRate * totalPlants, saved: 0 };
    }
    return null;
  }, [listing, totalPlants]);

  // Logistics load calculation using backend units_per_14ft_truck & unit_weight_kg when available
  const logistics = useMemo(() => {
    const truck14Cap =
      listing?.units_per_14ft_truck != null && Number(listing.units_per_14ft_truck) > 0
        ? Math.round(Number(listing.units_per_14ft_truck))
        : 2500;
    const unitKg =
      listing?.unit_weight_kg != null && Number(listing.unit_weight_kg) > 0
        ? Number(listing.unit_weight_kg)
        : null;
    const totalKg = unitKg != null ? Math.round(totalPlants * unitKg) : null;
    const weightLabel =
      totalKg != null
        ? totalKg >= 1000
          ? `${(totalKg / 1000).toFixed(1)}t`
          : `${formatQty(totalKg)} kg`
        : null;

    const railCap = Math.max(200, Math.round(truck14Cap * 0.25));
    const heavyCap = Math.round(truck14Cap * 2.6);

    if (totalPlants <= railCap) {
      return {
        vehicle: "Rail Parcel / Pick-up",
        capacityPct: Math.min(100, Math.round((totalPlants / railCap) * 100)),
        modeTag: weightLabel ? `RAIL · ~${weightLabel}` : "RAIL / LIGHT ROAD",
      };
    }
    if (totalPlants <= truck14Cap) {
      return {
        vehicle: "14ft Nursery Truck",
        capacityPct: Math.min(100, Math.round((totalPlants / truck14Cap) * 100)),
        modeTag: weightLabel ? `14FT LOAD · ~${weightLabel}` : "DIRECT TRUCK",
      };
    }
    if (totalPlants <= heavyCap) {
      return {
        vehicle: "17ft Plantation Carrier",
        capacityPct: Math.min(100, Math.round((totalPlants / heavyCap) * 100)),
        modeTag: weightLabel ? `CARRIER · ~${weightLabel}` : "HEAVY CARRIER",
      };
    }
    return {
      vehicle: `${Math.ceil(totalPlants / (truck14Cap * 2.4))}× Multi-Axle / Rail Van`,
      capacityPct: 96,
      modeTag: weightLabel ? `FLEET · ~${weightLabel}` : "BULK FLEET",
    };
  }, [listing, totalPlants]);

  const handleRequestQuote = () => {
    const cleanSpacing = preset.spacingFt.replace("×", "x").slice(0, 40);
    const cleanMode = logistics.vehicle.slice(0, 60);
    const plannerParams: Record<string, string> = {
      qty: String(totalPlants),
      acres: String(acres),
      spacing: cleanSpacing,
      buffer: includeBuffer ? "1" : "0",
      mode: cleanMode,
    };
    if (pricingEstimate) {
      plannerParams.unitRate = String(Math.round(pricingEstimate.unitRate * 100) / 100);
      plannerParams.orderVal = String(Math.round(pricingEstimate.totalCost * 100) / 100);
    }

    if (listing?.id) {
      router.push({
        pathname: "/rfq/[listingId]",
        params: { listingId: String(listing.id), ...plannerParams },
      });
    } else {
      const summary = `${preset.label} (${preset.spacingFt}) · ${acres} ${acres === 1 ? "Acre" : "Acres"} · ${formatQty(totalPlants)} saplings${includeBuffer ? " (incl. 10% buffer)" : ""}`;
      router.push({
        pathname: "/contact",
        params: { product: summary, ...plannerParams },
      });
    }
  };

  const svgWidth = isPhone ? Math.min(280, Math.max(220, Math.floor(width - 76))) : 420;

  return (
    <View
      nativeID="orchard-3d-planner"
      style={{
        borderRadius: radius.xl,
        overflow: "hidden",
        backgroundColor: "#081E12",
        borderWidth: 1,
        borderColor: "rgba(229,180,98,0.32)",
        shadowColor: "#05140C",
        shadowOpacity: 0.2,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={["#071A10", "#0E2E1C", "#081E12"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: isPhone ? 14 : spacing.xxl }}
      >
        {/* Top Header Strip — flexShrink: 1 & minWidth: 0 prevents any right-edge clipping on mobile */}
        <View
          style={{
            flexDirection: isPhone ? "column" : "row",
            alignItems: isPhone ? "stretch" : "center",
            justifyContent: "space-between",
            gap: isPhone ? 10 : spacing.md,
            marginBottom: isPhone ? 12 : spacing.xl,
          }}
        >
          <View style={{ gap: 3, flexShrink: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#52C388" }} />
              <Text
                numberOfLines={1}
                style={{ fontFamily: fonts.bodyBold, fontSize: isPhone ? 10.5 : 11.5, letterSpacing: 1, textTransform: "uppercase", color: "#E5B462", flexShrink: 1 }}
              >
                3D ORCHARD & BULK LOAD SIMULATOR
              </Text>
            </View>
            <Text
              accessibilityRole="header"
              aria-level={2}
              style={{
                fontFamily: fonts.display,
                fontSize: isPhone ? 19 : 28,
                lineHeight: isPhone ? 24 : 34,
                color: "#FFFFFF",
              }}
            >
              {listing ? `Plan your ${listing.title} plantation` : isPhone ? "Plan your acreage & bulk load in 3D" : "Visualize your acreage & bulk dispatch load in 3D"}
            </Text>
          </View>

          {/* 3D Camera Angle Switcher */}
          <View
            style={{
              alignSelf: isPhone ? "flex-start" : "auto",
              flexDirection: "row",
              backgroundColor: "rgba(255,255,255,0.07)",
              padding: 3,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.14)",
            }}
          >
            {(
              [
                { id: "isometric", label: "3D Terrain" },
                { id: "blueprint", label: "Grid Map" },
                { id: "elevation", label: "Row Profile" },
              ] as const
            ).map((cam) => {
              const active = camera === cam.id;
              return (
                <Pressable
                  key={cam.id}
                  onPress={() => setCamera(cam.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={{
                    paddingHorizontal: isPhone ? 10 : 12,
                    paddingVertical: isPhone ? 5 : 6,
                    borderRadius: radius.pill,
                    backgroundColor: active ? "#E5B462" : "transparent",
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: active ? "#081E12" : "rgba(255,255,255,0.82)" }}>
                    {cam.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Main Workspace: 2-Column on Desktop, Compact Integrated Cockpit on Mobile */}
        <View style={{ flexDirection: wide ? "row" : "column", gap: isPhone ? 12 : spacing.xl, alignItems: "stretch" }}>
          {/* LEFT / TOP: 3D Interactive Visual Stage */}
          <View
            style={{
              flex: wide ? 1.15 : undefined,
              backgroundColor: "rgba(5, 18, 11, 0.72)",
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: "rgba(229,180,98,0.24)",
              padding: isPhone ? 10 : spacing.md,
              justifyContent: "space-between",
              minHeight: isPhone ? 185 : 320,
            }}
          >
            {/* Top Telemetry Overlay inside 3D Viewport */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <View style={{ backgroundColor: "rgba(229,180,98,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: "#E5B462" }}>
                  {preset.spacingFt} · {preset.plantsPerAcre}/ACRE
                </Text>
              </View>
              <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: "rgba(255,255,255,0.68)", flexShrink: 1 }}>
                {preset.cropsHint}
              </Text>
            </View>

            {/* SVG 3D Stage */}
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: isPhone ? 2 : 8 }}>
              <IsometricOrchardScene preset={preset} acres={acres} camera={camera} compact={isPhone} svgW={svgWidth} />
            </View>

            {/* Bottom Legend inside 3D Viewport */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 6,
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.08)",
                paddingTop: isPhone ? 6 : 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: preset.crownColor }} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 11, color: "rgba(255,255,255,0.78)" }}>Canopy</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 10, height: 2, backgroundColor: "#38BDF8" }} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 11, color: "rgba(255,255,255,0.78)" }}>Drip Line</Text>
                </View>
              </View>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: "#6FC28F" }}>
                {acres} {acres === 1 ? "Acre" : "Acres"} ({Math.round(acres * 43560).toLocaleString("en-IN")} sq.ft)
              </Text>
            </View>
          </View>

          {/* RIGHT / BOTTOM: Compact Controls & Live B2B Procurement Readout */}
          <View style={{ flex: wide ? 1 : undefined, gap: isPhone ? 10 : spacing.md, justifyContent: "space-between" }}>
            {/* Control 1: Plantation Spacing — Single 4-pill row on mobile, 2x2 grid on desktop */}
            <View style={{ gap: 5 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.7, textTransform: "uppercase", color: "rgba(255,255,255,0.72)" }}>
                1. Spacing Grid
              </Text>
              <View style={{ flexDirection: "row", flexWrap: isPhone ? "nowrap" : "wrap", gap: isPhone ? 6 : 8 }}>
                {activePresets.map((p) => {
                  const active = p.key === presetKey;
                  return (
                    <Pressable
                      key={p.key}
                      onPress={() => setPresetKey(p.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={{
                        flex: isPhone ? 1 : undefined,
                        flexGrow: isPhone ? 1 : 1,
                        flexBasis: isPhone ? 0 : "45%",
                        minWidth: 0,
                        paddingVertical: isPhone ? 7 : 9,
                        paddingHorizontal: isPhone ? 4 : 12,
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor: active ? "#E5B462" : "rgba(255,255,255,0.14)",
                        backgroundColor: active ? "rgba(229,180,98,0.16)" : "rgba(255,255,255,0.04)",
                        alignItems: isPhone ? "center" : "stretch",
                      }}
                    >
                      {isPhone ? (
                        <>
                          <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: active ? "#E5B462" : "#FFFFFF" }}>
                            {p.spacingFt}
                          </Text>
                          <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 9.5, color: "rgba(255,255,255,0.72)" }}>
                            {p.shortLabel}
                          </Text>
                        </>
                      ) : (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                          <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: active ? "#E5B462" : "#FFFFFF", flexShrink: 1 }}>
                            {p.label}
                          </Text>
                          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                            {p.spacingFt}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Control 2: Acreage Selector — All 6 presets guaranteed on 1 single row on mobile */}
            <View style={{ gap: 5 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.7, textTransform: "uppercase", color: "rgba(255,255,255,0.72)" }}>
                  2. Land Area
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Pressable
                    onPress={() => setAcres((a) => Math.max(1, a - 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease acres"
                    style={styles.stepBtn}
                  >
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: "#FFFFFF" }}>−</Text>
                  </Pressable>
                  <Text style={{ fontFamily: fonts.display, fontSize: isPhone ? 14 : 16, color: "#E5B462", minWidth: 58, textAlign: "center" }}>
                    {acres} {acres === 1 ? "Acre" : "Acres"}
                  </Text>
                  <Pressable
                    onPress={() => setAcres((a) => Math.min(200, a + 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Increase acres"
                    style={styles.stepBtn}
                  >
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: "#FFFFFF" }}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 5 }}>
                {ACRE_OPTIONS.map((ac) => {
                  const active = acres === ac;
                  return (
                    <Pressable
                      key={ac}
                      onPress={() => setAcres(ac)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        paddingVertical: isPhone ? 6 : 7,
                        borderRadius: radius.sm,
                        borderWidth: 1,
                        borderColor: active ? "#E5B462" : "rgba(255,255,255,0.14)",
                        backgroundColor: active ? "#E5B462" : "rgba(255,255,255,0.05)",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: isPhone ? 11.5 : 12.5, color: active ? "#081E12" : "#FFFFFF" }}>
                        {ac}A
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Compact Buffer Toggle */}
            <Pressable
              onPress={() => setIncludeBuffer((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: includeBuffer }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                paddingVertical: isPhone ? 6 : 8,
                paddingHorizontal: 10,
                borderRadius: radius.md,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: isPhone ? 11.5 : 12.5, color: "rgba(255,255,255,0.9)", flexShrink: 1 }}>
                Include +10% mortality replacement buffer
              </Text>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  backgroundColor: includeBuffer ? "#52C388" : "transparent",
                  borderWidth: 1.5,
                  borderColor: includeBuffer ? "#52C388" : "rgba(255,255,255,0.4)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {includeBuffer ? <Text style={{ fontSize: 11, fontFamily: fonts.bodyBold, color: "#081E12" }}>✓</Text> : null}
              </View>
            </Pressable>

            {/* Live Output & Dispatch Card */}
            <View
              style={{
                backgroundColor: "rgba(229,180,98,0.12)",
                borderRadius: radius.lg,
                padding: isPhone ? 12 : spacing.md,
                borderWidth: 1,
                borderColor: "rgba(229,180,98,0.38)",
                gap: isPhone ? 8 : 10,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <View style={{ flexShrink: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 0.6, color: "#E5B462", textTransform: "uppercase" }}>
                    REQUIRED PLANTING STOCK
                  </Text>
                  <Text style={{ fontFamily: fonts.display, fontSize: isPhone ? 22 : 30, color: "#FFFFFF", lineHeight: isPhone ? 28 : 34 }}>
                    {formatQty(totalPlants)}{" "}
                    <Text style={{ fontSize: isPhone ? 13 : 15, fontFamily: fonts.bodySemiBold, color: "rgba(255,255,255,0.82)" }}>
                      saplings
                    </Text>
                  </Text>
                </View>

                {pricingEstimate ? (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: "#6FC28F", textTransform: "uppercase" }}>
                      EST. LOT VALUE ({formatRupees(pricingEstimate.unitRate)}/unit)
                    </Text>
                    <Text style={{ fontFamily: fonts.display, fontSize: isPhone ? 18 : 22, color: "#E5B462" }}>
                      {formatRupees(pricingEstimate.totalCost)}
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: "rgba(30,130,76,0.35)", paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: "#6FC28F" }}>
                      {totalPlants >= 2500 ? "Tier 3 Estate Slab" : totalPlants >= 500 ? "Tier 2 Orchard Slab" : "MOQ Wholesale Tier"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Dispatch Load Bar */}
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: "#FFFFFF", flexShrink: 1 }}>
                    🚚 {logistics.vehicle}
                  </Text>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: "#E5B462" }}>{logistics.modeTag}</Text>
                </View>
                <View style={{ height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
                  <View style={{ width: `${logistics.capacityPct}%`, height: "100%", backgroundColor: "#52C388", borderRadius: 3 }} />
                </View>
              </View>

              <Pressable
                onPress={handleRequestQuote}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#A54C12" : colors.cta,
                  borderRadius: radius.md,
                  paddingVertical: isPhone ? 11 : 13,
                  paddingHorizontal: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: isPhone ? 13.5 : 14.5, color: "#FFFFFF" }}>
                  {listing
                    ? `Lock Quote for ${formatQty(totalPlants)} Saplings →`
                    : `Get Bulk Quote for ${formatQty(totalPlants)} Saplings →`}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

/** Renders the 3D Isometric Terrain, Overhead Blueprint, or Row Profile in SVG. */
function IsometricOrchardScene({
  preset,
  acres,
  camera,
  compact,
  svgW,
}: {
  preset: SpacingPreset;
  acres: number;
  camera: CameraMode;
  compact: boolean;
  svgW: number;
}) {
  const svgH = compact ? 142 : 220;

  // Dynamic density boost when acres increase
  const extraCols = acres >= 25 ? 2 : acres >= 10 ? 1 : 0;
  const cols = preset.gridCols + extraCols;
  const rows = preset.gridRows + (acres >= 15 ? 1 : 0);

  if (camera === "blueprint") {
    const padX = compact ? 28 : 46;
    const padY = compact ? 16 : 26;
    const plotW = svgW - padX * 2;
    const plotH = svgH - padY * 2;
    return (
      <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        <Rect x={padX} y={padY} width={plotW} height={plotH} rx={10} fill="#103621" stroke="#E5B462" strokeWidth={1.8} />
        {/* Drip lines */}
        {Array.from({ length: rows }).map((_, r) => {
          const y = padY + ((r + 0.6) / rows) * plotH;
          return <Line key={`drip-${r}`} x1={padX + 10} y1={y} x2={padX + plotW - 10} y2={y} stroke="rgba(56,189,248,0.45)" strokeWidth={1.5} strokeDasharray="4 4" />;
        })}
        {/* Trees top-down */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const cx = padX + ((c + 0.5) / cols) * plotW;
            const cy = padY + ((r + 0.6) / rows) * plotH;
            return (
              <G key={`top-${r}-${c}`}>
                <Circle cx={cx} cy={cy} r={compact ? 7.5 : 10} fill={preset.foliageColor} opacity={0.85} />
                <Circle cx={cx} cy={cy} r={compact ? 4.5 : 6} fill={preset.crownColor} />
                <Circle cx={cx + 1.5} cy={cy - 1.5} r={1.5} fill={preset.fruitDotColor} />
              </G>
            );
          }),
        )}
        <SvgText x={svgW / 2} y={svgH - 3} fill="#E5B462" fontSize={10} fontWeight="bold" textAnchor="middle">
          TOP-DOWN BLUEPRINT · {preset.spacingFt}
        </SvgText>
      </Svg>
    );
  }

  if (camera === "elevation") {
    const groundY = svgH - (compact ? 30 : 42);
    return (
      <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Sky/Atmosphere */}
        <Rect x={12} y={10} width={svgW - 24} height={groundY - 10} rx={10} fill="rgba(18,56,36,0.55)" />
        {/* Soil Cross-Section */}
        <Rect x={12} y={groundY} width={svgW - 24} height={compact ? 18 : 28} rx={6} fill="#3E2A18" stroke="#E5B462" strokeWidth={1.2} />
        <Line x1={20} y1={groundY + 4} x2={svgW - 20} y2={groundY + 4} stroke="#38BDF8" strokeWidth={2} strokeDasharray="6 4" />
        {Array.from({ length: cols }).map((_, c) => {
          const cx = 36 + (c / Math.max(1, cols - 1)) * (svgW - 72);
          const s = compact ? 0.75 : 1;
          return (
            <G key={`elev-${c}`}>
              <Ellipse cx={cx} cy={groundY + 9 * s} rx={8 * s} ry={5 * s} fill="#6B4829" stroke="#E5B462" strokeWidth={0.8} />
              <Rect x={cx - 2 * s} y={groundY - 36 * s} width={4 * s} height={38 * s} fill="#7C5230" />
              <Circle cx={cx} cy={groundY - 44 * s} r={16 * s} fill={preset.foliageColor} />
              <Circle cx={cx - 3 * s} cy={groundY - 49 * s} r={11 * s} fill={preset.crownColor} />
              <Circle cx={cx + 4 * s} cy={groundY - 46 * s} r={2 * s} fill={preset.fruitDotColor} />
            </G>
          );
        })}
        <SvgText x={svgW / 2} y={svgH - 2} fill="#E5B462" fontSize={10} fontWeight="bold" textAnchor="middle">
          ROW ELEVATION PROFILE · {preset.spacingFt}
        </SvgText>
      </Svg>
    );
  }

  // Default: 3D Isometric Terrain Block
  const cx0 = svgW / 2;
  const topY = compact ? 14 : 24;
  const halfW = compact ? Math.min(118, svgW * 0.43) : 178;
  const halfH = compact ? 50 : 76;
  const depth = compact ? 14 : 20;

  const pTop = `${cx0},${topY}`;
  const pRight = `${cx0 + halfW},${topY + halfH}`;
  const pBottom = `${cx0},${topY + halfH * 2}`;
  const pLeft = `${cx0 - halfW},${topY + halfH}`;

  return (
    <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      {/* 3D Terrain Drop Shadow */}
      <Polygon
        points={`${cx0},${topY + 10} ${cx0 + halfW + 5},${topY + halfH + 12} ${cx0},${topY + halfH * 2 + depth + 9} ${cx0 - halfW - 5},${topY + halfH + 12}`}
        fill="rgba(0,0,0,0.42)"
      />

      {/* Left 3D Soil Crust Wall */}
      <Polygon
        points={`${pLeft} ${pBottom} ${cx0},${topY + halfH * 2 + depth} ${cx0 - halfW},${topY + halfH + depth}`}
        fill="#4A321D"
        stroke="rgba(229,180,98,0.4)"
        strokeWidth={1}
      />

      {/* Right 3D Soil Crust Wall */}
      <Polygon
        points={`${pRight} ${pBottom} ${cx0},${topY + halfH * 2 + depth} ${cx0 + halfW},${topY + halfH + depth}`}
        fill="#2F1F11"
        stroke="rgba(229,180,98,0.4)"
        strokeWidth={1}
      />

      {/* Top Isometric Plantation Turf Surface */}
      <Polygon points={`${pTop} ${pRight} ${pBottom} ${pLeft}`} fill="#143D26" stroke="#E5B462" strokeWidth={1.8} />

      {/* Isometric Irrigation Drip Lines */}
      {Array.from({ length: rows }).map((_, r) => {
        const v = (r + 0.6) / rows;
        const x1 = cx0 + (0.08 - v) * halfW;
        const y1 = topY + (0.08 + v) * halfH;
        const x2 = cx0 + (0.92 - v) * halfW;
        const y2 = topY + (0.92 + v) * halfH;
        return <Line key={`iso-drip-${r}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(56,189,248,0.45)" strokeWidth={1.3} strokeDasharray="3 3" />;
      })}

      {/* 3D Trees rendered back-to-front */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const u = (c + 0.55) / cols;
          const v = (r + 0.55) / rows;
          const x = cx0 + (u - v) * (halfW * 0.84);
          const y = topY + (u + v) * (halfH * 0.84) + (compact ? 6 : 8);
          const treeScale = compact ? 0.72 : 1;
          return (
            <G key={`iso-tree-${r}-${c}`}>
              <Ellipse cx={x + 2.5} cy={y + 1.5} rx={8 * treeScale} ry={4 * treeScale} fill="rgba(0,0,0,0.45)" />
              <Path d={`M${x - 1.5},${y} L${x - 1.1},${y - 12 * treeScale} L${x + 1.1},${y - 12 * treeScale} L${x + 1.5},${y} Z`} fill="#8B5A2B" />
              <Ellipse cx={x} cy={y - 14 * treeScale} rx={9.5 * treeScale} ry={7.5 * treeScale} fill={preset.foliageColor} />
              <Ellipse cx={x - 1.5} cy={y - 17 * treeScale} rx={6.8 * treeScale} ry={5.2 * treeScale} fill={preset.crownColor} />
              <Circle cx={x + 2.5} cy={y - 15 * treeScale} r={1.6 * treeScale} fill={preset.fruitDotColor} />
            </G>
          );
        }),
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  stepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
});
