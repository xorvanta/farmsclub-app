import { useState, useCallback, type ReactNode } from "react";
import { Platform, View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Maximum tilt angle in degrees on desktop hover (default 5.5). */
  maxTilt?: number;
  /** Scale factor on hover (default 1.015). */
  scale?: number;
  /** Whether to show a warm gold/white specular sheen on hover. */
  glare?: boolean;
};

function prefersReducedMotion(): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Interactive 3D perspective card wrapper.
 * On web with pointer devices, gently tilts toward the cursor with a specular brass-gold sheen.
 * On mobile/touch or with reduced-motion enabled, renders a zero-overhead View.
 */
export function TiltCard({ children, style, maxTilt = 5.5, scale = 1.015, glare = true }: Props) {
  const [tilt, setTilt] = useState<{ rx: number; ry: number; gx: number; gy: number; active: boolean }>({
    rx: 0,
    ry: 0,
    gx: 50,
    gy: 50,
    active: false,
  });

  const onMouseMove = useCallback(
    (e: { currentTarget: HTMLElement; clientX: number; clientY: number }) => {
      if (prefersReducedMotion()) return;
      const rect = e.currentTarget?.getBoundingClientRect?.();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const ry = (x - 0.5) * maxTilt * 2;
      const rx = (0.5 - y) * maxTilt * 2;
      setTilt({ rx, ry, gx: Math.round(x * 100), gy: Math.round(y * 100), active: true });
    },
    [maxTilt],
  );

  const onMouseLeave = useCallback(() => {
    setTilt((prev) => (prev.active ? { rx: 0, ry: 0, gx: 50, gy: 50, active: false } : prev));
  }, []);

  if (Platform.OS !== "web") {
    return <View style={style}>{children}</View>;
  }

  const webProps = {
    onMouseMove,
    onMouseLeave,
  } as Record<string, unknown>;

  const webTransformStyle = {
    transform: tilt.active
      ? `perspective(960px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) scale3d(${scale}, ${scale}, 1)`
      : "perspective(960px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
    transition: tilt.active
      ? "transform 90ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 180ms ease"
      : "transform 360ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 360ms ease",
    willChange: "transform",
  } as unknown as ViewStyle;

  return (
    <View {...webProps} style={[style, webTransformStyle]}>
      {children}
      {glare && tilt.active ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: "inherit" as unknown as number,
              zIndex: 10,
              backgroundImage: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(229, 180, 98, 0.16) 0%, rgba(255, 255, 255, 0.06) 38%, transparent 70%)`,
            } as unknown as ViewStyle,
          ]}
        />
      ) : null}
    </View>
  );
}
