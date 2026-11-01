import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient as SvgGrad, Path, Polygon, Rect, Stop, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/constants/theme-context";

type PlantSpecimen = {
  id: string;
  name: string;
  giBadge: string;
  x3d: number; // -80 to +80 along the line
  height: number;
  canopyRadius: number;
  foliageDark: string;
  foliageMid: string;
  foliageBright: string;
  accentDot: string;
  phaseOffset: number;
};

const HERO_PLANTS: PlantSpecimen[] = [
  {
    id: "alphonso",
    name: "GI Alphonso",
    giBadge: "GI RATNAGIRI",
    x3d: -76,
    height: 46,
    canopyRadius: 17,
    foliageDark: "#155932",
    foliageMid: "#228B4E",
    foliageBright: "#52C388",
    accentDot: "#F5B841",
    phaseOffset: 0,
  },
  {
    id: "guava",
    name: "Surkha Guava",
    giBadge: "GI ALLAHABAD",
    x3d: -38,
    height: 42,
    canopyRadius: 15.5,
    foliageDark: "#196338",
    foliageMid: "#2A9A58",
    foliageBright: "#68D39A",
    accentDot: "#E86F52",
    phaseOffset: 1.1,
  },
  {
    id: "pomegranate",
    name: "Bhagwa Anar",
    giBadge: "GI SOLAPUR",
    x3d: 0,
    height: 50,
    canopyRadius: 18.5,
    foliageDark: "#124E2B",
    foliageMid: "#1E7E46",
    foliageBright: "#4CC484",
    accentDot: "#E04F3E",
    phaseOffset: 2.2,
  },
  {
    id: "litchi",
    name: "Shahi Litchi",
    giBadge: "GI MUZAFFARPUR",
    x3d: 38,
    height: 44,
    canopyRadius: 16,
    foliageDark: "#175C34",
    foliageMid: "#258E51",
    foliageBright: "#5ED193",
    accentDot: "#F06449",
    phaseOffset: 3.3,
  },
  {
    id: "teak",
    name: "Nilambur Teak",
    giBadge: "GI KERALA",
    x3d: 76,
    height: 52,
    canopyRadius: 16.5,
    foliageDark: "#104726",
    foliageMid: "#1C7440",
    foliageBright: "#47B87B",
    accentDot: "#E5B462",
    phaseOffset: 4.4,
  },
];

/**
 * Projects a 3D point (x, y, z) where x = left/right, y = depth, z = up
 * onto a 2D SVG canvas (cx, cy) with full 360° yaw rotation and perspective foreshortening.
 */
function project3D(
  x: number,
  y: number,
  z: number,
  yawDeg: number,
  pitchDeg: number,
  cx: number,
  cy: number,
  scale: number,
) {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;

  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);

  // Rotate in ground plane (X-Y)
  const rx = x * cosY - y * sinY;
  const ry = x * sinY + y * cosY;

  // Mild perspective factor based on depth ry
  const fov = 420;
  const persp = fov / Math.max(180, fov + ry * 0.55);

  const sx = cx + rx * scale * persp;
  const sy = cy + (ry * sinP - z * cosP) * scale * persp;

  return { x: sx, y: sy, depth: ry, scale: persp };
}

/**
 * Interactive 3D GI-Tag Plant Saplings Stage for the Hero Section:
 * Renders 5 GI-Tag Plant Saplings standing in line on a Tinkercad-style 3D CAD workplane,
 * gently swaying in the breeze ("shaking a tiny bit as if blowing air") and rotating a full
 * 360° when hovered or dragged so buyers can inspect the line of plants from every side.
 */
