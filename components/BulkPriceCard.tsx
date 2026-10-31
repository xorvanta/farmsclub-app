import { useState, useMemo, useEffect } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/constants/theme-context";
import { formatRupees, formatQty } from "@/lib/format";
import { listingMoq, listingPriceLabel, listingUnit, pluralUnit, showsGst } from "@/lib/listing";
import type { B2bListing, B2bPriceTier } from "@/lib/types";

/**
 * Interactive Mandi Slab & Lot Calculator (Storefront §9.2):
 * Displays "₹78–₹90 / plant", interactive quantity band rows with price per unit, MOQ,
 * AND a live volume simulator that highlights the active price slab and computes estimated lot value.
 */
export function BulkPriceCard({
  listing,
  onSelectQuantity,
}: {
  listing: B2bListing;
  onSelectQuantity?: (qty: number) => void;
}) {
  const { colors, fonts, radius, spacing } = useTheme();
  const unit = listingUnit(listing);
  const moq = listingMoq(listing);
  const price = listingPriceLabel(listing);
  const tiers = listing.tiers ?? [];
  const gst = showsGst(listing);

  const sortedTiers = useMemo(() => [...tiers].sort((a, b) => Number(a.minQty) - Number(b.minQty)), [tiers]);
  const defaultQty = useMemo(() => {
    if (moq != null && Number(moq) > 0) return Number(moq);
    if (sortedTiers.length > 0) return Number(sortedTiers[0].minQty);
    return 100;
  }, [moq, sortedTiers]);

  const [simQtyText, setSimQtyText] = useState(String(defaultQty));
  useEffect(() => {
    setSimQtyText(String(defaultQty));
  }, [defaultQty]);

  const simQty = Math.max(1, Number(simQtyText.replace(/\D/g, "")) || defaultQty);

  const setQty = (next: number) => {
    const clean = Math.max(moq ? Number(moq) : 1, Math.round(next));
    setSimQtyText(String(clean));
    onSelectQuantity?.(clean);
  };

  // Determine which tier is unlocked by simQty
  const activeTierIndex = useMemo(() => {
    if (sortedTiers.length === 0) return -1;
    let idx = 0;
    for (let i = 0; i < sortedTiers.length; i++) {
      if (simQty >= Number(sortedTiers[i].minQty)) idx = i;
    }
    return idx;
  }, [sortedTiers, simQty]);

  const activeUnitPrice = useMemo(() => {
    if (activeTierIndex >= 0 && sortedTiers[activeTierIndex]) {
      return Number(sortedTiers[activeTierIndex].pricePerUnit);
    }
    if (listing.price_from != null) return Number(listing.price_from);
    return null;
  }, [activeTierIndex, sortedTiers, listing.price_from]);

  const baseUnitPrice = useMemo(() => {
    if (sortedTiers.length > 0) return Number(sortedTiers[0].pricePerUnit);
    if (listing.price_to != null) return Number(listing.price_to);
    return activeUnitPrice;
  }, [sortedTiers, listing.price_to, activeUnitPrice]);

  const estTotal = activeUnitPrice != null ? activeUnitPrice * simQty : null;
  const estSavings = activeUnitPrice != null && baseUnitPrice != null ? Math.max(0, (baseUnitPrice - activeUnitPrice) * simQty) : 0;

  // Quick preset buttons derived from tiers or standard multipliers
  const presetQuantities = useMemo(() => {
    if (sortedTiers.length > 0) {
      const fromTiers = sortedTiers.map((t) => Number(t.minQty));
      const highest = fromTiers[fromTiers.length - 1];
      return [...new Set([...fromTiers, highest * 2])].slice(0, 4);
    }
    const base = defaultQty;
    return [base, base * 5, base * 10, base * 25];
  }, [sortedTiers, defaultQty]);

  const qtyLabel = (t: B2bPriceTier) => {
    const u = pluralUnit(unit, 2);
    return t.maxQty == null
      ? `${formatQty(Number(t.minQty))}+${u ? ` ${u}` : ""}`
      : `${formatQty(Number(t.minQty))}–${formatQty(Number(t.maxQty))}${u ? ` ${u}` : ""}`;
  };

  const headStyle = { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.7, color: "#E5B462" };

  return (
    <LinearGradient
      colors={["#092214", "#123824", "#0C291A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: radius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: "rgba(229,180,98,0.35)",
        shadowColor: "#081E12",
        shadowOpacity: 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 5,
      }}
    >
      {/* Header Row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#52C388" }} />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#E5B462" }}>
            MANDI WHOLESALE SLABS
          </Text>
        </View>
        {moq != null ? (
          <View style={{ backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11.5, color: "#FFFFFF" }}>
              MOQ: {formatQty(Number(moq))} {unit ? pluralUnit(unit, Number(moq)) : ""}
            </Text>
          </View>
        ) : null}
      </View>

      {price && (
        <Text style={{ fontFamily: fonts.display, fontSize: 30, color: "#FFFFFF", marginTop: 8 }}>
          {price}
          {gst ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: "rgba(255,255,255,0.85)" }}> + GST</Text> : null}
        </Text>
      )}

      {/* Interactive Tier Table */}
      {sortedTiers.length > 0 && (
        <View
          style={{
            marginTop: spacing.md,
            borderRadius: radius.md,
            overflow: "hidden",
            backgroundColor: "rgba(0,0,0,0.24)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.14)",
          }}
        >
          <View style={[styles.row, { paddingHorizontal: spacing.md, backgroundColor: "rgba(255,255,255,0.1)" }]}>
            <Text style={[styles.cell, headStyle]}>VOLUME SLAB (TAP TO SELECT)</Text>
            <Text style={[styles.cell, styles.right, headStyle]}>RATE / {unit ? unit.toUpperCase() : "UNIT"}</Text>
          </View>
          {sortedTiers.map((t, i) => {
            const isUnlocked = i === activeTierIndex;
            return (
              <Pressable
                key={`${t.minQty}-${i}`}
                onPress={() => setQty(Number(t.minQty))}
                accessibilityRole="button"
                accessibilityLabel={`Select quantity slab ${qtyLabel(t)} at ${formatRupees(Number(t.pricePerUnit))}`}
                style={[
                  styles.row,
                  {
                    paddingHorizontal: spacing.md,
                    backgroundColor: isUnlocked ? "rgba(229,180,98,0.18)" : "transparent",
                    borderLeftWidth: isUnlocked ? 3 : 0,
                    borderLeftColor: "#E5B462",
                  },
                  i > 0 && { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
                ]}
              >
                <View style={[styles.cell, { flexDirection: "row", alignItems: "center", gap: 6 }]}>
                  <Text style={{ fontFamily: isUnlocked ? fonts.bodyBold : fonts.bodyMedium, fontSize: 14, color: isUnlocked ? "#E5B462" : "#FFFFFF" }}>
                    {qtyLabel(t)}
                  </Text>
                  {isUnlocked ? (
                    <View style={{ backgroundColor: "#E5B462", paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill }}>
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 9.5, color: "#081E12" }}>ACTIVE</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.cell, styles.right, { fontFamily: fonts.bodyBold, fontSize: 15.5, color: isUnlocked ? "#E5B462" : "#FFFFFF" }]}>
                  {formatRupees(Number(t.pricePerUnit))}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Interactive Lot Value Simulator */}
      {activeUnitPrice != null ? (
        <View
          style={{
            marginTop: spacing.md,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: "rgba(255,255,255,0.07)",
            borderWidth: 1,
            borderColor: "rgba(229,180,98,0.26)",
            gap: 10,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,0.8)" }}>
              SIMULATE YOUR BULK ORDER QUANTITY:
            </Text>
            {estSavings > 0 ? (
              <View style={{ backgroundColor: "rgba(82,195,136,0.22)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill }}>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: "#6FC28F" }}>
                  Slab Savings: {formatRupees(estSavings)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Quick Quantity Chips */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {presetQuantities.map((pq) => {
              const selected = simQty === pq;
              return (
                <Pressable
                  key={pq}
                  onPress={() => setQty(pq)}
                  style={{
                    paddingHorizontal: 11,
                    paddingVertical: 6,
                    borderRadius: radius.pill,
                    backgroundColor: selected ? "#E5B462" : "rgba(255,255,255,0.1)",
                    borderWidth: 1,
                    borderColor: selected ? "#E5B462" : "rgba(255,255,255,0.18)",
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: selected ? "#081E12" : "#FFFFFF" }}>
                    {formatQty(pq)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom Quantity Input + Live Estimate */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", paddingTop: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Pressable
                onPress={() => setQty(simQty - (defaultQty >= 100 ? 50 : 10))}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
                style={styles.stepBtn}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: fonts.bodyBold, fontSize: 16 }}>−</Text>
              </Pressable>
              <TextInput
                value={simQtyText}
                onChangeText={(v) => {
                  const clean = v.replace(/\D/g, "");
                  setSimQtyText(clean);
                  if (clean && Number(clean) > 0) onSelectQuantity?.(Number(clean));
                }}
                keyboardType="number-pad"
                inputMode="numeric"
                maxLength={7}
                accessibilityLabel="Simulated order quantity"
                style={{
                  minWidth: 84,
                  height: 36,
                  borderRadius: radius.sm,
                  backgroundColor: "rgba(0,0,0,0.35)",
                  borderWidth: 1,
                  borderColor: "rgba(229,180,98,0.45)",
                  color: "#FFFFFF",
                  fontFamily: fonts.bodyBold,
                  fontSize: 14,
                  textAlign: "center",
                  paddingHorizontal: 8,
                }}
              />
              <Pressable
                onPress={() => setQty(simQty + (defaultQty >= 100 ? 50 : 10))}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
                style={styles.stepBtn}
              >
                <Text style={{ color: "#FFFFFF", fontFamily: fonts.bodyBold, fontSize: 16 }}>+</Text>
              </Pressable>
            </View>

            {estTotal != null ? (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
                  Est. Lot Total ({formatRupees(activeUnitPrice)}/{unit ?? "unit"})
                </Text>
                <Text style={{ fontFamily: fonts.display, fontSize: 22, color: "#E5B462" }}>
                  {formatRupees(estTotal)}
                  {gst ? <Text style={{ fontSize: 11, fontFamily: fonts.body, color: "rgba(255,255,255,0.7)" }}> + GST</Text> : null}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {moq != null && (
        <View style={[styles.moqRow, { borderTopColor: "rgba(255,255,255,0.14)", marginTop: spacing.md, paddingTop: spacing.sm }]}>
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.82)" }}>Minimum order (MOQ)</Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14.5, color: "#FFFFFF" }}>
            {formatQty(Number(moq))}
            {unit ? ` ${pluralUnit(unit, Number(moq))}` : ""}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 11, gap: 12 },
  cell: { flex: 1 },
  right: { textAlign: "right" },
  moqRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
});
