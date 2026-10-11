import { useRef, useState } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { b2bApi, errorMessage } from "@/lib/api";
import type { B2bListing } from "@/lib/types";

/** Column limits from b2b_leads (V127): names/email 200, city/state 100, pincode 10 (we
 *  enforce the 6-digit Indian format), station 150, GSTIN 20 (we enforce the 15-char format). */
const LIMITS = { name: 200, email: 200, gstin: 15, city: 100, state: 100, pincode: 6, station: 150, address: 1000, phone: 10 };
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PINCODE_RE = /^[1-9]\d{5}$/;
const digitsOnly = (t: string) => t.replace(/\D/g, "");

/** Shared by /rfq/[listingId] (enquiring about one listing) and /contact (a general enquiry,
 *  no listing attached) — same backend call (POST /public/b2b/rfq), same field set per
 *  B2B_Admin_Spec_v1.2 §3, just with `listing`/`listingId` null for the general case. */
export function RfqFormBody({ listing, listingId }: { listing?: B2bListing | null; listingId?: number | null }) {
  const { colors, fonts, spacing, radius } = useTheme();

  const renderedAt = useRef(Date.now());
  const [honeypot, setHoneypot] = useState("");

  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingPincode, setBillingPincode] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [destinationStation, setDestinationStation] = useState("");
  const [quantityInterest, setQuantityInterest] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const stationRequired = !!listing; // a specific-product enquiry needs it to quote transit; a general one doesn't yet
  const moq = listing ? listing.moq ?? listing.bulk_min_quantity ?? null : null;

  // Ship-to is always captured: with "same as billing" ticked it comes from the billing
  // city/state/pincode, otherwise from the separate delivery fields.
  const shipTo = sameAsBilling
    ? { city: billingCity.trim(), state: billingState.trim(), pincode: billingPincode.trim() }
    : { city: deliveryCity.trim(), state: deliveryState.trim(), pincode: deliveryPincode.trim() };

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!contactName.trim()) next.contactName = "Enter your name.";
    if (!/^[6-9]\d{9}$/.test(phone.trim())) next.phone = "Enter a valid 10-digit mobile number.";
    if (email.trim() && !EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (customerGstin.trim() && !GSTIN_RE.test(customerGstin.trim()))
      next.customerGstin = "Enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5).";
    const prefix = sameAsBilling ? "billing" : "delivery";
    if (!shipTo.city) next[`${prefix}City`] = "Enter the city.";
    if (!shipTo.state) next[`${prefix}State`] = "Enter the state.";
    if (!PINCODE_RE.test(shipTo.pincode)) next[`${prefix}Pincode`] = "Enter a valid 6-digit pincode.";
    if (stationRequired && !destinationStation.trim()) next.destinationStation = "Enter the nearest destination railway station.";
    if (listing) {
      const qty = quantityInterest.trim();
      if (!/^\d+$/.test(qty) || Number(qty) <= 0) next.quantityInterest = "Enter the quantity as a whole number.";
      else if (moq != null && Number(qty) < moq) next.quantityInterest = `Minimum order quantity is ${moq}.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    if (honeypot) return;
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const billingAddressFinal = [billingAddress.trim(), notes.trim() ? `Notes: ${notes.trim()}` : ""]
        .filter(Boolean)
        .join("\n");
      const id = await b2bApi.submitRfq({
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        customerGstin: customerGstin.trim() || undefined,
        billingName: billingName.trim() || undefined,
        billingAddress: billingAddressFinal || undefined,
        deliverySameAsBilling: sameAsBilling,
        deliveryCity: shipTo.city,
        deliveryState: shipTo.state,
        deliveryPincode: shipTo.pincode,
        destinationRailwayStation: destinationStation.trim() || undefined,
        listingId: listingId ?? listing?.id,
        quantityInterest: listing && quantityInterest.trim() ? Number(quantityInterest.trim()) : undefined,
        honeypot,
        formRenderedAt: renderedAt.current,
      });
      setSubmittedId(id);
    } catch (e) {
      setSubmitError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedId) {
    return (
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
    );
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <TextInput
        value={honeypot}
        onChangeText={setHoneypot}
        style={styles.honeypot}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        tabIndex={-1}
      />

      <FormSection title="Contact">
        <TextField label="Your name" value={contactName} onChangeText={setContactName} required error={errors.contactName} maxLength={LIMITS.name} />
        <TextField
          label="Mobile number"
          value={phone}
          onChangeText={(t) => setPhone(digitsOnly(t))}
          required
          keyboardType="phone-pad"
          error={errors.phone}
          maxLength={LIMITS.phone}
          placeholder="10-digit mobile number"
        />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          maxLength={LIMITS.email}
        />
      </FormSection>

      <FormSection title="Billing">
        <TextField
          label="GSTIN"
          value={customerGstin}
          onChangeText={(t) => setCustomerGstin(t.toUpperCase().replace(/[^0-9A-Z]/g, ""))}
          placeholder="Optional — 15-character GSTIN"
          autoCapitalize="characters"
          error={errors.customerGstin}
          maxLength={LIMITS.gstin}
        />
        <TextField label="Billing / company name" value={billingName} onChangeText={setBillingName} maxLength={LIMITS.name} />
        <TextField label="Billing address" value={billingAddress} onChangeText={setBillingAddress} multiline maxLength={LIMITS.address} />
        <TextField label="City" value={billingCity} onChangeText={setBillingCity} required={sameAsBilling} error={errors.billingCity} maxLength={LIMITS.city} />
        <TextField label="State" value={billingState} onChangeText={setBillingState} required={sameAsBilling} error={errors.billingState} maxLength={LIMITS.state} />
        <TextField
          label="Pincode"
          value={billingPincode}
          onChangeText={(t) => setBillingPincode(digitsOnly(t))}
          required={sameAsBilling}
          keyboardType="number-pad"
          error={errors.billingPincode}
          maxLength={LIMITS.pincode}
        />
      </FormSection>

      <FormSection title="Delivery">
        <Pressable onPress={() => setSameAsBilling((v) => !v)} style={styles.checkboxRow} hitSlop={6}>
          <View style={[styles.checkbox, { borderColor: colors.borderStrong, backgroundColor: sameAsBilling ? colors.brand : "transparent" }]}>
            {sameAsBilling && <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>}
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>Delivery same as billing address</Text>
        </Pressable>

        {!sameAsBilling && (
          <>
            <TextField label="Delivery city" value={deliveryCity} onChangeText={setDeliveryCity} required error={errors.deliveryCity} maxLength={LIMITS.city} />
            <TextField label="Delivery state" value={deliveryState} onChangeText={setDeliveryState} required error={errors.deliveryState} maxLength={LIMITS.state} />
            <TextField
              label="Delivery pincode"
              value={deliveryPincode}
              onChangeText={(t) => setDeliveryPincode(digitsOnly(t))}
              required
              keyboardType="number-pad"
              error={errors.deliveryPincode}
              maxLength={LIMITS.pincode}
            />
          </>
        )}

        <TextField
          label="Nearest destination railway station"
          value={destinationStation}
          onChangeText={setDestinationStation}
          required={stationRequired}
          error={errors.destinationStation}
          maxLength={LIMITS.station}
          placeholder={stationRequired ? "Needed so we can quote transit time" : "If known — helps us quote transit time"}
        />
      </FormSection>

      <FormSection title="Requirement">
        {listing ? (
          <TextField
            label={`Quantity interested in (${listing.unit ?? listing.bulk_unit ?? "units"})`}
            value={quantityInterest}
            onChangeText={(t) => setQuantityInterest(digitsOnly(t))}
            keyboardType="number-pad"
            required
            error={errors.quantityInterest}
            maxLength={9}
            placeholder={moq != null ? `MOQ is ${moq}` : undefined}
          />
        ) : (
          <TextField label="What are you looking to source?" value={notes} onChangeText={setNotes} multiline maxLength={LIMITS.address} placeholder="Product, approximate quantity, and timeline" />
        )}
      </FormSection>

      {submitError ? <Text style={{ fontFamily: fonts.body, color: colors.danger, fontSize: 13 }}>{submitError}</Text> : null}

      <Button label="Submit enquiry" fullWidth loading={submitting} onPress={submit} />
      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkFaint, textAlign: "center" }}>
        Your phone and billing details are only ever seen by Formulate India's trade desk.
      </Text>
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
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32 },
  successBadge: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  honeypot: { position: "absolute", width: 1, height: 1, opacity: 0, left: -9999 },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: "center", justifyContent: "center" },
});
