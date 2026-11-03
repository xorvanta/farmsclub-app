import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient as SvgGrad,
  Path,
  RadialGradient as SvgRadial,
  Stop,
} from "react-native-svg";
import { useTheme } from "@/constants/theme-context";

/**
 * 4D Sparkle: 3D spatial coordinates (x, y, z), velocity, and time-based lifespan.
 */
type Sparkle4D = {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  size: number;
  hue: string;
  life: number;
  maxLife: number;
  twinklePhase: number;
};

/**
 * Sleek 4D Diwali Festive Banner:
 * - Simple, warm holiday wish (title & subtitle only).
 * - 4D glowing interactive Diya with flickering flame, floating golden sparklers & 3D tilt.
 */
export function DiwaliBanner4D() {
  const { fonts, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 680;

  // 4D Interactive Canvas State
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [tick, setTick] = useState(0);
  const particlesRef = useRef<Sparkle4D[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Initialize sparkles
  useEffect(() => {
    const initial: Sparkle4D[] = [];
    for (let i = 0; i < 20; i++) {
      initial.push({
        id: i,
        x: (Math.random() - 0.5) * 120,
        y: Math.random() * 60 - 20,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.35 - Math.random() * 0.6,
        size: 1.5 + Math.random() * 2.8,
        hue: i % 3 === 0 ? "#FFE58F" : i % 3 === 1 ? "#FFA940" : "#FFFFFF",
        life: Math.random() * 80,
        maxLife: 60 + Math.random() * 60,
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

      // Evolve particles over 3D space & time
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        if (p.life >= p.maxLife || p.y < -75) {
          p.x = (Math.random() - 0.5) * 90;
          p.y = 25 + Math.random() * 15;
          p.life = 0;
          p.vy = -0.35 - Math.random() * 0.6;
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

  // Parallax pointer tracking on hover
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
  }, []);

  // Celebratory sparkle burst on tap
  const triggerBurst = () => {
    particlesRef.current.forEach((p) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.2;
      p.x = (Math.random() - 0.5) * 20;
      p.y = 5 + (Math.random() - 0.5) * 15;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 0.8;
      p.life = 0;
    });
  };

  // Organic flame calculations
  const flameWobble = Math.sin(tick * 3.2) * 1.8 + Math.cos(tick * 5.7) * 1.1;
  const flameHeightScale = 1 + Math.sin(tick * 4.1) * 0.08;
  const auraRadius = 45 + Math.sin(tick * 2.5) * 8;

  // 3D Parallax offset
  const px = tilt.x * 8;
  const py = tilt.y * 5;

  return (
    <View style={{ width: "100%", maxWidth: 1232, alignSelf: "center", paddingHorizontal: spacing.lg, marginVertical: spacing.md }}>
      <LinearGradient
        colors={["#200B03", "#140601", "#091D11"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: "rgba(245,184,65,0.42)",
          overflow: "hidden",
          position: "relative",
          shadowColor: "#F5B841",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.14,
          shadowRadius: 18,
          elevation: 4,
        }}
      >
        {/* Subtle festive golden top border accent */}
        <View style={{ height: 2, backgroundColor: "#F5B841", opacity: 0.8 }} />

        <View
          style={{
            flexDirection: compact ? "column-reverse" : "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: compact ? 16 : 24,
            paddingVertical: compact ? 14 : 16,
            gap: compact ? 12 : 24,
          }}
        >
          {/* Left: Clean Festive Wish (Title & Subtitle Only) */}
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text style={{ fontSize: 16 }}>🪔</Text>
              <Text
                style={{
                  fontFamily: fonts.devanagari ?? fonts.display,
                  fontSize: compact ? 18 : 22,
                  color: "#FFE066",
                  letterSpacing: 0.4,
                }}
              >
                शुभ दीपावली
              </Text>
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: compact ? 17 : 21,
                  color: "#FFFFFF",
                  letterSpacing: -0.2,
                }}
              >
                · Happy Diwali
              </Text>
            </View>

            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: compact ? 13 : 14,
                lineHeight: compact ? 18 : 20,
                color: "rgba(255,255,255,0.85)",
                maxWidth: 680,
              }}
            >
              Wishing you and your family an auspicious season of light, abundance, and prosperity.
            </Text>
          </View>

          {/* Right: 4D Glowing Diya with Interactive Hover Tilt & Sparkles */}
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
            }}
            {...(Platform.OS === "web"
              ? {
                  onPointerMove: handlePointerMove,
                  onPointerLeave: handlePointerLeave,
                }
              : {})}
          >
            <Pressable
              onPress={triggerBurst}
              accessibilityRole="button"
              accessibilityLabel="4D Festive Diya. Tap for golden sparkles."
              style={{
                width: 170,
                height: 95,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Svg width={170} height={95} viewBox="0 0 170 95">
                <Defs>
                  {/* Diya Glow Aura */}
                  <SvgRadial id="festiveGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#FFA940" stopOpacity="0.55" />
                    <Stop offset="50%" stopColor="#D46B08" stopOpacity="0.25" />
                    <Stop offset="100%" stopColor="#140601" stopOpacity="0" />
                  </SvgRadial>

                  {/* Flame Core Glow */}
                  <SvgRadial id="flameGlow" cx="50%" cy="60%" r="50%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <Stop offset="35%" stopColor="#FFF566" stopOpacity="0.95" />
                    <Stop offset="75%" stopColor="#FF7A45" stopOpacity="0.85" />
                    <Stop offset="100%" stopColor="#CF1322" stopOpacity="0" />
                  </SvgRadial>

                  {/* Clay Diya */}
                  <SvgGrad id="clayDiya" x1="0%" y1="0%" x2="100%" y2="80%">
                    <Stop offset="0%" stopColor="#D46B08" />
                    <Stop offset="50%" stopColor="#A53A04" />
                    <Stop offset="100%" stopColor="#5C1F02" />
                  </SvgGrad>

                  {/* Golden Ghee */}
                  <SvgGrad id="gheePool" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#FFF566" stopOpacity="0.9" />
                    <Stop offset="100%" stopColor="#D48806" stopOpacity="0.75" />
                  </SvgGrad>
                </Defs>

                {/* Layer 1: Ambient 4D Aura Glow */}
                <Circle cx={85 + px * 0.3} cy={52 + py * 0.3} r={auraRadius} fill="url(#festiveGlow)" />

                {/* Layer 2: Base Brass Thali Rim with Parallax */}
                <G transform={`translate(${px * 0.5}, ${py * 0.5})`}>
                  <Ellipse cx={85} cy={64} rx={60} ry={16} fill="none" stroke="#D48806" strokeWidth={1} strokeDasharray="2 3" opacity={0.65} />
                  <Ellipse cx={85} cy={64} rx={52} ry={13} fill="#2A1204" opacity={0.5} />
                </G>

                {/* Layer 3: Traditional 3D Clay Diya */}
                <G transform={`translate(${85 + px}, ${54 + py})`}>
                  {/* Drop Shadow */}
                  <Ellipse cx={0} cy={16} rx={36} ry={9} fill="#000000" opacity={0.45} />

                  {/* Diya Clay Bowl */}
                  <Path
                    d="M -30,8 C -22,24 22,24 30,8 C 24,3 -24,3 -30,8 Z"
                    fill="url(#clayDiya)"
                    stroke="#D48806"
                    strokeWidth={0.8}
                  />

                  {/* Golden Oil / Ghee Line */}
                  <Ellipse cx={0} cy={7} rx={24} ry={5} fill="url(#gheePool)" />

                  {/* Wick */}
                  <Line x1={-1.5} y1={8} x2={0} y2={2} stroke="#3E1A04" strokeWidth={2} strokeLinecap="round" />

                  {/* Layer 4: 4D Flickering Flame */}
                  <G transform={`translate(0, 2) scale(${flameHeightScale})`}>
                    {/* Outer flame */}
                    <Path
                      d={`M -2.5,1 C -10,-7 ${flameWobble * 1.2},-18 0,-28 C ${-flameWobble * 1.2},-18 10,-7 2.5,1 Z`}
                      fill="url(#flameGlow)"
                      opacity={0.95}
                    />
                    {/* Inner core */}
                    <Path
                      d={`M -1.2,1 C -4,-5 ${flameWobble * 0.6},-13 0,-19 C ${-flameWobble * 0.6},-13 4,-5 1.2,1 Z`}
                      fill="#FFFFFF"
                      opacity={0.9}
                    />
                  </G>
                </G>

                {/* Layer 5: 4D Upward Rising Sparkles */}
                {particlesRef.current.map((p) => {
                  const lifeRatio = p.life / p.maxLife;
                  const opacity = lifeRatio < 0.2 ? lifeRatio * 5 : 1 - lifeRatio;
                  const twinkle = 0.5 + Math.sin(tick * 5 + p.twinklePhase) * 0.5;
                  const renderX = 85 + p.x + px * (1 - p.z);
                  const renderY = 52 + p.y + py * (1 - p.z);

                  return (
                    <Circle
                      key={p.id}
                      cx={renderX}
                      cy={renderY}
                      r={p.size * (1 - p.z * 0.35)}
                      fill={p.hue}
                      opacity={Math.max(0, opacity * twinkle)}
                    />
                  );
                })}
              </Svg>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
