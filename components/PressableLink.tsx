import { forwardRef } from "react";
import { Pressable, View, type PressableProps } from "react-native";
import { Link, type Href } from "expo-router";

type Props = Omit<PressableProps, "style" | "onPress"> & {
  href: Href;
  /** Same as Pressable's `style` — a function of `{ pressed }` is fine here. */
  style?: PressableProps["style"];
  onPress?: PressableProps["onPress"];
};

/**
 * A pressable card/tile that is a real link: `<a href>` on web (crawlable, open-in-new-tab),
 * in-app navigation on native. Wraps expo-router's `<Link asChild>`.
 *
 * Why not `<Link asChild><Pressable style={fn}>` directly: Link's Slot merges the child's `style`
 * by object-spreading it, which silently drops a `({ pressed }) => …` style function or a style
 * array. Here the child Slot sees `pressStyle` instead, and this component hands it to Pressable.
 */
export function PressableLink({ href, style, children, ...rest }: Props) {
  return (
    <Link href={href} asChild>
      <InnerPressable pressStyle={style} accessibilityRole="link" {...rest}>
        {children}
      </InnerPressable>
    </Link>
  );
}

const InnerPressable = forwardRef<View, Omit<PressableProps, "style"> & { pressStyle?: PressableProps["style"] }>(function InnerPressable(
  { pressStyle, ...rest },
  ref,
) {
  return <Pressable ref={ref} {...rest} style={pressStyle} />;
});