export function Hero3DPlantStage({
  compact = false,
  onOpenPlanner,
  onOpenTour,
}: {
  compact?: boolean;
  onOpenPlanner?: () => void;
  onOpenTour?: () => void;
}) {
  const { fonts, radius } = useTheme();
  const [yawDeg, setYawDeg] = useState<number>(22);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [autoSpin, setAutoSpin] = useState<boolean>(false);
  const [windTick, setWindTick] = useState<number>(0);
  const dragStartX = useRef<number | null>(null);
  const dragStartYaw = useRef<number>(22);

  // Continuous gentle wind breeze animation + optional 360° turntable spin
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    timer = setInterval(() => {
      setWindTick((t) => (t + 1) % 3600);
      if (autoSpin && !isHovering) {
        setYawDeg((prev) => (prev + 2.2) % 360);
      }
    }, 55);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [autoSpin, isHovering]);

  const windTime = windTick * 0.11;

  // Web mouse-move 360° rotation across the workplane
  const webInteractiveProps =
    Platform.OS === "web"
      ? {
          onMouseEnter: () => setIsHovering(true),
          onMouseLeave: () => setIsHovering(false),
          onMouseMove: (e: unknown) => {
            const ev = e as { nativeEvent?: { offsetX?: number }; currentTarget?: { clientWidth?: number } };
            const offsetX = ev?.nativeEvent?.offsetX;
            const w = ev?.currentTarget?.clientWidth || 360;
            if (typeof offsetX === "number" && w > 0) {
              const ratio = Math.max(0, Math.min(1, offsetX / w));
              setYawDeg(Math.round(ratio * 360));
            }
          },
        }
      : {};

  // Touch drag 360° rotation for mobile devices
  const touchProps = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e: { nativeEvent: { locationX: number } }) => {
      dragStartX.current = e.nativeEvent.locationX;
      dragStartYaw.current = yawDeg;
      setIsHovering(true);
    },
    onResponderMove: (e: { nativeEvent: { locationX: number } }) => {
      if (dragStartX.current == null) return;
      const dx = e.nativeEvent.locationX - dragStartX.current;
      const next = (dragStartYaw.current + dx * 1.35) % 360;
      setYawDeg(Math.round(next < 0 ? next + 360 : next));
    },
    onResponderRelease: () => {
      dragStartX.current = null;
      setIsHovering(false);
    },
  };

  const vw = 380;
  const vh = compact ? 158 : 210;
  const cx = vw / 2;
  const cy = compact ? 102 : 132;
  const pitch = 28;
  const sc = compact ? 1.32 : 1.52;

  // Workplane 3D bounds: X from -104 to +104, Y from -38 to +38
  const wpX = 104;
  const wpY = 38;
  const slabDepth = 7;

  const workplaneData = useMemo(() => {
    const pTL = project3D(-wpX, -wpY, 0, yawDeg, pitch, cx, cy, sc);
    const pTR = project3D(wpX, -wpY, 0, yawDeg, pitch, cx, cy, sc);
    const pBR = project3D(wpX, wpY, 0, yawDeg, pitch, cx, cy, sc);
    const pBL = project3D(-wpX, wpY, 0, yawDeg, pitch, cx, cy, sc);

    const bTL = project3D(-wpX, -wpY, -slabDepth, yawDeg, pitch, cx, cy, sc);
    const bTR = project3D(wpX, -wpY, -slabDepth, yawDeg, pitch, cx, cy, sc);
    const bBR = project3D(wpX, wpY, -slabDepth, yawDeg, pitch, cx, cy, sc);
    const bBL = project3D(-wpX, wpY, -slabDepth, yawDeg, pitch, cx, cy, sc);

    // Grid lines along X and Y
    const xLines: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
    for (let gx = -96; gx <= 96; gx += 16) {
      const a = project3D(gx, -wpY, 0, yawDeg, pitch, cx, cy, sc);
      const b = project3D(gx, wpY, 0, yawDeg, pitch, cx, cy, sc);
      xLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, major: gx % 32 === 0 });
    }
    const yLines: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
    for (let gy = -32; gy <= 32; gy += 16) {
      const a = project3D(-wpX, gy, 0, yawDeg, pitch, cx, cy, sc);
      const b = project3D(wpX, gy, 0, yawDeg, pitch, cx, cy, sc);
      yLines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, major: gy === 0 });
    }

    // Drip line running along Y=0 from -96 to +96
    const dripStart = project3D(-96, 0, 1, yawDeg, pitch, cx, cy, sc);
    const dripEnd = project3D(96, 0, 1, yawDeg, pitch, cx, cy, sc);

    // Side walls of the 3D CAD workplane sorted by depth
    const walls = [
      { pts: `${pTL.x},${pTL.y} ${pTR.x},${pTR.y} ${bTR.x},${bTR.y} ${bTL.x},${bTL.y}`, depth: (pTL.depth + pTR.depth) / 2, fill: "#13472B" },
      { pts: `${pTR.x},${pTR.y} ${pBR.x},${pBR.y} ${bBR.x},${bBR.y} ${bTR.x},${bTR.y}`, depth: (pTR.depth + pBR.depth) / 2, fill: "#0E3620" },
      { pts: `${pBR.x},${pBR.y} ${pBL.x},${pBL.y} ${bBL.x},${bBL.y} ${bBR.x},${bBR.y}`, depth: (pBR.depth + pBL.depth) / 2, fill: "#175634" },
      { pts: `${pBL.x},${pBL.y} ${pTL.x},${pTL.y} ${bTL.x},${bTL.y} ${bBL.x},${bBL.y}`, depth: (pBL.depth + pTL.depth) / 2, fill: "#0F3A22" },
    ].sort((a, b) => a.depth - b.depth);

    return {
      topPoly: `${pTL.x},${pTL.y} ${pTR.x},${pTR.y} ${pBR.x},${pBR.y} ${pBL.x},${pBL.y}`,
      shadowPoly: `${bTL.x},${bTL.y + 6} ${bTR.x},${bTR.y + 6} ${bBR.x},${bBR.y + 6} ${bBL.x},${bBL.y + 6}`,
      corners: [pTL, pTR, pBR, pBL],
      walls,
      xLines,
      yLines,
      dripStart,
      dripEnd,
    };
  }, [yawDeg, pitch, cx, cy, sc]);

  // Sort the 5 standing plants back-to-front by camera depth so 360° rotation overlaps accurately
  const sortedPlants = useMemo(() => {
    return HERO_PLANTS.map((p) => {
      // Gentle breeze sway in X and Y
      const swayX = Math.sin(windTime + p.phaseOffset) * 2.8 + Math.cos(windTime * 0.6 + p.phaseOffset) * 1.1;
      const swayZ = Math.abs(Math.sin(windTime + p.phaseOffset)) * 0.7;

      const base = project3D(p.x3d, 0, 0, yawDeg, pitch, cx, cy, sc);
      const potTop = project3D(p.x3d, 0, 10, yawDeg, pitch, cx, cy, sc);
      const midStem = project3D(p.x3d + swayX * 0.45, 0, p.height * 0.52, yawDeg, pitch, cx, cy, sc);
      const crownCenter = project3D(p.x3d + swayX, 0, p.height - swayZ, yawDeg, pitch, cx, cy, sc);
      const leftLeafTip = project3D(p.x3d - 11 + swayX * 0.7, -4, p.height * 0.64, yawDeg, pitch, cx, cy, sc);
      const rightLeafTip = project3D(p.x3d + 11 + swayX * 0.85, 4, p.height * 0.68, yawDeg, pitch, cx, cy, sc);

      return {
        ...p,
        swayX,
        base,
        potTop,
        midStem,
        crownCenter,
        leftLeafTip,
        rightLeafTip,
        depth: base.depth,
      };
    }).sort((a, b) => a.depth - b.depth);
  }, [yawDeg, pitch, cx, cy, sc, windTime]);

  return (
    <View
      style={{
        width: compact ? "100%" : 405,
        backgroundColor: "rgba(6, 22, 14, 0.86)",
        borderRadius: radius.xl,
        padding: compact ? 10 : 14,
        borderWidth: 1.5,
        borderColor: "rgba(229,180,98,0.42)",
        gap: compact ? 8 : 10,
        shadowColor: "#000",
        shadowOpacity: 0.38,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
      }}
    >
      {/* Top Bar: Clean Title & 360° Inspection Button */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.8, color: "#E5B462", flexShrink: 1 }}>
          3D PLANT SAPLINGS & VARIETIES
        </Text>
        <Pressable
          onPress={() => setAutoSpin((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel="Toggle 360 degree rotation"
          style={{
            backgroundColor: autoSpin ? "#E5B462" : "rgba(56,189,248,0.18)",
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: autoSpin ? "#E5B462" : "rgba(56,189,248,0.45)",
          }}
        >
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: autoSpin ? "#081E12" : "#7DD3FC" }}>
            {autoSpin ? "⟳ Auto 360°" : "↻ Hover / Drag 360°"}
          </Text>
        </Pressable>
      </View>

      {/* Interactive 3D CAD Workplane Canvas */}
      <View
        {...webInteractiveProps}
        {...touchProps}
        style={{
          backgroundColor: "#071B11",
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: "rgba(56,189,248,0.32)",
          overflow: "hidden",
          position: "relative",
          ...(Platform.OS === "web" ? ({ cursor: "grab" } as object) : {}),
        }}
      >
        <Svg width="100%" height={vh} viewBox={`0 0 ${vw} ${vh}`} preserveAspectRatio="xMidYMid meet">
          <Defs>
            <SvgGrad id="heroWpSurface" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#123D25" />
              <Stop offset="50%" stopColor="#0E311E" />
              <Stop offset="100%" stopColor="#0A2516" />
            </SvgGrad>
          </Defs>

          {/* Drop shadow under 3D workplane */}
          <Polygon points={workplaneData.shadowPoly} fill="rgba(0,0,0,0.45)" />

          {/* Extruded 3D CAD Workplane Side Walls (Back walls first) */}
          {workplaneData.walls.slice(0, 2).map((w, idx) => (
            <Polygon key={`bw-${idx}`} points={w.pts} fill={w.fill} stroke="rgba(56,189,248,0.28)" strokeWidth={0.8} />
          ))}

          {/* Top 3D Workplane Surface */}
          <Polygon points={workplaneData.topPoly} fill="url(#heroWpSurface)" stroke="#38BDF8" strokeWidth={1.6} />

          {/* Tinkercad-style 3D Blueprint Grid Lines */}
          {workplaneData.xLines.map((l, i) => (
            <Line
              key={`gx-${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={l.major ? "rgba(56,189,248,0.34)" : "rgba(56,189,248,0.14)"}
              strokeWidth={l.major ? 1 : 0.6}
            />
          ))}
          {workplaneData.yLines.map((l, i) => (
            <Line
              key={`gy-${i}`}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={l.major ? "rgba(229,180,98,0.45)" : "rgba(56,189,248,0.14)"}
              strokeWidth={l.major ? 1.2 : 0.6}
            />
          ))}

          {/* Extruded 3D Workplane Front Walls */}
          {workplaneData.walls.slice(2).map((w, idx) => (
            <Polygon key={`fw-${idx}`} points={w.pts} fill={w.fill} stroke="rgba(56,189,248,0.4)" strokeWidth={0.9} />
          ))}

          {/* CAD Selection Corner Handles (Tinkercad style white/cyan squares) */}
          {workplaneData.corners.map((c, idx) => (
            <Rect
              key={`cad-handle-${idx}`}
              x={c.x - 3}
              y={c.y - 3}
              width={6}
              height={6}
              fill="#FFFFFF"
              stroke="#0284C7"
              strokeWidth={1.3}
            />
          ))}

          {/* 3D Drip Irrigation Line & Emitters along the row of plants */}
          <Line
            x1={workplaneData.dripStart.x}
            y1={workplaneData.dripStart.y}
            x2={workplaneData.dripEnd.x}
            y2={workplaneData.dripEnd.y}
            stroke="#38BDF8"
            strokeWidth={2.2}
            strokeDasharray="4 3"
          />

          {/* 5 Standing 3D GI-Tag Plant Saplings in Line (Depth-Sorted Back-to-Front, Swaying in Wind) */}
          {sortedPlants.map((p) => {
            const s = p.base.scale;
            const r = p.canopyRadius * s;
            const potW = 8.5 * s;
            const potH = 9.5 * s;

            return (
              <G key={p.id}>
                {/* Cast Shadow on Workplane Grid */}
                <Ellipse
                  cx={p.base.x + p.swayX * 0.7}
                  cy={p.base.y + 2}
                  rx={12 * s}
                  ry={5 * s}
                  fill="rgba(0,0,0,0.48)"
                />

                {/* Organic Soil Pit Ring */}
                <Ellipse
                  cx={p.base.x}
                  cy={p.base.y}
                  rx={10.5 * s}
                  ry={4.6 * s}
                  fill="#2B1C10"
                  stroke="#E5B462"
                  strokeWidth={0.9}
                />

                {/* 3D Nursery Grow-Bag / Root Cylinder */}
                <Path
                  d={`M${p.base.x - potW},${p.potTop.y} L${p.base.x - potW * 0.82},${p.base.y} Q${p.base.x},${p.base.y + 3.5 * s} ${p.base.x + potW * 0.82},${p.base.y} L${p.base.x + potW},${p.potTop.y} Z`}
                  fill="#B8561E"
                  stroke="#E5B462"
                  strokeWidth={0.8}
                />
                <Ellipse
                  cx={p.base.x}
                  cy={p.potTop.y}
                  rx={potW}
                  ry={3.2 * s}
                  fill="#4A2F1B"
                  stroke="#E5B462"
                  strokeWidth={0.8}
                />

                {/* Bamboo Support Stake */}
                <Line
                  x1={p.base.x + 3 * s}
                  y1={p.potTop.y}
                  x2={p.base.x + 3 * s}
                  y2={p.crownCenter.y + 4 * s}
                  stroke="#D4A359"
                  strokeWidth={1.3 * s}
                />

                {/* Swaying 3D Woody Stem / Trunk */}
                <Path
                  d={`M${p.base.x},${p.potTop.y} Q${p.midStem.x},${p.midStem.y} ${p.crownCenter.x},${p.crownCenter.y + 4 * s}`}
                  stroke="#7C4D25"
                  strokeWidth={3.2 * s}
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Lower Side Leaves Swaying in Breeze */}
                <Path
                  d={`M${p.midStem.x},${p.midStem.y} Q${p.leftLeafTip.x},${p.leftLeafTip.y - 5 * s} ${p.leftLeafTip.x - 4 * s},${p.leftLeafTip.y + 2 * s} Q${p.leftLeafTip.x + 3 * s},${p.leftLeafTip.y + 4 * s} ${p.midStem.x},${p.midStem.y}`}
                  fill={p.foliageMid}
                />
                <Path
                  d={`M${p.midStem.x},${p.midStem.y - 2 * s} Q${p.rightLeafTip.x},${p.rightLeafTip.y - 5 * s} ${p.rightLeafTip.x + 4 * s},${p.rightLeafTip.y + 2 * s} Q${p.rightLeafTip.x - 3 * s},${p.rightLeafTip.y + 4 * s} ${p.midStem.x},${p.midStem.y - 2 * s}`}
                  fill={p.foliageBright}
                />

                {/* 3D Layered Botanical Canopy (Shadow Sphere + Mid Crown + Sunlit Top Crown) */}
                <Ellipse
                  cx={p.crownCenter.x}
                  cy={p.crownCenter.y + 2.5 * s}
                  rx={r * 1.02}
                  ry={r * 0.78}
                  fill={p.foliageDark}
                />
                <Ellipse
                  cx={p.crownCenter.x - 1.5 * s}
                  cy={p.crownCenter.y - 1.5 * s}
                  rx={r * 0.86}
                  ry={r * 0.68}
                  fill={p.foliageMid}
                />
                <Ellipse
                  cx={p.crownCenter.x - 3 * s}
                  cy={p.crownCenter.y - 4.5 * s}
                  rx={r * 0.62}
                  ry={r * 0.48}
                  fill={p.foliageBright}
                />

                {/* GI-Tag Fruit / Bud Highlights */}
                <Circle cx={p.crownCenter.x + r * 0.35} cy={p.crownCenter.y - 1 * s} r={2.3 * s} fill={p.accentDot} />
                <Circle cx={p.crownCenter.x - r * 0.3} cy={p.crownCenter.y + 1.5 * s} r={2 * s} fill={p.accentDot} />
                <Circle cx={p.crownCenter.x + 1 * s} cy={p.crownCenter.y - r * 0.35} r={1.8 * s} fill="#FFFFFF" opacity={0.65} />

                {/* Floating CAD Label above center & outer plants */}
                {!compact || p.id === "alphonso" || p.id === "pomegranate" || p.id === "teak" ? (
                  <G>
                    <Rect
                      x={p.crownCenter.x - 28}
                      y={p.crownCenter.y - r - 17}
                      width={56}
                      height={12}
                      rx={3}
                      fill="rgba(8,30,18,0.88)"
                      stroke="rgba(229,180,98,0.55)"
                      strokeWidth={0.7}
                    />
                    <SvgText
                      x={p.crownCenter.x}
                      y={p.crownCenter.y - r - 8.5}
                      fill="#E5B462"
                      fontSize={7.5}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {p.name}
                    </SvgText>
                  </G>
                ) : null}
              </G>
            );
          })}

          {/* Bottom CAD Dimension Ruler Callout */}
          <G>
            <Rect x={vw / 2 - 74} y={vh - 19} width={148} height={15} rx={4} fill="#FFFFFF" stroke="#0284C7" strokeWidth={1} />
            <SvgText x={vw / 2} y={vh - 8.5} fill="#081E12" fontSize={8.5} fontWeight="bold" textAnchor="middle">
              5 PLANT SAPLINGS · 12.0 FT
            </SvgText>
          </G>
        </Svg>
      </View>

      {/* Bottom Package & Action Strip */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1 }}>
          <View style={{ backgroundColor: "rgba(82,195,136,0.18)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: "#6FC28F" }}>Verified Nursery Stock</Text>
          </View>
          <View style={{ backgroundColor: "rgba(229,180,98,0.16)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: "#E5B462" }}>Farm Setup Packages</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          {onOpenPlanner ? (
            <Pressable
              onPress={onOpenPlanner}
              accessibilityRole="button"
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: radius.md,
                backgroundColor: "#E5B462",
              }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: "#081E12" }}>📐 Full 3D Designer →</Text>
            </Pressable>
          ) : null}
          {!compact && onOpenTour ? (
            <Pressable
              onPress={onOpenTour}
              accessibilityRole="button"
              style={{
                paddingVertical: 6,
                paddingHorizontal: 9,
                borderRadius: radius.md,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.22)",
              }}
            >
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: "#FFFFFF" }}>✦ Tour</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
