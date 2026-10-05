import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { Header } from "@/components/Header";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/StateViews";
import { b2bApi, ApiError } from "@/lib/api";
import type { B2bListing } from "@/lib/types";

export default function RfqForm() {
  const { colors, fonts, spacing, radius } = useTheme();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();

  const [listing, setListing] = useState<B2bListing | null>(null);
  useEffect(() => {
    if (listingId) b2bApi.getListing(Number(listingId)).then(setListing).catch(() => {});
  }, [listingId]);

  const renderedAt = useRef(Date.now());
  const [honeypot, setHoneypot] = useState(""); // must stay empty — a filled value means a bot

  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [destinationStation, setDestinationStation] = useState("");
  const [quantityInterest, setQuantityInterest] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!contactName.trim()) next.contactName = "Enter your name.";
    if (!/^[6-9]\d{9}$/.test(phone.trim())) next.phone = "Enter a valid 10-digit mobile number.";
    if (!destinationStation.trim()) next.destinationStation = "Enter the nearest destination railway station.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (honeypot) return; // silently drop — bot filled the hidden field
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const id = await b2bApi.submitRfq({
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        customerGstin: customerGstin.trim() || undefined,
        billingName: billingName.trim() || undefined,
        billingAddress: billingAddress.trim() || undefined,
        deliverySameAsBilling: sameAsBilling,
        deliveryCity: sameAsBilling ? undefined : deliveryCity.trim() || undefined,
        deliveryState: sameAsBilling ? undefined : deliveryState.trim() || undefined,
        deliveryPincode: sameAsBilling ? undefined : deliveryPincode.trim() || undefined,
        destinationRailwayStation: destinationStation.trim(),
        listingId: listingId ? Number(listingId) : undefined,
        quantityInterest: quantityInterest ? Number(quantityInterest) : undefined,
        honeypot,
        formRenderedAt: renderedAt.current,
      });
      setSubmittedId(id);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Couldn't submit your enquiry — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedId) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <Header />
        <View style={styles.center}>
          <View style={[styles.successBadge, { backgroundColor: colors.successSoft, borderRadius: radius.pill }]}>
            <Text style={{ fontFamily: fonts.heading, color: colors.success }}>✓</Text>
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink, marginTop: spacing.lg, textAlign: "center" }}>
            Enquiry received
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginTop: 8, textAlign: "center", maxWidth: 360 }}>
            Reference #{submittedId}. Our trade desk will review it and get back to you on the number you
            provided — usually within one business day.
          </Text>
          <View style={{ marginTop: spacing.xl }}>
            <Button label="Back to catalogue" onPress={() => router.push("/listings")} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Header />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg }}>
        <View>
          <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>Request a quote</Text>
          {listing ? (
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 4 }}>
              For: {listing.title}
            </Text>
          ) : (
            <LoadingState label="" />
          )}
        </View>

        {/* Honeypot — visually hidden, never filled by a human. AntiSpamGuard rejects if set. */}
        <TextInput
          value={honeypot}
          onChangeText={setHoneypot}
          style={styles.honeypot}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          tabIndex={-1}
        />

        <FormSection title="Contact">
          <TextField label="Your name" value={contactName} onChangeText={setContactName} required error={errors.contactName} />
          <TextField label="Mobile number" value={phone} onChangeText={setPhone} required keyboardType="phone-pad" error={errors.phone} />
          <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        </FormSection>

        <FormSection title="Billing">
          <TextField label="GSTIN" value={customerGstin} onChangeText={setCustomerGstin} placeholder="Optional — auto-fills your legal name" />
          <TextField label="Billing / company name" value={billingName} onChangeText={setBillingName} />
          <TextField label="Billing address" value={billingAddress} onChangeText={setBillingAddress} multiline />
        </FormSection>

        <FormSection title="Delivery">
          <Pressable
            onPress={() => setSameAsBilling((v) => !v)}
            style={styles.checkboxRow}
            hitSlop={6}
          >
            <View
              style={[
                styles.checkbox,
                { borderColor: colors.borderStrong, backgroundColor: sameAsBilling ? colors.brand : "transparent" },
              ]}
            >
              {sameAsBilling && <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>}
            </View>
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>Delivery same as billing address</Text>
          </Pressable>

          {!sameAsBilling && (
            <>
              <TextField label="Delivery city" value={deliveryCity} onChangeText={setDeliveryCity} />
              <TextField label="Delivery state" value={deliveryState} onChangeText={setDeliveryState} />
              <TextField label="Delivery pincode" value={deliveryPincode} onChangeText={setDeliveryPincode} keyboardType="number-pad" />
            </>
          )}

          <TextField
            label="Nearest destination railway station"
            value={destinationStation}
            onChangeText={setDestinationStation}
            required
            error={errors.destinationStation}
            placeholder="Needed so the seller can quote transit time"
          />
        </FormSection>

        <FormSection title="Requirement">
          <TextField
            label={`Quantity interested in${listing ? ` (${listing.unit})` : ""}`}
            value={quantityInterest}
            onChangeText={setQuantityInterest}
            keyboardType="number-pad"
            placeholder={listing?.moq ? `MOQ is ${listing.moq}` : undefined}
          />
        </FormSection>

        {submitError ? (
          <Text style={{ fontFamily: fonts.body, color: colors.danger, fontSize: 13 }}>{submitError}</Text>
        ) : null}

        <Button label="Submit enquiry" fullWidth loading={submitting} onPress={submit} />
        <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint, textAlign: "center" }}>
          Your phone and billing details are only ever seen by Formulate India's trade desk.
        </Text>
      </ScrollView>
    </View>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: colors.inkFaint }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  successBadge: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  honeypot: { position: "absolute", width: 1, height: 1, opacity: 0, left: -9999 },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: "center", justifyContent: "center" },
});
