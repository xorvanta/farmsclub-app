import { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/constants/theme-context";
import { useChat, CHAT_COMPACT_WIDTH } from "@/lib/chat-context";
import { SparkleIcon } from "@/components/graphics/SparkleIcon";
import { b2bApi, ApiError } from "@/lib/api";
import type { ChatTurn } from "@/lib/types";

const GREETING = "Hi! I'm Trellis, FarmsClub's sourcing assistant — ask me about bulk pricing, MOQs, the RFQ process, delivery, or GST invoicing.";

const DEFAULT_SUGGESTIONS = [
  "How does bulk pricing work?",
  "How do I actually place an order?",
  "Do you deliver pan-India?",
  "Will I get a GST invoice?",
];

/** Mounted once at the root layout (see app/_layout.tsx) so a conversation survives navigation
 *  — a lightweight RN counterpart to the retail storefront's StorefrontAiChatWidget, same
 *  backend-architecture idea (real admin FAQ content first, AI model only for open-ended
 *  questions — see B2bChatService), separate persona/name ("Trellis") and knowledge base.
 *
 *  No floating bubble on mobile — MobileBottomNav's "Trellis" tab is the entry point there
 *  (same retail convention: the floating chat button was retired once a bottom-nav tab existed,
 *  so there's exactly one trigger per breakpoint). Desktop still gets the floating panel,
 *  triggered from AnnouncementBar's "Ask Trellis" link instead. */
export function ChatWidget() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { isOpen, listingContext, closeChat } = useChat();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < CHAT_COMPACT_WIDTH;
  const [messages, setMessages] = useState<ChatTurn[]>([{ role: "assistant", content: GREETING }]);
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
          if (!faq.question || seen.has(faq.category)) continue;
          seen.add(faq.category);
          picked.push(faq.question);
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

  async function send(override?: string) {
    const text = (override ?? input).trim();
    if (!text || sending) return;
    if (override) setSuggestions((prev) => prev.filter((q) => q !== override));
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const result = await b2bApi.askChat({
        message: text,
        history: next.slice(-8),
        listingContext: listingContext ?? undefined,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            e instanceof ApiError
              ? e.message
              : "Our chat assistant is temporarily unavailable right now. Please try again shortly, or use the Contact page.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <View
      style={[
        compact ? styles.panelMobile : styles.panelDesktop,
        compact && { paddingTop: insets.top },
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: compact ? 0 : radius.lg },
      ]}
    >
          <View style={[styles.header, { backgroundColor: colors.brand }]}>
            <SparkleIcon size={16} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={{ fontFamily: fonts.heading, fontSize: 13.5, color: "#FFFFFF" }}>Trellis</Text>
              <Text style={{ fontFamily: fonts.body, fontSize: 10.5, color: "rgba(255,255,255,0.72)" }}>
                FarmsClub's sourcing assistant
              </Text>
            </View>
            <Pressable onPress={closeChat} hitSlop={8} style={styles.closeBtn}>
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: fonts.bodySemiBold }}>×</Text>
            </Pressable>
          </View>

          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.md, gap: 8 }}>
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
              placeholder="Ask about pricing, RFQs, delivery…"
              placeholderTextColor={colors.inkFaint}
              editable={!sending}
              maxLength={500}
              onSubmitEditing={() => send()}
              style={[styles.input, { borderColor: colors.border, borderRadius: 999, color: colors.ink }]}
            />
            <Pressable
              onPress={() => send()}
              disabled={sending || !input.trim()}
              style={[styles.sendBtn, { backgroundColor: colors.brand, borderRadius: 999, opacity: sending || !input.trim() ? 0.4 : 1 }]}
            >
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontFamily: fonts.bodySemiBold }}>→</Text>
            </Pressable>
          </View>
    </View>
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
  closeBtn: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  bubble: { maxWidth: "85%", paddingHorizontal: 12, paddingVertical: 8 },
  suggestion: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9, fontSize: 13 },
  sendBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});
