import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "@/constants/theme-context";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { Honeypot } from "@/components/Honeypot";
import { Turnstile } from "@/components/Turnstile";
import { useBotFields } from "@/lib/useBotFields";
import { fcApi, errorMessage } from "@/lib/api";
import { normalizeIndianMobile } from "@/lib/format";
import type { FarmEnquiryInterest } from "@/lib/types";

const MOBILE_RE = /^[6-9]\d{9}$/;
const INTERESTS: { value: FarmEnquiryInterest; label: string }[] = [
  { value: "visit", label: "Visit" },
  { value: "training", label: "Training" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];
const DEFAULT_SUCCESS = "Thank you. The FarmsClub team will get back to you soon.";

type Errors = Partial<Record<"name" | "mobile" | "message", string>>;

/**
 * "Ask about this farm" (Storefront §6 block 11) — shown when the farm has no WhatsApp button.
 * Creates a Farm enquiry for the FarmsClub team; the farm's own contact details are never shown.
 */
export function FarmEnquiryForm({ slug, farmName }: { slug: string; farmName: string }) {
  const { colors, fonts, spacing, radius } = useTheme();
  const bot = useBotFields();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [interest, setInterest] = useState<FarmEnquiryInterest | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const sendingRef = useRef(false);

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim()) e.name = "Enter your name.";
    if (!MOBILE_RE.test(normalizeIndianMobile(mobile))) e.mobile = "Enter a valid 10-digit Indian mobile number.";
    if (!message.trim()) e.message = "Tell us what you'd like to know.";
    return e;
  }

  async function submit() {
    if (sendingRef.current) return;
    setSubmitError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const res = await fcApi.enquireFarm({
        farm_slug: slug,
        name: name.trim(),
        mobile: normalizeIndianMobile(mobile),
        message: message.trim(),
        interest: interest ?? "other",
        ...bot.fields(),
      });
      setDone(res.message ?? DEFAULT_SUCCESS);
    } catch (err) {
      setSubmitError(errorMessage(err));
      bot.reset();
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  if (done) {
    return (
      <View accessibilityLiveRegion="polite" aria-live="polite" style={{ backgroundColor: colors.successSoft, borderRadius: radius.md, padding: spacing.lg, gap: 6 }}>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.heading, fontSize: 16, color: colors.success }}>
          ✓ Enquiry sent
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, lineHeight: 20 }}>{done}</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      <Honeypot value={bot.hp} onChangeText={bot.setHp} />
      <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 }}>
        Your question goes to the FarmsClub team, who will get back to you about {farmName}.
      </Text>
      <TextField id="farm-enq-name" label="Your name" value={name} onChangeText={setName} required maxLength={160} autoComplete="name" error={errors.name} />
      <TextField
        id="farm-enq-mobile"
        label="Mobile number"
        value={mobile}
        onChangeText={(t) => setMobile(t.replace(/[^\d+\s()-]/g, ""))}
        required
        keyboardType="phone-pad"
        inputMode="tel"
        autoComplete="tel"
        maxLength={16}
        placeholder="10-digit mobile, e.g. 98765 43210"
        error={errors.mobile}
      />
      <View style={{ gap: 6 }}>
        <Text nativeID="farm-enq-interest" style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink }}>
          I'm interested in
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }} accessibilityRole="radiogroup" accessibilityLabel="I'm interested in">
          {INTERESTS.map((o) => {
            const active = interest === o.value;
            return (
              <Pressable
                key={o.value}
                onPress={() => setInterest(active ? null : o.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                aria-checked={active}
                accessibilityLabel={o.label}
                style={{
                  minHeight: 44,
                  paddingHorizontal: spacing.lg,
                  justifyContent: "center",
                  borderRadius: radius.pill,
                  borderWidth: 1,
                  borderColor: active ? colors.brand : colors.border,
                  backgroundColor: active ? colors.brand : colors.surface,
                }}
              >
                <Text style={{ fontFamily: active ? fonts.bodySemiBold : fonts.bodyMedium, fontSize: 14, color: active ? "#FFFFFF" : colors.ink }}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <TextField
        id="farm-enq-message"
        label="Your message"
        value={message}
        onChangeText={setMessage}
        required
        multiline
        maxLength={1000}
        placeholder="What would you like to know about this farm?"
        error={errors.message}
      />
      <Turnstile onToken={bot.setToken} resetKey={bot.resetKey} />
      {submitError ? (
        <Text accessibilityRole="alert" aria-live="polite" style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger }}>
          {submitError}
        </Text>
      ) : null}
      <Button label="Send enquiry" fullWidth loading={sending} disabled={!bot.ready} onPress={submit} />
      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, textAlign: "center" }}>
        Your details are only seen by the FarmsClub team.
      </Text>
    </View>
  );
}
