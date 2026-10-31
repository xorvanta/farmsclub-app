import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Platform, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Svg, { Path, Circle, Rect, Polygon, Line } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";
import { useTour } from "@/lib/tour-context";
import { useChat } from "@/lib/chat-context";

type TourStep = {
  id: string;
  badge: string;
  title: string;
  caption: string;
  metrics: { label: string; value: string }[];
  actionLabel: string;
};

const STEPS: TourStep[] = [
  {
    id: "slabs",
    badge: "STEP 1 OF 4 · WHOLESALE QUANTITY SLABS",
    title: "Volume unlocks tiered wholesale pricing",
    caption: "Every bulk lot on FarmsClub shows transparent tier slabs. Higher volume automatically drops your per-sapling rate.",
    metrics: [
      { label: "Tier Pricing", value: "100% Transparent" },
      { label: "Order Size", value: "MOQ to 50,000+" },
      { label: "Middlemen", value: "Zero Hidden" },
    ],
    actionLabel: "Explore Bulk Supply →",
  },
  {
    id: "planner3d",
    badge: "STEP 2 OF 4 · 3D ACREAGE SIMULATOR",
    title: "Visualize your orchard in 3D before ordering",
    caption: "Select your acreage and plant spacing to see a 3D plantation grid, exact sapling count, and truck/rail load size.",
    metrics: [
      { label: "3D Plot View", value: "Interactive Grid" },
      { label: "Spacing Presets", value: "6×6 to 20×20 ft" },
      { label: "Load Sizing", value: "Rail & Truck" },
    ],
    actionLabel: "Try 3D Orchard Planner →",
  },
  {
    id: "farms",
    badge: "STEP 3 OF 4 · VERIFIED FARM NETWORK",
    title: "Real farms filmed on the ground by our team",
    caption: "Inspect mother-plant stock, soil type, harvest calendar, and on-ground documentary films before you source.",
    metrics: [
      { label: "Verification", value: "On-Site Filmed" },
      { label: "Credentials", value: "Soil & Mother Stock" },
      { label: "Direct Connect", value: "WhatsApp / Enquiry" },
    ],
    actionLabel: "Browse Verified Farms →",
  },
  {
    id: "dispatch",
    badge: "STEP 4 OF 4 · SINGLE-DESK DISPATCH & AI",
    title: "One point of contact from quote to railway/truck dispatch",
    caption: "Submit one RFQ or ask Trellis AI. Our trade desk confirms live batch availability and arranges road or rail transit.",
    metrics: [
      { label: "Transit Modes", value: "Road & Indian Rail" },
      { label: "Concierge", value: "Trellis AI + Desk" },
      { label: "Turnaround", value: "Priority Quote" },
    ],
    actionLabel: "Ask Trellis Assistant →",
  },
];

