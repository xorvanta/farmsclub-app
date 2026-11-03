import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient as SvgGrad,
  Path,
  RadialGradient as SvgRadial,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { useTheme } from "@/constants/theme-context";

/**
 * 4D Particle: X, Y, Z (spatial depth), Velocity, Life, Phase & Size.
 * (4th dimension = Time / Life evolution).
 */
type Sparkle4D = {
  id: number;
  x: number;
  y: number;
  z: number; // 0 (near) to 1 (far)
  vx: number;
  vy: number;
  size: number;
  hue: string;
  life: number;
  maxLife: number;
  twinklePhase: number;
};

/**
 * Interactive 4D Diwali Festive Showcase:
 * - 3D spatial perspective (depth, tilting, layering of traditional brass & clay diyas).
 * - 4th dimension: Temporal animation (organic flame flicker, drifting phuljhadi sparkles, breathing aura).
 * - Interactive pointer tilt / touch gyro reaction & sparkle burst.
 * - Crisp, responsive layout on mobile & desktop without text clipping.
 */
export function DiwaliBanner4D() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 960;
  const compact = width < 560;

  // 4D Interactive Canvas State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [tick, setTick] = useState(0);
  const [burstCount, setBurstCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const particlesRef = useRef<Sparkle4D[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Initialize sparkles
  useEffect(() => {
    const initial: Sparkle4D[] = [];
    for (let i = 0; i < 28; i++) {
      initial.push({
        id: i,
        x: (Math.random() - 0.5) * 220,
        y: Math.random() * 120 - 40,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.45,
        vy: -0.4 - Math.random() * 0.85,
        size: 1.5 + Math.random() * 3.5,
        hue: i % 3 === 0 ? "#FFE58F" : i % 3 === 1 ? "#FFA940" : "#FFFFFF",
        life: Math.random() * 100,
        maxLife: 80 + Math.random() * 80,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = initial;
  }, []);

  // 4D Temporal Loop (Time dimension)
  useEffect(() => {
    let lastTime = Date.now();
    let mounted = true;

    const loop = () => {
      if (!mounted) return;
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setTick((t) => (t + dt * 2.8) % 1000);

      // Update particle physics along 3D space & time
      particlesRef.current.forEach((p) => {
        p.x += p.vx * (1 + (1 - p.z) * 0.5);
        p.y += p.vy;
        p.life += 1;
        if (p.life >= p.maxLife || p.y < -120) {
          p.x = (Math.random() - 0.5) * 160;
          p.y = 50 + Math.random() * 30;
          p.life = 0;
          p.vy = -0.45 - Math.random() * 0.8;
        }
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Parallax pointer tracking
  const handlePointerMove = useCallback((e: any) => {
    if (Platform.OS !== "web") return;
    const rect = e.currentTarget?.getBoundingClientRect?.();
    if (!rect) return;
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: Math.max(-1, Math.min(1, normX * 2)),
      y: Math.max(-1, Math.min(1, normY * 2)),
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  }, []);

  // Trigger celebratory burst on tap/click
  const triggerBurst = () => {
    setBurstCount((c) => c + 1);
    particlesRef.current.forEach((p) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.5;
      p.x = (Math.random() - 0.5) * 40;
      p.y = 10 + (Math.random() - 0.5) * 20;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 1;
      p.life = 0;
    });
  };

  // Organic flame flickering computed values
  const flameWobble = Math.sin(tick * 3.2) * 2.2 + Math.cos(tick * 5.7) * 1.4;
  const flameHeightScale = 1 + Math.sin(tick * 4.1) * 0.08;
  const auraGlowRadius = 65 + Math.sin(tick * 2.5) * 12;

  // 3D Parallax offset
  const px = tilt.x * 12;
  const py = tilt.y * 8;

  return (
    <View style={{ width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg, marginVertical: spacing.xl }}>
      <LinearGradient
        colors={["#160802", "#2B1104", "#0D2214"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: radius.xl,
          borderWidth: 1.5,
          borderColor: "rgba(245,184,65,0.45)",
          overflow: "hidden",
          position: "relative",
          shadowColor: "#F5B841",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.18,
          shadowRadius: 28,
          elevation: 6,
        }}
      >
        {/* Festive Golden Border Accents (Traditional Indian Toran & Rangoli Motif) */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: "#F5B841",
            opacity: 0.85,
          }}
        />

        <View
          style={{
            flexDirection: wide ? "row" : "column-reverse",
            alignItems: wide ? "center" : "stretch",
            justifyContent: "space-between",
            padding: compact ? 18 : wide ? 36 : 28,
            gap: compact ? 20 : 32,
          }}
        >
          {/* Left: Festive Content & Auspicious Offers */}
          <View style={{ flex: 1.2, minWidth: 0, gap: spacing.md }}>
            {/* Auspicious Eyebrow Badge */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: "rgba(245,184,65,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(245,184,65,0.55)",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                }}
              >
                <Text style={{ fontSize: 13 }}>🪔</Text>
                <Text style={{ fontFamily: fonts.devanagari ?? fonts.bodyBold, fontSize: 12, color: "#FFE066", letterSpacing: 0.5 }}>
                  शुभ दीपावली
                </Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10.5, color: "#F5B841", letterSpacing: 0.8 }}>
                  · SHUBH DEEPAVALI
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "rgba(82,195,136,0.16)",
                  borderWidth: 1,
                  borderColor: "rgba(82,195,136,0.45)",
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                  borderRadius: radius.pill,
                }}
              >
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: "#6FC28F", letterSpacing: 0.6 }}>
                  FESTIVE PLANTING SEASON
                </Text>
              </View>
            </View>

            {/* Inspiring Headline */}
            <Text
              style={{
                fontFamily: fonts.display,
                fontSize: compact ? 24 : wide ? 36 : 28,
                lineHeight: compact ? 30 : wide ? 42 : 34,
                color: "#FFFFFF",
                letterSpacing: -0.3,
              }}
            >
              Lighting up India's orchards with verified bulk planting material.
            </Text>

            {/* Narrative Subtitle */}
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: compact ? 13.5 : 15,
                lineHeight: compact ? 20 : 23,
                color: "rgba(255,255,255,0.86)",
                maxWidth: 620,
              }}
            >
              Celebrate Diwali and the harvest sowing season with certified nursery mother stock, premium plant saplings, and complete
              orchard setup materials. Benefit from festive volume pricing and express road/rail dispatch across India.
            </Text>

            {/* 3 Festive Perks Cards */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
              {[
                { icon: "🪔", title: "Festive Volume Tiers", desc: "Transparent volume slabs on 500+ sapling lots" },
                { icon: "🚂", title: "Express Freight Desk", desc: "Fast-track Indian Railways & road truck dispatch" },
                { icon: "🌱", title: "Verified Mother Stock", desc: "True-to-type, certified farm nursery stock" },
              ].map((perk) => (
                <View
                  key={perk.title}
                  style={{
                    flexGrow: 1,
                    flexBasis: compact ? "100%" : 170,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderRadius: radius.md,
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: "rgba(245,184,65,0.22)",
                    gap: 3,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 13 }}>{perk.icon}</Text>
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: "#F5B841" }}>{perk.title}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.body, fontSize: 11, color: "rgba(255,255,255,0.78)", lineHeight: 15 }}>
                    {perk.desc}
                  </Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, marginTop: 6 }}>
              <Link href="/listings" asChild>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Explore festive bulk supply"
                  style={({ pressed }) => ({
                    paddingHorizontal: 22,
                    paddingVertical: 12,
                    borderRadius: radius.md,
                    backgroundColor: pressed ? "#8E3B09" : "#C85A17",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    shadowColor: "#C85A17",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    elevation: 4,
                  })}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: "#FFFFFF" }}>Explore Bulk Supply →</Text>
                </Pressable>
              </Link>

              <Link href="/contact" asChild>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Request festive quote"
                  style={({ pressed }) => ({
                    paddingHorizontal: 18,
                    paddingVertical: 11,
                    borderRadius: radius.md,
                    backgroundColor: pressed ? "rgba(245,184,65,0.25)" : "rgba(245,184,65,0.12)",
                    borderWidth: 1,
                    borderColor: "rgba(245,184,65,0.45)",
                  })}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13.5, color: "#F5B841" }}>Request Festive Quote</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {/* Right: 4D Interactive 3D Diya & Particle Stage */}
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              minHeight: compact ? 240 : 310,
              position: "relative",
            }}
            {...(Platform.OS === "web"
              ? {
                  onPointerMove: handlePointerMove,
                  onPointerEnter: () => setIsHovered(true),
                  onPointerLeave: handlePointerLeave,
                }
              : {})}
          >
            {/* Interactive 4D Stage Container */}
            <Pressable
              onPress={triggerBurst}
              accessibilityRole="button"
              accessibilityLabel="Interactive 4D Diya. Tap to release celebratory golden sparkles."
              style={{
                width: compact ? 260 : 340,
                height: compact ? 220 : 280,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Svg width={compact ? 260 : 340} height={compact ? 220 : 280} viewBox="0 0 340 280">
                <Defs>
                  {/* Radial Diya Glow */}
                  <SvgRadial id="festiveAura" cx="50%" cy="52%" r="50%">
                    <Stop offset="0%" stopColor="#FFA940" stopOpacity="0.45" />
                    <Stop offset="45%" stopColor="#D46B08" stopOpacity="0.22" />
                    <Stop offset="100%" stopColor="#160802" stopOpacity="0" />
                  </SvgRadial>

                  {/* Flame Core Glow */}
                  <SvgRadial id="flameInnerGlow" cx="50%" cy="60%" r="50%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <Stop offset="30%" stopColor="#FFF566" stopOpacity="0.95" />
                    <Stop offset="70%" stopColor="#FF7A45" stopOpacity="0.8" />
                    <Stop offset="100%" stopColor="#CF1322" stopOpacity="0" />
                  </SvgRadial>

                  {/* Brass Plate Gradient */}
                  <SvgGrad id="brassThali" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFE58F" />
                    <Stop offset="35%" stopColor="#D48806" />
                    <Stop offset="70%" stopColor="#874D00" />
                    <Stop offset="100%" stopColor="#D48806" />
                  </SvgGrad>

                  {/* Clay Diya Gradient */}
                  <SvgGrad id="clayDiya" x1="0%" y1="0%" x2="100%" y2="80%">
                    <Stop offset="0%" stopColor="#D46B08" />
                    <Stop offset="40%" stopColor="#A53A04" />
                    <Stop offset="100%" stopColor="#612502" />
                  </SvgGrad>

                  {/* Glistening Oil Level Gradient */}
                  <SvgGrad id="gheeGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#FFF566" stopOpacity="0.9" />
                    <Stop offset="100%" stopColor="#D48806" stopOpacity="0.75" />
                  </SvgGrad>
                </Defs>

                {/* Layer 1: Ambient 4D Aura (Expands & contracts with tick) */}
                <Circle cx={170 + px * 0.3} cy={145 + py * 0.3} r={auraGlowRadius} fill="url(#festiveAura)" />

                {/* Layer 2: 3D Rangoli Petal Platform (Backdrop with Parallax) */}
                <G transform={`translate(${px * 0.5}, ${py * 0.5})`}>
                  {/* Outer Concentric Brass Thali */}
                  <Ellipse cx={170} cy={175} rx={128} ry={46} fill="none" stroke="#D48806" strokeWidth={1.5} strokeDasharray="3 5" opacity={0.6} />
                  <Ellipse cx={170} cy={175} rx={118} ry={42} fill="url(#brassThali)" opacity={0.35} />

                  {/* Auspicious Marigold Petal Accents */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                    const rad = (deg * Math.PI) / 180;
                    const rx = 170 + Math.cos(rad) * 115;
                    const ry = 175 + Math.sin(rad) * 38;
                    return (
                      <Circle
                        key={deg}
                        cx={rx}
                        cy={ry}
                        r={3.5}
                        fill={deg % 60 === 0 ? "#FFA940" : "#FA8C16"}
                        opacity={0.85}
                      />
                    );
                  })}
                </G>

                {/* Layer 3: Twin Flanking Diyas (Deep Indian Perspective) */}
                {/* Left Diya */}
                <G transform={`translate(${90 + px * 0.75}, ${162 + py * 0.75}) scale(0.68)`}>
                  <Ellipse cx={0} cy={18} rx={36} ry={13} fill="#4B1B04" />
                  <Path d="M -34,10 C -25,28 25,28 34,10 C 26,4 -26,4 -34,10 Z" fill="url(#clayDiya)" />
                  <Ellipse cx={0} cy={10} rx={28} ry={7} fill="url(#gheeGlow)" />
                  {/* Left Flame */}
                  <Path
                    d={`M -2,8 C -10,-4 ${flameWobble * 0.6},-18 0,-28 C ${-flameWobble * 0.6},-18 10,-4 2,8 Z`}
                    fill="url(#flameInnerGlow)"
                    transform={`scale(${flameHeightScale * 0.9})`}
                  />
                  <Circle cx={0} cy={-12} r={3} fill="#FFFFFF" opacity={0.8} />
                </G>

                {/* Right Diya */}
                <G transform={`translate(${250 + px * 0.75}, ${162 + py * 0.75}) scale(0.68)`}>
                  <Ellipse cx={0} cy={18} rx={36} ry={13} fill="#4B1B04" />
                  <Path d="M -34,10 C -25,28 25,28 34,10 C 26,4 -26,4 -34,10 Z" fill="url(#clayDiya)" />
                  <Ellipse cx={0} cy={10} rx={28} ry={7} fill="url(#gheeGlow)" />
                  {/* Right Flame */}
                  <Path
                    d={`M -2,8 C -10,-4 ${-flameWobble * 0.6},-18 0,-28 C ${flameWobble * 0.6},-18 10,-4 2,8 Z`}
                    fill="url(#flameInnerGlow)"
                    transform={`scale(${flameHeightScale * 0.9})`}
                  />
                  <Circle cx={0} cy={-12} r={3} fill="#FFFFFF" opacity={0.8} />
                </G>

                {/* Layer 4: Central Grand Royal Diya (Foreground 3D Focal Point) */}
                <G transform={`translate(${170 + px}, ${150 + py})`}>
                  {/* Diya Base Drop Shadow */}
                  <Ellipse cx={0} cy={34} rx={68} ry={20} fill="#000000" opacity={0.5} />

                  {/* Clay Diya Body with Sculpted Bevels */}
                  <Path
                    d="M -60,18 C -45,46 45,46 60,18 C 50,8 -50,8 -60,18 Z"
                    fill="url(#clayDiya)"
                    stroke="#D48806"
                    strokeWidth={1.2}
                  />

                  {/* Ornate Rim Engravings */}
                  <Path
                    d="M -54,16 Q 0,26 54,16"
                    fill="none"
                    stroke="#FFE58F"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    opacity={0.7}
                  />

                  {/* Oil / Golden Ghee Pool */}
                  <Ellipse cx={0} cy={16} rx={48} ry={11} fill="url(#gheeGlow)" />

                  {/* Cotton Wick (Batti) */}
                  <Line x1={-3} y1={17} x2={0} y2={6} stroke="#3E1A04" strokeWidth={3} strokeLinecap="round" />
                  <Circle cx={0} cy={6} r={2.5} fill="#FFA940" />

                  {/* Layer 5: 4D Dynamic Flickering Flame (Multi-Harmonic Physics) */}
                  <G transform={`translate(0, 6) scale(${flameHeightScale})`}>
                    {/* Outer Flame Corona */}
                    <Path
                      d={`M -4,2 C -18,-14 ${flameWobble * 1.5},-36 0,-56 C ${-flameWobble * 1.2},-36 18,-14 4,2 Z`}
                      fill="url(#flameInnerGlow)"
                      opacity={0.94}
                    />

                    {/* Inner White-Hot Core */}
                    <Path
                      d={`M -2,2 C -8,-10 ${flameWobble * 0.8},-26 0,-38 C ${-flameWobble * 0.8},-26 8,-10 2,2 Z`}
                      fill="#FFFFFF"
                      opacity={0.88}
                    />
                  </G>
                </G>

                {/* Layer 6: 4D Temporal Phuljhadi Sparkles & Floating Light Dust */}
                {particlesRef.current.map((p) => {
                  const lifeRatio = p.life / p.maxLife;
                  const opacity = lifeRatio < 0.2 ? lifeRatio * 5 : 1 - lifeRatio;
                  const twinkle = 0.5 + Math.sin(tick * 5 + p.twinklePhase) * 0.5;
                  const renderX = 170 + p.x + px * (1 - p.z);
                  const renderY = 145 + p.y + py * (1 - p.z);

                  return (
                    <Circle
                      key={p.id}
                      cx={renderX}
                      cy={renderY}
                      r={p.size * (1 - p.z * 0.4)}
                      fill={p.hue}
                      opacity={Math.max(0, opacity * twinkle)}
                    />
                  );
                })}

                {/* Interactive Status Pill */}
                <G transform="translate(170, 258)">
                  <Rect x={-75} y={-11} width={150} height={22} rx={11} fill="rgba(8,30,18,0.85)" stroke="rgba(245,184,65,0.4)" strokeWidth={1} />
                  <SvgText x={0} y={4} fill="#FFE066" fontSize={9.5} fontWeight="bold" textAnchor="middle">
                    ✦ 4D INTERACTIVE DIYA
                  </SvgText>
                </G>
              </Svg>
            </Pressable>

            {/* Hint Underneath */}
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
              {isHovered ? "✦ Gyroscopic tilt active · Tap diya for sparkles" : "✦ Move cursor or tap diya to release light sparkles"}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
