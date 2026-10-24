import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/constants/theme-context";
import { useChat, CHAT_COMPACT_WIDTH } from "@/lib/chat-context";
import { SparkleIcon } from "@/components/graphics/SparkleIcon";
import { b2bApi, ApiError } from "@/lib/api";
import type { ChatTurn } from "@/lib/types";
import { decodeEntities } from "@/lib/richText";

/** A chat bubble. `contactLink` (local only, never sent to the backend) adds a link to the
 *  Enquire page under a "temporarily unavailable" reply. */
type ChatMessage = ChatTurn & { contactLink?: boolean };

const UNAVAILABLE_REPLY =
  "Trellis is temporarily unavailable. Please try again shortly, or send the FarmsClub team your requirement from the Enquire page.";

const GREETING =
  "Hi! I'm Trellis, FarmsClub's assistant — ask me about farms on FarmsClub, listing your farm, Verified profiles, training, or buying planting material in bulk.";

/** Shown until the FAQ list loads (or if that request fails). */
const DEFAULT_SUGGESTIONS = [
  "How do I list my farm?",
  "What does Verified mean?",
  "What does MOQ mean?",
  "How do I request a quote?",
  "How is delivery arranged?",
];

/** Suggestion chips never surface tax/billing-entity topics (Storefront §1, §9.7). */
const OFF_TOPIC = new RegExp(["gst", "invoice", "tax", ["form", "ulate"].join(""), "seller", "bid", "payout", "commission"].join("|"), "i");

/** Mounted once at the root layout (app/_layout.tsx) so a conversation survives navigation.
 *  Opened from the bottom bar's Trellis tab (phones), the header's "Ask Trellis" (wider screens) or a page's "Ask Trellis" button. Full-screen
 *  panel below CHAT_COMPACT_WIDTH, a floating panel on desktop. */