export function TourGuide() {
  const { colors, fonts, radius, spacing } = useTheme();
  const { isOpen, step, showHintPill, openTour, closeTour, dismissHintPill, setStep } = useTour();
  const { openChat } = useChat();
  const { width } = useWindowDimensions();
  const compact = width < 640;

  // Interactive demo state inside Step 0 (Quantity Slab Preview)
  const [demoTier, setDemoTier] = useState<0 | 1 | 2>(1);
  // Interactive demo state inside Step 1 (3D Grid Density Preview)
  const [demoAcres, setDemoAcres] = useState<5 | 15 | 30>(15);

  useEffect(() => {
    if (!isOpen || Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTour();
      if (e.key === "ArrowRight") setStep(Math.min(STEPS.length - 1, step + 1));
      if (e.key === "ArrowLeft") setStep(Math.max(0, step - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, step, closeTour, setStep]);

  const handleStepAction = () => {
    const current = STEPS[step];
    closeTour();
    if (current.id === "slabs") {
      router.push("/listings");
    } else if (current.id === "planner3d") {
      if (Platform.OS === "web" && typeof document !== "undefined") {
        const el = document.getElementById("orchard-3d-planner");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }
      router.push("/");
    } else if (current.id === "farms") {
      router.push("/farms");
    } else if (current.id === "dispatch") {
      openChat();
    }
  };

  return (
    <>
      {/* Subtle floating tour launcher pill for first-time visitors */}
      {showHintPill && !isOpen ? (
        <View
          style={[
            styles.hintFloating,
            {
              bottom: compact ? 74 : 24,
              left: compact ? 12 : 24,
              right: compact ? 12 : undefined,
            },
          ]}
        >
          <LinearGradient
            colors={["#081E12", "#123824"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingVertical: 10,
              paddingLeft: 14,
              paddingRight: 10,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: "rgba(229,180,98,0.45)",
              shadowColor: "#000",
              shadowOpacity: 0.32,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            }}
          >
            <Pressable
              onPress={() => openTour(0)}
              accessibilityRole="button"
              accessibilityLabel="Take the 30-second interactive platform tour"
              style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: compact ? 1 : undefined }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(229,180,98,0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#E5B462" strokeWidth={2.2}>
                  <Circle cx={12} cy={12} r={10} />
                  <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#E5B462" />
                </Svg>
              </View>
              <View>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: "#FFFFFF" }}>
                  New to FarmsClub B2B?
                </Text>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: "#E5B462" }}>
                  Take 30s Interactive Tour →
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={dismissHintPill}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Dismiss tour prompt"
              style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, fontFamily: fonts.bodyBold }}>×</Text>
            </Pressable>
          </LinearGradient>
        </View>
      ) : null}

      {/* Full Interactive Modal */}
      {isOpen ? (
        <View style={styles.backdrop} accessibilityViewIsModal aria-label="FarmsClub Interactive Platform Tour">
          <Pressable style={StyleSheet.absoluteFill} onPress={closeTour} accessibilityLabel="Close tour backdrop" />

          <View
            style={[
              styles.modalCard,
              {
                width: compact ? "94%" : 680,
                maxHeight: compact ? "90%" : "88%",
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                borderColor: "rgba(229,180,98,0.4)",
              },
            ]}
          >
            {/* Top Dark Visual Stage */}
            <LinearGradient
              colors={["#071A10", "#123824", "#184A30"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: compact ? spacing.lg : spacing.xl, position: "relative" }}
            >
              {/* Step progress bar + Close */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: spacing.md }}>
                <View style={{ flexDirection: "row", gap: 6, flex: 1, maxWidth: 240 }}>
                  {STEPS.map((s, idx) => (
                    <Pressable
                      key={s.id}
                      onPress={() => setStep(idx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Go to tour step ${idx + 1}`}
                      style={{
                        flex: 1,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: idx === step ? "#E5B462" : idx < step ? "rgba(229,180,98,0.5)" : "rgba(255,255,255,0.2)",
                      }}
                    />
                  ))}
                </View>
                <Pressable
                  onPress={closeTour}
                  accessibilityRole="button"
                  accessibilityLabel="Close tour"
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: radius.pill,
                    backgroundColor: "rgba(255,255,255,0.12)",
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: "#FFFFFF" }}>Skip ✕</Text>
                </Pressable>
              </View>

              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.1, color: "#E5B462", marginBottom: 4 }}>
                {STEPS[step].badge}
              </Text>
              <Text style={{ fontFamily: fonts.display, fontSize: compact ? 21 : 25, lineHeight: compact ? 27 : 31, color: "#FFFFFF" }}>
                {STEPS[step].title}
              </Text>

              {/* Interactive Visual Scene for each step */}
              <View
                style={{
                  marginTop: spacing.md,
                  backgroundColor: "rgba(8,30,18,0.65)",
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: "rgba(229,180,98,0.25)",
                  padding: spacing.md,
                }}
              >
                {step === 0 ? (
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                        TAP VOLUME SLAB TO PREVIEW RATE DROP:
                      </Text>
                      <View style={{ backgroundColor: "rgba(30,130,76,0.35)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill }}>
                        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: "#6FC28F" }}>
                          {demoTier === 0 ? "Base MOQ Rate" : demoTier === 1 ? "Save 14% / plant" : "Save 26% / plant"}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {[
                        { qty: "100–499", rate: "₹85", tag: "Starter Lot" },
                        { qty: "500–2,499", rate: "₹73", tag: "Orchard Slab" },
                        { qty: "2,500+", rate: "₹63", tag: "Estate Bulk" },
                      ].map((slab, i) => {
                        const active = demoTier === i;
                        return (
                          <Pressable
                            key={slab.qty}
                            onPress={() => setDemoTier(i as 0 | 1 | 2)}
                            style={{
                              flex: 1,
                              padding: 10,
                              borderRadius: radius.md,
                              borderWidth: 1.5,
                              borderColor: active ? "#E5B462" : "rgba(255,255,255,0.14)",
                              backgroundColor: active ? "rgba(229,180,98,0.16)" : "rgba(255,255,255,0.04)",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 10.5, color: active ? "#E5B462" : "rgba(255,255,255,0.6)" }}>
                              {slab.tag}
                            </Text>
                            <Text style={{ fontFamily: fonts.display, fontSize: compact ? 18 : 22, color: "#FFFFFF" }}>{slab.rate}</Text>
                            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{slab.qty} plants</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                ) : null}

                {step === 1 ? (
                  <View style={{ gap: 10 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
                        3D ISOMETRIC PLOT PREVIEW:
                      </Text>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        {([5, 15, 30] as const).map((ac) => (
                          <Pressable
                            key={ac}
                            onPress={() => setDemoAcres(ac)}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: radius.pill,
                              backgroundColor: demoAcres === ac ? "#E5B462" : "rgba(255,255,255,0.12)",
                            }}
                          >
                            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: demoAcres === ac ? "#081E12" : "#FFFFFF" }}>
                              {ac} Acres
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <Svg width={compact ? 120 : 150} height={84} viewBox="0 0 160 90">
                        <Polygon points="80,8 152,42 80,76 8,42" fill="#184A30" stroke="#E5B462" strokeWidth={1.5} />
                        <Polygon points="8,42 80,76 80,86 8,52" fill="#0D2B1B" />
                        <Polygon points="152,42 80,76 80,86 152,52" fill="#081E12" />
                        {[0, 1, 2].map((r) =>
                          [0, 1, 2, 3].map((c) => {
                            const cx = 80 + (c - r) * 18;
                            const cy = 24 + (c + r) * 8;
                            return (
                              <Circle
                                key={`${r}-${c}`}
                                cx={cx}
                                cy={cy}
                                r={demoAcres === 30 ? 5.5 : demoAcres === 15 ? 4.5 : 3.5}
                                fill="#6FC28F"
                                stroke="#081E12"
                                strokeWidth={1}
                              />
                            );
                          }),
                        )}
                      </Svg>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ fontFamily: fonts.display, fontSize: 20, color: "#E5B462" }}>
                          {(demoAcres * 302).toLocaleString("en-IN")} Saplings
                        </Text>
                        <Text style={{ fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,0.85)" }}>
                          12×12 ft Orchard Grid · {demoAcres >= 15 ? "17ft Dedicated Nursery Carrier" : "14ft Consignment Truck"}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}

                {step === 2 ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    {[
                      { badge: "✓ VERIFIED", title: "On-Site Team Shoot", sub: "Real video & drone footage" },
                      { badge: "MOTHER STOCK", title: "Rootstock & Soil", sub: "Age, bag size & variety logged" },
                      { badge: "CALENDAR", title: "12-Month Harvest", sub: "Visual crop season matrix" },
                    ].map((card) => (
                      <View
                        key={card.title}
                        style={{
                          flex: 1,
                          minWidth: 140,
                          backgroundColor: "rgba(255,255,255,0.06)",
                          borderRadius: radius.md,
                          padding: 10,
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.12)",
                          gap: 3,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: "#6FC28F", letterSpacing: 0.6 }}>{card.badge}</Text>
                        <Text style={{ fontFamily: fonts.heading, fontSize: 13.5, color: "#FFFFFF" }}>{card.title}</Text>
                        <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: "rgba(255,255,255,0.72)" }}>{card.sub}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {step === 3 ? (
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    {[
                      { stepNum: "01", label: "Select Lot & Qty", sub: "Pick tier or 3D plan" },
                      { stepNum: "02", label: "FarmsClub Desk", sub: "Confirms live batch" },
                      { stepNum: "03", label: "Rail / Road Transit", sub: "Nearest station or farm" },
                    ].map((node, idx) => (
                      <View
                        key={node.stepNum}
                        style={{
                          flex: 1,
                          backgroundColor: idx === 2 ? "rgba(229,180,98,0.16)" : "rgba(255,255,255,0.06)",
                          borderRadius: radius.md,
                          padding: 10,
                          borderWidth: 1,
                          borderColor: idx === 2 ? "#E5B462" : "rgba(255,255,255,0.12)",
                          gap: 2,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: "#E5B462" }}>{node.stepNum}</Text>
                        <Text style={{ fontFamily: fonts.heading, fontSize: 13, color: "#FFFFFF" }}>{node.label}</Text>
                        <Text style={{ fontFamily: fonts.body, fontSize: 11, color: "rgba(255,255,255,0.72)" }}>{node.sub}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            </LinearGradient>

            {/* Bottom Content & Controls */}
            <ScrollView contentContainerStyle={{ padding: compact ? spacing.lg : spacing.xl, gap: spacing.md }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21, color: colors.inkSoft }}>
                {STEPS[step].caption}
              </Text>

              {/* 3 Visual Metric Pills */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                {STEPS[step].metrics.map((m) => (
                  <View
                    key={m.label}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      backgroundColor: colors.paper,
                      borderRadius: radius.md,
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.inkFaint, textTransform: "uppercase" }}>
                      {m.label}
                    </Text>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.brand, marginTop: 2 }}>
                      {m.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Navigation Footer */}
              <View
                style={{
                  flexDirection: compact ? "column" : "row",
                  alignItems: compact ? "stretch" : "center",
                  justifyContent: "space-between",
                  gap: spacing.sm,
                  marginTop: spacing.xs,
                  paddingTop: spacing.md,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                }}
              >
                <Pressable
                  onPress={handleStepAction}
                  accessibilityRole="button"
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: radius.md,
                    backgroundColor: colors.brandSoft,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.brand }}>{STEPS[step].actionLabel}</Text>
                </Pressable>

                <View style={{ flexDirection: "row", gap: spacing.sm, justifyContent: "flex-end" }}>
                  {step > 0 ? (
                    <Pressable
                      onPress={() => setStep(step - 1)}
                      accessibilityRole="button"
                      style={{
                        paddingVertical: 11,
                        paddingHorizontal: 18,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: colors.borderStrong,
                        backgroundColor: colors.surface,
                      }}
                    >
                      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink }}>← Back</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() => (step < STEPS.length - 1 ? setStep(step + 1) : closeTour())}
                    accessibilityRole="button"
                    style={{
                      paddingVertical: 11,
                      paddingHorizontal: 22,
                      borderRadius: radius.md,
                      backgroundColor: colors.cta,
                      flex: compact ? 1 : undefined,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: "#FFFFFF" }}>
                      {step < STEPS.length - 1 ? "Next Step →" : "Finish Tour ✓"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  hintFloating: {
    position: "absolute",
    zIndex: 45,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(6, 20, 12, 0.76)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
  },
  modalCard: {
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
});
