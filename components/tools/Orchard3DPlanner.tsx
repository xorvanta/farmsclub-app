import { useState, useMemo } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Svg, { Polygon, Circle, Line, Path, Rect, Ellipse, G, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { TiltCard } from "@/components/3d/TiltCard";
import { formatRupees, formatQty } from "@/lib/format";
import type { B2bListing } from "@/lib/types";

type PresetKey = "orchard" | "high_density" | "timber" | "canopy";

type SpacingPreset = {
  key: PresetKey;
  label: string;
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
    spacingFt: "12 × 12 ft",
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
    spacingFt: "8 × 8 ft",
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
    spacingFt: "10 × 6 ft",
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
    spacingFt: "20 × 20 ft",
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

  const [presetKey, setPresetKey] = useState<PresetKey>("orchard");
  const [acres, setAcres] = useState<number>(5);
  const [includeBuffer, setIncludeBuffer] = useState<boolean>(true);
  const [camera, setCamera] = useState<CameraMode>("isometric");

  const preset = useMemo(() => PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0], [presetKey]);

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

  // Logistics load calculation
  const logistics = useMemo(() => {
    if (totalPlants <= 600) {
      return {
        vehicle: "Indian Rail Parcel / Utility Pick-up",
        capacityPct: Math.min(100, Math.round((totalPlants / 600) * 100)),
        modeTag: "RAIL / LIGHT ROAD",
      };
    }
    if (totalPlants <= 2500) {
      return {
        vehicle: "14ft Covered Nursery Truck",
        capacityPct: Math.min(100, Math.round((totalPlants / 2500) * 100)),
        modeTag: "DIRECT NURSERY TRUCK",
      };
    }
    if (totalPlants <= 6500) {
      return {
        vehicle: "17ft High-Deck Plantation Carrier",
        capacityPct: Math.min(100, Math.round((totalPlants / 6500) * 100)),
        modeTag: "HEAVY B2B CARRIER",
      };
    }
    return {
      vehicle: `${Math.ceil(totalPlants / 6000)}× Multi-Axle Trucks / Rail Bogie`,
      capacityPct: 96,
      modeTag: "BULK CONVOY / RAIL VAN",
    };
  }, [totalPlants]);

  const handleRequestQuote = () => {
    if (listing?.id) {
      router.push({
        pathname: "/rfq/[listingId]",
        params: { listingId: String(listing.id), qty: String(totalPlants) },
      });
    } else {
      const summary = `${preset.label} (${preset.spacingFt}) · ${acres} ${acres === 1 ? "Acre" : "Acres"} · ${formatQty(totalPlants)} saplings${includeBuffer ? " (incl. 10% buffer)" : ""}`;
      router.push({
        pathname: "/contact",
        params: { product: summary },
      });
    }
  };

  return (
    <View
      nativeID="mandi-3d-planner"
      style={{
        borderRadius: radius.xl,
        overflow: "hidden",
        backgroundColor: "#081E12",
        borderWidth: 1,
        borderColor: "rgba(229,180,98,0.32)",
        shadowColor: "#05140C",
        shadowOpacity: 0.24,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 14 },
        elevation: 10,
      }}
    >
      <LinearGradient
        colors={["#071A10", "#0E2E1C", "#081E12"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: isPhone ? spacing.lg : spacing.xxl }}
      >
        {/* Top Header Strip */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: spacing.md, marginBottom: spacing.xl }}>
          <View style={{ gap: 4, maxWidth: 640 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#52C388" }} />
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#E5B462" }}>
                3D ORCHARD & BULK LOAD SIMULATOR
              </Text>
            </View>
            <Text accessibilityRole="header" aria-level={2} style={{ fontFamily: fonts.display, fontSize: isPhone ? 23 : 28, lineHeight: isPhone ? 29 : 34, color: "#FFFFFF" }}>
              {listing ? `Plan your ${listing.title} plantation` : "Visualize your acreage & bulk dispatch load in 3D"}
            </Text>
          </View>

          {/* 3D Camera Angle Switcher */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255,255,255,0.07)",
              padding: 4,
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
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    backgroundColor: active ? "#E5B462" : "transparent",
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, color: active ? "#081E12" : "rgba(255,255,255,0.8)" }}>
                    {cam.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Main 2-Column Interactive Workspace */}
        <View style={{ flexDirection: wide ? "row" : "column", gap: spacing.xl, alignItems: "stretch" }}>
          {/* LEFT: 3D Interactive Isometric Visual Stage */}
          <TiltCard
            maxTilt={4.5}
            scale={1.01}
            style={{
              flex: wide ? 1.15 : undefined,
              backgroundColor: "rgba(5, 18, 11, 0.72)",
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: "rgba(229,180,98,0.24)",
              padding: spacing.md,
              justifyContent: "space-between",
              minHeight: isPhone ? 270 : 330,
            }}
          >
            {/* Top Telemetry Overlay inside 3D Viewport */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(229,180,98,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: "#E5B462" }}>
                  {preset.spacingFt} SPACING · {preset.plantsPerAcre}/ACRE
                </Text>
              </View>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11.5, color: "rgba(255,255,255,0.65)" }}>
                {preset.cropsHint}
              </Text>
            </View>

            {/* SVG 3D Stage */}
            <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 8 }}>
              <IsometricOrchardScene preset={preset} acres={acres} camera={camera} compact={isPhone} />
            </View>

            {/* Bottom Legend inside 3D Viewport */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingTop: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: preset.crownColor }} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: "rgba(255,255,255,0.78)" }}>Sapling Canopy</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <View style={{ width: 12, height: 2, backgroundColor: "#38BDF8" }} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: "rgba(255,255,255,0.78)" }}>Drip Line</Text>
                </View>
              </View>
              <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11.5, color: "#6FC28F" }}>
                Plot Scale: {acres} {acres === 1 ? "Acre" : "Acres"} ({Math.round(acres * 43560).toLocaleString("en-IN")} sq.ft)
              </Text>
            </View>
          </TiltCard>

          {/* RIGHT: Controls & Live B2B Procurement Readout */}
          <View style={{ flex: wide ? 1 : undefined, gap: spacing.md, justifyContent: "space-between" }}>
            {/* Control 1: Plantation Layout Preset */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
                1. Select Plantation Grid & Spacing
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {PRESETS.map((p) => {
                  const active = p.key === presetKey;
                  return (
                    <Pressable
                      key={p.key}
                      onPress={() => setPresetKey(p.key)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={{
                        flexGrow: 1,
                        flexBasis: "45%",
                        paddingVertical: 9,
                        paddingHorizontal: 12,
                        borderRadius: radius.md,
                        borderWidth: 1.5,
                        borderColor: active ? "#E5B462" : "rgba(255,255,255,0.14)",
                        backgroundColor: active ? "rgba(229,180,98,0.16)" : "rgba(255,255,255,0.04)",
                      }}
                    >
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: active ? "#E5B462" : "#FFFFFF" }}>
                          {p.label}
                        </Text>
                        <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                          {p.spacingFt}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Control 2: Acreage Selector */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
                  2. Land Area (Acres)
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Pressable
                    onPress={() => setAcres((a) => Math.max(1, a - 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease acres"
                    style={styles.stepBtn}
                  >
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: "#FFFFFF" }}>−</Text>
                  </Pressable>
                  <Text style={{ fontFamily: fonts.display, fontSize: 16, color: "#E5B462", minWidth: 68, textAlign: "center" }}>
                    {acres} {acres === 1 ? "Acre" : "Acres"}
                  </Text>
                  <Pressable
                    onPress={() => setAcres((a) => Math.min(200, a + 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Increase acres"
                    style={styles.stepBtn}
                  >
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: "#FFFFFF" }}>+</Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
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
                        minWidth: 48,
                        paddingVertical: 7,
                        borderRadius: radius.sm,
                        borderWidth: 1,
                        borderColor: active ? "#E5B462" : "rgba(255,255,255,0.14)",
                        backgroundColor: active ? "#E5B462" : "rgba(255,255,255,0.05)",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: active ? "#081E12" : "#FFFFFF" }}>
                        {ac}A
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Buffer Toggle */}
            <Pressable
              onPress={() => setIncludeBuffer((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: includeBuffer }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: radius.md,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12.5, color: "rgba(255,255,255,0.9)" }}>
                Include +10% commercial mortality replacement buffer
              </Text>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  backgroundColor: includeBuffer ? "#52C388" : "transparent",
                  borderWidth: 1.5,
                  borderColor: includeBuffer ? "#52C388" : "rgba(255,255,255,0.4)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {includeBuffer ? <Text style={{ fontSize: 12, fontFamily: fonts.bodyBold, color: "#081E12" }}>✓</Text> : null}
              </View>
            </Pressable>

            {/* Live Output Card */}
            <View
              style={{
                backgroundColor: "rgba(229,180,98,0.12)",
                borderRadius: radius.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: "rgba(229,180,98,0.38)",
                gap: 10,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
                <View>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 0.7, color: "#E5B462", textTransform: "uppercase" }}>
                    REQUIRED PLANTING STOCK
                  </Text>
                  <Text style={{ fontFamily: fonts.display, fontSize: isPhone ? 26 : 30, color: "#FFFFFF", lineHeight: 34 }}>
                    {formatQty(totalPlants)} <Text style={{ fontSize: 15, fontFamily: fonts.bodySemiBold, color: "rgba(255,255,255,0.8)" }}>saplings</Text>
                  </Text>
                </View>

                {pricingEstimate ? (
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: "#6FC28F", textTransform: "uppercase" }}>
                      EST. LOT VALUE ({formatRupees(pricingEstimate.unitRate)}/unit)
                    </Text>
                    <Text style={{ fontFamily: fonts.display, fontSize: 22, color: "#E5B462" }}>
                      {formatRupees(pricingEstimate.totalCost)}
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: "rgba(30,130,76,0.35)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }}>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, color: "#6FC28F" }}>
                      {totalPlants >= 2500 ? "Tier 3 Mandi Slab Unlocked" : totalPlants >= 500 ? "Tier 2 Orchard Slab Unlocked" : "MOQ Wholesale Tier"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Dispatch Load Bar */}
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: "#FFFFFF" }}>
                    🚚 {logistics.vehicle}
                  </Text>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: "#E5B462" }}>{logistics.modeTag}</Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
                  <View style={{ width: `${logistics.capacityPct}%`, height: "100%", backgroundColor: "#52C388", borderRadius: 3 }} />
                </View>
              </View>

              <Pressable
                onPress={handleRequestQuote}
                accessibilityRole="button"
                style={({ pressed }) => ({
                  backgroundColor: pressed ? "#A54C12" : colors.cta,
                  borderRadius: radius.md,
                  paddingVertical: 13,
                  paddingHorizontal: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 2,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                })}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14.5, color: "#FFFFFF" }}>
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
}: {
  preset: SpacingPreset;
  acres: number;
  camera: CameraMode;
  compact: boolean;
}) {
  const svgW = compact ? 300 : 420;
  const svgH = compact ? 185 : 220;

  // Dynamic density boost when acres increase
  const extraCols = acres >= 25 ? 2 : acres >= 10 ? 1 : 0;
  const cols = preset.gridCols + extraCols;
  const rows = preset.gridRows + (acres >= 15 ? 1 : 0);

  if (camera === "blueprint") {
    const padX = 46;
    const padY = 26;
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
                <Circle cx={cx} cy={cy} r={10} fill={preset.foliageColor} opacity={0.85} />
                <Circle cx={cx} cy={cy} r={6} fill={preset.crownColor} />
                <Circle cx={cx + 2} cy={cy - 2} r={1.8} fill={preset.fruitDotColor} />
              </G>
            );
          }),
        )}
        <SvgText x={svgW / 2} y={svgH - 6} fill="#E5B462" fontSize={11} fontWeight="bold" textAnchor="middle">
          TOP-DOWN BLUEPRINT · {preset.spacingFt} GRID
        </SvgText>
      </Svg>
    );
  }

  if (camera === "elevation") {
    const groundY = svgH - 42;
    return (
      <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
        {/* Sky/Atmosphere */}
        <Rect x={16} y={14} width={svgW - 32} height={groundY - 14} rx={10} fill="rgba(18,56,36,0.55)" />
        {/* Soil Cross-Section */}
        <Rect x={16} y={groundY} width={svgW - 32} height={28} rx={6} fill="#3E2A18" stroke="#E5B462" strokeWidth={1.2} />
        <Line x1={24} y1={groundY + 5} x2={svgW - 24} y2={groundY + 5} stroke="#38BDF8" strokeWidth={2} strokeDasharray="6 4" />
        {Array.from({ length: cols }).map((_, c) => {
          const cx = 46 + (c / Math.max(1, cols - 1)) * (svgW - 92);
          return (
            <G key={`elev-${c}`}>
              {/* Root ball in soil */}
              <Ellipse cx={cx} cy={groundY + 12} rx={8} ry={6} fill="#6B4829" stroke="#E5B462" strokeWidth={0.8} />
              {/* Trunk */}
              <Rect x={cx - 2.5} y={groundY - 38} width={5} height={40} fill="#7C5230" />
              {/* Layered 3D Canopy */}
              <Circle cx={cx} cy={groundY - 46} r={18} fill={preset.foliageColor} />
              <Circle cx={cx - 4} cy={groundY - 52} r={13} fill={preset.crownColor} />
              <Circle cx={cx + 5} cy={groundY - 48} r={2.5} fill={preset.fruitDotColor} />
              <Circle cx={cx - 6} cy={groundY - 42} r={2.2} fill={preset.fruitDotColor} />
            </G>
          );
        })}
        <SvgText x={svgW / 2} y={svgH - 4} fill="#E5B462" fontSize={11} fontWeight="bold" textAnchor="middle">
          ROW ELEVATION & ROOTSTOCK PROFILE · {preset.spacingFt}
        </SvgText>
      </Svg>
    );
  }

  // Default: 3D Isometric Terrain Block
  const cx0 = svgW / 2;
  const topY = 24;
  const halfW = compact ? 132 : 178;
  const halfH = compact ? 64 : 76;
  const depth = 20;

  const pTop = `${cx0},${topY}`;
  const pRight = `${cx0 + halfW},${topY + halfH}`;
  const pBottom = `${cx0},${topY + halfH * 2}`;
  const pLeft = `${cx0 - halfW},${topY + halfH}`;

  return (
    <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      {/* 3D Terrain Drop Shadow */}
      <Polygon
        points={`${cx0},${topY + 14} ${cx0 + halfW + 6},${topY + halfH + 16} ${cx0},${topY + halfH * 2 + depth + 12} ${cx0 - halfW - 6},${topY + halfH + 16}`}
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

      {/* 3D Trees rendered back-to-front so foreground trees overlap background trees naturally */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const u = (c + 0.55) / cols;
          const v = (r + 0.55) / rows;
          const x = cx0 + (u - v) * (halfW * 0.84);
          const y = topY + (u + v) * (halfH * 0.84) + 8;
          const treeScale = compact ? 0.82 : 1;
          return (
            <G key={`iso-tree-${r}-${c}`}>
              {/* Ground Shadow */}
              <Ellipse cx={x + 3} cy={y + 2} rx={8 * treeScale} ry={4 * treeScale} fill="rgba(0,0,0,0.45)" />
              {/* Sapling Trunk */}
              <Path d={`M${x - 1.6},${y} L${x - 1.2},${y - 12 * treeScale} L${x + 1.2},${y - 12 * treeScale} L${x + 1.6},${y} Z`} fill="#8B5A2B" />
              {/* Lower 3D Canopy Sphere */}
              <Ellipse cx={x} cy={y - 14 * treeScale} rx={9.5 * treeScale} ry={7.5 * treeScale} fill={preset.foliageColor} />
              {/* Upper Sunlit Crown */}
              <Ellipse cx={x - 1.5} cy={y - 17 * treeScale} rx={6.8 * treeScale} ry={5.2 * treeScale} fill={preset.crownColor} />
              {/* Specular Fruit / Bud Dot */}
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
});
