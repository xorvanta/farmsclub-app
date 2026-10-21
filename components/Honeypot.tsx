import { StyleSheet, TextInput } from "react-native";

/** Hidden honeypot input — invisible and unreachable for people and screen readers; bots fill it.
 *  Its value travels as `hp` and the backend refuses a non-empty one. */
export function Honeypot({ value, onChangeText }: { value: string; onChangeText: (t: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      style={styles.hp}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      autoComplete="off"
      tabIndex={-1}
    />
  );
}

const styles = StyleSheet.create({
  hp: { position: "absolute", width: 1, height: 1, opacity: 0, left: -9999 },
});
