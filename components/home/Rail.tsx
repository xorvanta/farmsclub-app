import { useRef } from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { Arrow } from "./HeroCarousel";

/**
 * A horizontal row of cards that bleeds to the screen edge: swipe on phones, arrow buttons on
 * wide screens. `itemWidth` keeps every card the same size.
 */
export function Rail<T>({ items, itemWidth, keyOf, render, label }: { items: T[]; itemWidth: number; keyOf: (t: T) => string; render: (t: T) => React.ReactNode; label: string }) {
  const { spacing } = useTheme();
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollView>(null);
  const x = useRef(0);
  const wide = width >= 860;
  const step = Math.max(itemWidth + spacing.md, Math.floor(Math.min(width, 1232) * 0.8));
  const scroll = (dir: 1 | -1) => {
    x.current = Math.max(0, x.current + dir * step);
    ref.current?.scrollTo({ x: x.current, animated: true });
  };
  const overflows = items.length * (itemWidth + spacing.md) > Math.min(width, 1232);

  return (
    <View>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => (x.current = e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={64}
        snapToInterval={itemWidth + spacing.md}
        decelerationRate="fast"
        style={{ marginHorizontal: -spacing.lg }}
        contentContainerStyle={{ gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: 8, paddingTop: 2 }}
        accessibilityLabel={label}
      >
        {items.map((it) => (
          <View key={keyOf(it)} style={{ width: itemWidth }}>
            {render(it)}
          </View>
        ))}
      </ScrollView>
      {wide && overflows ? (
        <>
          <View style={{ position: "absolute", left: -21, top: "38%", zIndex: 2 }}>
            <Arrow dir="left" tone="dark" onPress={() => scroll(-1)} />
          </View>
          <View style={{ position: "absolute", right: -21, top: "38%", zIndex: 2 }}>
            <Arrow dir="right" tone="dark" onPress={() => scroll(1)} />
          </View>
        </>
      ) : null}
    </View>
  );
}