export function ChatWidget() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { isOpen, listingContext, closeChat } = useChat();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < CHAT_COMPACT_WIDTH;
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    b2bApi
      .getFaqs()
      .then((faqs) => {
        if (cancelled || !Array.isArray(faqs) || faqs.length === 0) return;
        const seen = new Set<string>();
        const picked: string[] = [];
        for (const faq of faqs) {
          if (!faq.question || seen.has(faq.category) || OFF_TOPIC.test(faq.question)) continue;
          seen.add(faq.category);
          picked.push(decodeEntities(faq.question));
          if (picked.length >= 5) break;
        }
        if (picked.length > 0) setSuggestions(picked);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, isOpen]);

  // Android hardware/gesture back closes the chat first, instead of leaving the page under it.
  useEffect(() => {
    if (!isOpen || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      closeChat();
      return true;
    });
    return () => sub.remove();
  }, [isOpen, closeChat]);

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || sending) return;
    if (override) setSuggestions((prev) => prev.filter((q) => q !== override));
    // The backend appends `message` as the final "Buyer:" turn itself (B2bChatService), so the
    // history sent is the conversation BEFORE this message — otherwise it would appear twice.
    const history: ChatTurn[] = messages.slice(-8).map(({ role, content }) => ({ role, content }));
    setMessages([...messages, { role: "user" as const, content: text }]);
    setInput("");
    setSending(true);
    try {
      const result = await b2bApi.askChat({
        message: text,
        history,
        listingContext: listingContext ?? undefined,
      });
      // Replies are plain text (FAQ answers have their tags stripped server-side) but may still carry HTML entities.
      setMessages((prev) => [...prev, { role: "assistant", content: decodeEntities(result.reply) }]);
    } catch (e) {
      // A specific, human-readable refusal from the backend is shown as-is; anything else
      // (offline, server error) gets the "unavailable" reply with a way to reach a person.
      const specific = e instanceof ApiError && e.kind === "rejected";
      setMessages((prev) => [
        ...prev,
        specific
          ? { role: "assistant", content: (e as ApiError).message }
          : { role: "assistant", content: UNAVAILABLE_REPLY, contactLink: true },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : Platform.OS === "android" ? "height" : undefined}
      enabled={Platform.OS !== "web"}
      accessibilityViewIsModal={compact}
      aria-label="Trellis chat"
      style={[
        compact ? styles.panelMobile : styles.panelDesktop,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: compact ? 0 : radius.lg },
      ]}
    >
          {/* Status-bar / notch area in the header colour (light status-bar icons sit on it). */}
          {compact && insets.top > 0 ? <View style={{ height: insets.top, backgroundColor: colors.brand }} /> : null}
          <View style={[styles.header, { backgroundColor: colors.brand }]}>
            <SparkleIcon size={16} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 13.5, color: "#FFFFFF" }}>Trellis</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: "rgba(255,255,255,0.72)" }}>
                FarmsClub's assistant
              </Text>
            </View>
            <Pressable onPress={closeChat} hitSlop={8} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close chat">
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: fonts.bodySemiBold }} aria-hidden>×</Text>
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.md, gap: 8 }}
            keyboardShouldPersistTaps="handled"
            accessibilityLiveRegion="polite"
            aria-live="polite"
          >
            {messages.map((m, idx) => (
              <View key={idx} style={{ alignItems: m.role === "user" ? "flex-end" : "flex-start" }}>
                <View
                  style={[
                    styles.bubble,
                    {
                      borderRadius: radius.md,
                      backgroundColor: m.role === "user" ? colors.brand : colors.brandSoft,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 12.5,
                      lineHeight: 18,
                      color: m.role === "user" ? "#FFFFFF" : colors.ink,
                    }}
                  >
                    {m.content}
                  </Text>
                  {m.contactLink ? (
                    <Link
                      href="/contact"
                      onPress={closeChat}
                      style={{ fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: colors.brand, marginTop: 6, textDecorationLine: "underline" }}
                    >
                      Go to the Enquire page →
                    </Link>
                  ) : null}
                </View>
              </View>
            ))}
            {sending && (
              <View style={{ alignItems: "flex-start" }}>
                <View style={[styles.bubble, { borderRadius: radius.md, backgroundColor: colors.brandSoft, flexDirection: "row", gap: 6, alignItems: "center" }]}>
                  <ActivityIndicator size="small" color={colors.brand} />
                  <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft }}>Thinking…</Text>
                </View>
              </View>
            )}
            {!sending && suggestions.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {suggestions.map((q) => (
                  <Pressable
                    key={q}
                    onPress={() => send(q)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ask: ${q}`}
                    style={[styles.suggestion, { borderColor: colors.border, borderRadius: radius.sm }]}
                  >
                    <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft }}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputRow, { borderTopColor: colors.border, paddingBottom: compact ? 10 + insets.bottom : 10 }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about farms, bulk supply, delivery…"
              placeholderTextColor={colors.inkFaint}
              editable={!sending}
              maxLength={500}
              onSubmitEditing={() => send()}
              returnKeyType="send"
              accessibilityLabel="Message Trellis"
              style={[styles.input, { borderColor: colors.border, borderRadius: 999, color: colors.ink }]}
            />
            <Pressable
              onPress={() => send()}
              disabled={sending || !input.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: sending || !input.trim() }}
              style={[styles.sendBtn, { backgroundColor: colors.brand, borderRadius: 999, opacity: sending || !input.trim() ? 0.4 : 1 }]}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: fonts.bodySemiBold }} aria-hidden>→</Text>
            </Pressable>
          </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  panelDesktop: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 360,
    height: 480,
    maxHeight: "80%",
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    zIndex: 50,
  },
  panelMobile: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    zIndex: 50,
  },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  closeBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "85%", paddingHorizontal: 12, paddingVertical: 8 },
  suggestion: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, minHeight: 40, justifyContent: "center" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9, fontSize: 13 },
  sendBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
