import { useEffect, useRef, useState, type RefObject } from "react";
import { View, Text, Pressable, TextInput, StyleSheet, Platform, type ScrollView } from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@/constants/theme-context";
import { TextField } from "./TextField";
import { Button } from "./Button";
import { b2bApi, errorMessage } from "@/lib/api";
import { formatQty, formatQtyWithUnit, normalizeIndianMobile } from "@/lib/format";
import type { B2bListing } from "@/lib/types";

const LIMITS = { name: 200, email: 200, gstin: 15, city: 100, state: 100, pincode: 6, station: 150, address: 1000, notes: 1000, phone: 16 };
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PINCODE_RE = /^[1-9]\d{5}$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const digitsOnly = (t: string) => t.replace(/\D/g, "");
const phoneChars = (t: string) => t.replace(/[^\d+\s()-]/g, "");

const HONEYPOT_ERROR = "We couldn't send your enquiry. Please refresh the page and try again.";
const DEFAULT_SUCCESS = "Your enquiry has been received — our team will get back to you shortly.";

type FieldKey =
  | "contactName"
  | "phone"
  | "email"
  | "customerGstin"
  | "billingName"
  | "billingAddress"
  | "billingCity"
  | "billingState"
  | "billingPincode"
  | "deliveryCity"
  | "deliveryState"
  | "deliveryPincode"
  | "destinationStation"
  | "quantityInterest"
  | "notes";

const FIELD_ORDER: FieldKey[] = [
  "contactName", "phone", "email", "customerGstin", "billingName", "billingAddress", "billingCity", "billingState",
  "billingPincode", "deliveryCity", "deliveryState", "deliveryPincode", "destinationStation", "quantityInterest", "notes",
];

const FIELD_LABELS: Record<FieldKey, string> = {
  contactName: "Your name",
  phone: "Mobile number",
  email: "Email",
  customerGstin: "GSTIN",
  billingName: "Billing / company name",
  billingAddress: "Billing address",
  billingCity: "City",
  billingState: "State",
  billingPincode: "Pincode",
  deliveryCity: "Delivery city",
  deliveryState: "Delivery state",
  deliveryPincode: "Delivery pincode",
  destinationStation: "Destination railway station",
  quantityInterest: "Quantity",
  notes: "Requirement",
};

export function RfqFormBody({
  listing,
  listingId,
  scrollRef,
  initialNotes,
  initialQuantity,
}: {
  listing?: B2bListing | null;
  listingId?: number | null;
  initialNotes?: string;
  initialQuantity?: string | number;
  scrollRef?: RefObject<ScrollView | null>;
}) {
  const { colors, fonts, spacing, radius } = useTheme();

  const renderedAt = useRef(Date.now());
  const submittingRef = useRef(false);
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
  const [quantityInterest, setQuantityInterest] = useState(initialQuantity ? String(initialQuantity).replace(/\D/g, "") : "");
  const [notes, setNotes] = useState(initialNotes ?? "");

  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const formY = useRef(0);
  const sectionY = useRef<Record<string, number>>({});
  const fieldPos = useRef<Partial<Record<FieldKey, { section: string; y: number }>>>({});
  const inputRefs = useRef<Partial<Record<FieldKey, TextInput | null>>>({});

  useEffect(() => {
    b2bApi.trackRfqOpen(listingId ?? listing?.id ?? null);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialQuantity) {
      const cleaned = String(initialQuantity).replace(/\D/g, "");
      if (cleaned) setQuantityInterest(cleaned);
    }
  }, [initialQuantity]);

  const isListing = !!listing;
  const stationRequired = isListing;
  const moq = listing ? listing.moq ?? listing.bulk_min_quantity ?? null : null;
  const unit = listing ? listing.unit ?? listing.bulk_unit ?? null : null;

  const shipTo = sameAsBilling
    ? { city: billingCity.trim(), state: billingState.trim(), pincode: billingPincode.trim() }
    : { city: deliveryCity.trim(), state: deliveryState.trim(), pincode: deliveryPincode.trim() };

  function validate(): Partial<Record<FieldKey, string>> {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!contactName.trim()) next.contactName = "Enter your name.";
    if (!MOBILE_RE.test(normalizeIndianMobile(phone))) next.phone = "Enter a valid 10-digit Indian mobile number.";
    if (email.trim() && !EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address.";
    if (customerGstin.trim() && !GSTIN_RE.test(customerGstin.trim()))
      next.customerGstin = "Enter a valid 15-character GSTIN (e.g. 27ABCDE1234F1Z5).";
    if (sameAsBilling) {
      if (!billingCity.trim()) next.billingCity = "Enter the city.";
      if (!billingState.trim()) next.billingState = "Enter the state.";
      if (!PINCODE_RE.test(billingPincode.trim())) next.billingPincode = "Enter a valid 6-digit pincode.";
    } else {
      if (billingPincode.trim() && !PINCODE_RE.test(billingPincode.trim())) next.billingPincode = "Enter a valid 6-digit pincode.";
      if (!deliveryCity.trim()) next.deliveryCity = "Enter the city.";
      if (!deliveryState.trim()) next.deliveryState = "Enter the state.";
      if (!PINCODE_RE.test(deliveryPincode.trim())) next.deliveryPincode = "Enter a valid 6-digit pincode.";
    }
    if (stationRequired && !destinationStation.trim()) next.destinationStation = "Enter the nearest destination railway station.";
    if (isListing) {
      const qty = quantityInterest.trim();
      if (!/^\d+$/.test(qty) || Number(qty) <= 0) next.quantityInterest = "Enter the quantity as a whole number.";
      else if (moq != null && Number(qty) < moq) next.quantityInterest = `The minimum order quantity is ${formatQtyWithUnit(moq, unit)}.`;
    } else if (!notes.trim()) {
      next.notes = "Tell us what you're looking to source.";
    }
    return next;
  }

  function scrollToField(key: FieldKey) {
    const pos = fieldPos.current[key];
    if (pos && scrollRef?.current) {
      const y = formY.current + (sectionY.current[pos.section] ?? 0) + pos.y - 24;
      scrollRef.current.scrollTo({ y: Math.max(0, y), animated: true });
    }
    setTimeout(() => inputRefs.current[key]?.focus(), Platform.OS === "web" ? 0 : 250);
  }

  function composedBillingAddress(): string | undefined {
    const place = [billingCity.trim(), billingState.trim()].filter(Boolean).join(", ");
    const pin = billingPincode.trim();
    const lastLine = [place, pin].filter(Boolean).join(" - ");
    const full = [billingAddress.trim(), lastLine].filter(Boolean).join("\n");
    return full ? full.slice(0, LIMITS.address) : undefined;
  }

  async function submit() {
    if (submittingRef.current) return;
    setSubmitError(null);
    if (honeypot) {
      setSubmitError(HONEYPOT_ERROR);
      return;
    }
    const found = validate();
    setErrors(found);
    const first = FIELD_ORDER.find((k) => found[k]);
    if (first) {
      scrollToField(first);
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result = await b2bApi.submitRfq({
        contactName: contactName.trim(),
        phone: normalizeIndianMobile(phone),
        email: email.trim() || undefined,
        customerGstin: customerGstin.trim() || undefined,
        billingName: billingName.trim() || undefined,
        billingAddress: composedBillingAddress(),
        deliverySameAsBilling: sameAsBilling,
        deliveryCity: shipTo.city,
        deliveryState: shipTo.state,
        deliveryPincode: shipTo.pincode,
        destinationRailwayStation: destinationStation.trim() || undefined,
        listingId: listingId ?? listing?.id,
        quantityInterest: isListing && quantityInterest.trim() ? Number(quantityInterest.trim()) : undefined,
        notes: notes.trim() || undefined,
        originUrl: typeof window !== "undefined" && window.location?.href?.startsWith("http") ? window.location.href : undefined,
        honeypot,
        formRenderedAt: renderedAt.current,
        formElapsedMs: Math.max(0, Date.now() - renderedAt.current),
      });
      setSuccessMessage(result.message ?? DEFAULT_SUCCESS);
      scrollRef?.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      setSubmitError(errorMessage(e));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (successMessage) {
    const updated = /updated/i.test(successMessage);
    return (
      <View style={styles.center} accessibilityLiveRegion="polite" aria-live="polite">
        <View style={[styles.successBadge, { backgroundColor: colors.successSoft, borderRadius: radius.pill }]} aria-hidden>
          <Text style={{ fontFamily: fonts.heading, fontSize: 22, color: colors.success }}>✓</Text>
        </View>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginTop: spacing.lg, textAlign: "center" }}>
          {updated ? "Enquiry updated" : "Enquiry received"}
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14.5, color: colors.inkSoft, marginTop: 8, textAlign: "center", maxWidth: 400, lineHeight: 21 }}>
          {successMessage}
        </Text>
        <View style={{ marginTop: spacing.xl }}>
          <Link href="/listings" asChild>
            <Button label="Back to bulk supply" />
          </Link>
        </View>
      </View>
    );
  }

  const errorKeys = FIELD_ORDER.filter((k) => errors[k]);
  const field = (key: FieldKey, section: string) => ({
    id: `rfq-${key}`,
    error: errors[key],
    ref: (r: TextInput | null) => {
      inputRefs.current[key] = r;
    },
    onLayoutWrap: (y: number) => {
      fieldPos.current[key] = { section, y };
    },
  });

  // Quick quantity chips for listing RFQ
  const quickQtys = isListing
    ? (() => {
        const tiers = listing?.tiers ?? [];
        if (tiers.length > 0) {
          return [...new Set(tiers.map((t) => Number(t.minQty)))].slice(0, 4);
        }
        const base = moq && Number(moq) > 0 ? Number(moq) : 100;
        return [base, base * 5, base * 10, base * 25];
      })()
    : [];

  return (
    <View style={{ gap: spacing.lg }} onLayout={(e) => (formY.current = e.nativeEvent.layout.y)}>
      <TextInput
        value={honeypot}
        onChangeText={setHoneypot}
        style={styles.honeypot}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
        autoComplete="off"
        tabIndex={-1}
      />

      {/* Visual 3-Step Procurement Strip */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          backgroundColor: colors.paper,
          padding: 10,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {[
          { step: "01", label: "Buyer & GST" },
          { step: "02", label: "Dispatch & Rail/Road" },
          { step: "03", label: "Volume & Specs" },
        ].map((s) => (
          <View key={s.step} style={{ flex: 1, minWidth: 110, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.brand, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 10, color: "#FFFFFF" }}>{s.step}</Text>
            </View>
            <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.ink }}>{s.label}</Text>
          </View>
        ))}
      </View>

      <FormSection badge="01" title="Contact" onY={(y) => (sectionY.current.contact = y)}>
        <Slot onY={field("contactName", "contact").onLayoutWrap}>
          <TextField label={FIELD_LABELS.contactName} value={contactName} onChangeText={setContactName} required maxLength={LIMITS.name}
            autoComplete="name" textContentType="name" {...pick(field("contactName", "contact"))} />
        </Slot>
        <Slot onY={field("phone", "contact").onLayoutWrap}>
          <TextField
            label={FIELD_LABELS.phone}
            value={phone}
            onChangeText={(t) => setPhone(phoneChars(t))}
            required
            keyboardType="phone-pad"
            inputMode="tel"
            autoComplete="tel"
            textContentType="telephoneNumber"
            maxLength={LIMITS.phone}
            placeholder="10-digit mobile, e.g. 98765 43210"
            {...pick(field("phone", "contact"))}
          />
        </Slot>
        <Slot onY={field("email", "contact").onLayoutWrap}>
          <TextField
            label={FIELD_LABELS.email}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            inputMode="email"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            maxLength={LIMITS.email}
            {...pick(field("email", "contact"))}
          />
        </Slot>
      </FormSection>

      <FormSection badge="02" title="Billing" onY={(y) => (sectionY.current.billing = y)}>
        <Slot onY={field("customerGstin", "billing").onLayoutWrap}>
          <TextField
            label={FIELD_LABELS.customerGstin}
            value={customerGstin}
            onChangeText={(t) => setCustomerGstin(t.toUpperCase().replace(/[^0-9A-Z]/g, ""))}
            placeholder="Optional — 15-character GSTIN"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={LIMITS.gstin}
            {...pick(field("customerGstin", "billing"))}
          />
        </Slot>
        <TextField id="rfq-billingName" label={FIELD_LABELS.billingName} value={billingName} onChangeText={setBillingName} maxLength={LIMITS.name}
          autoComplete="organization" textContentType="organizationName" />
        <TextField id="rfq-billingAddress" label={FIELD_LABELS.billingAddress} value={billingAddress} onChangeText={setBillingAddress} multiline
          maxLength={LIMITS.address} autoComplete="street-address" textContentType="fullStreetAddress" />
        <Slot onY={field("billingCity", "billing").onLayoutWrap}>
          <TextField label={FIELD_LABELS.billingCity} value={billingCity} onChangeText={setBillingCity} required={sameAsBilling} maxLength={LIMITS.city}
            autoComplete="postal-address-locality" textContentType="addressCity" {...pick(field("billingCity", "billing"))} />
        </Slot>
        <Slot onY={field("billingState", "billing").onLayoutWrap}>
          <TextField label={FIELD_LABELS.billingState} value={billingState} onChangeText={setBillingState} required={sameAsBilling} maxLength={LIMITS.state}
            autoComplete="postal-address-region" textContentType="addressState" {...pick(field("billingState", "billing"))} />
        </Slot>
        <Slot onY={field("billingPincode", "billing").onLayoutWrap}>
          <TextField
            label={FIELD_LABELS.billingPincode}
            value={billingPincode}
            onChangeText={(t) => setBillingPincode(digitsOnly(t))}
            required={sameAsBilling}
            keyboardType="number-pad"
            inputMode="numeric"
            autoComplete="postal-code"
            textContentType="postalCode"
            maxLength={LIMITS.pincode}
            {...pick(field("billingPincode", "billing"))}
          />
        </Slot>
      </FormSection>

      <FormSection badge="03" title="Delivery" onY={(y) => (sectionY.current.delivery = y)}>
        <Pressable
          onPress={() => setSameAsBilling((v) => !v)}
          style={styles.checkboxRow}
          hitSlop={6}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: sameAsBilling }}
          aria-checked={sameAsBilling}
          accessibilityLabel="Delivery same as billing address"
        >
          <View style={[styles.checkbox, { borderColor: colors.borderStrong, backgroundColor: sameAsBilling ? colors.brand : "transparent" }]}>
            {sameAsBilling && <Text style={{ color: "#fff", fontSize: 12 }}>✓</Text>}
          </View>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink }}>Delivery same as billing address</Text>
        </Pressable>

        {!sameAsBilling && (
          <>
            <Slot onY={field("deliveryCity", "delivery").onLayoutWrap}>
              <TextField label={FIELD_LABELS.deliveryCity} value={deliveryCity} onChangeText={setDeliveryCity} required maxLength={LIMITS.city}
                textContentType="addressCity" {...pick(field("deliveryCity", "delivery"))} />
            </Slot>
            <Slot onY={field("deliveryState", "delivery").onLayoutWrap}>
              <TextField label={FIELD_LABELS.deliveryState} value={deliveryState} onChangeText={setDeliveryState} required maxLength={LIMITS.state}
                textContentType="addressState" {...pick(field("deliveryState", "delivery"))} />
            </Slot>
            <Slot onY={field("deliveryPincode", "delivery").onLayoutWrap}>
              <TextField
                label={FIELD_LABELS.deliveryPincode}
                value={deliveryPincode}
                onChangeText={(t) => setDeliveryPincode(digitsOnly(t))}
                required
                keyboardType="number-pad"
                inputMode="numeric"
                textContentType="postalCode"
                maxLength={LIMITS.pincode}
                {...pick(field("deliveryPincode", "delivery"))}
              />
            </Slot>
          </>
        )}

        <Slot onY={field("destinationStation", "delivery").onLayoutWrap}>
          <TextField
            label="Nearest destination railway station"
            value={destinationStation}
            onChangeText={setDestinationStation}
            required={stationRequired}
            maxLength={LIMITS.station}
            placeholder={stationRequired ? "Needed so we can quote transit time" : "If known — helps us quote transit time"}
            {...pick(field("destinationStation", "delivery"))}
          />
        </Slot>
      </FormSection>

      <FormSection badge="04" title="Requirement" onY={(y) => (sectionY.current.requirement = y)}>
        {isListing ? (
          <>
            {quickQtys.length > 0 ? (
              <View style={{ gap: 6 }}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.inkSoft }}>
                  Quick Volume Presets:
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  {quickQtys.map((q) => {
                    const active = quantityInterest === String(q);
                    return (
                      <Pressable
                        key={q}
                        onPress={() => setQuantityInterest(String(q))}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: radius.pill,
                          backgroundColor: active ? colors.brand : colors.paper,
                          borderWidth: 1,
                          borderColor: active ? colors.brand : colors.border,
                        }}
                      >
                        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12.5, color: active ? "#FFFFFF" : colors.ink }}>
                          {formatQty(q)} {unit ?? "units"}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <Slot onY={field("quantityInterest", "requirement").onLayoutWrap}>
              <TextField
                label={`Quantity interested in (${unit ?? "units"})`}
                value={quantityInterest}
                onChangeText={(t) => setQuantityInterest(digitsOnly(t))}
                keyboardType="number-pad"
                inputMode="numeric"
                required
                maxLength={9}
                placeholder={moq != null ? `Minimum ${formatQtyWithUnit(moq, unit)}` : undefined}
                {...pick(field("quantityInterest", "requirement"))}
              />
            </Slot>
            <Slot onY={field("notes", "requirement").onLayoutWrap}>
              <TextField
                label="Anything else we should know?"
                value={notes}
                onChangeText={setNotes}
                multiline
                maxLength={LIMITS.notes}
                placeholder="Optional — grade, packing, delivery timeline…"
                {...pick(field("notes", "requirement"))}
              />
            </Slot>
          </>
        ) : (
          <Slot onY={field("notes", "requirement").onLayoutWrap}>
            <TextField
              label="What are you looking to source?"
              value={notes}
              onChangeText={setNotes}
              multiline
              required
              maxLength={LIMITS.notes}
              placeholder="Product, approximate quantity, and timeline"
              {...pick(field("notes", "requirement"))}
            />
          </Slot>
        )}
      </FormSection>

      {errorKeys.length > 0 ? (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          aria-live="polite"
          style={{ backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md }}
        >
          <Text style={{ fontFamily: fonts.bodySemiBold, color: colors.danger, fontSize: 13 }}>
            Please check {errorKeys.length === 1 ? "this field" : `these ${errorKeys.length} fields`}:{" "}
            <Text style={{ fontFamily: fonts.body }}>{errorKeys.map((k) => FIELD_LABELS[k]).join(", ")}.</Text>
          </Text>
        </View>
      ) : null}
      {submitError ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" aria-live="polite" style={{ fontFamily: fonts.body, color: colors.danger, fontSize: 13 }}>
          {submitError}
        </Text>
      ) : null}

      <Button label="Submit bulk enquiry →" fullWidth loading={submitting} onPress={submit} />
      <Text style={{ fontFamily: fonts.body, fontSize: 11.5, color: colors.inkSoft, textAlign: "center" }}>
        🔒 Handled confidentially by the FarmsClub B2B Trade Desk.
      </Text>
    </View>
  );
}

function pick(f: { id: string; error?: string; ref: (r: TextInput | null) => void }) {
  return { id: f.id, error: f.error, ref: f.ref };
}

function Slot({ onY, children }: { onY: (y: number) => void; children: React.ReactNode }) {
  return <View onLayout={(e) => onY(e.nativeEvent.layout.y)}>{children}</View>;
}

function FormSection({ badge, title, children, onY }: { badge: string; title: string; children: React.ReactNode; onY: (y: number) => void }) {
  const { colors, fonts, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }} onLayout={(e) => onY(e.nativeEvent.layout.y)}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 }}>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: colors.accentDark }}>{badge}</Text>
        <Text accessibilityRole="header" style={{ fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.7, textTransform: "uppercase", color: colors.inkSoft }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 32 },
  successBadge: { width: 56, height: 56, alignItems: "center", justifyContent: "center" },
  honeypot: { position: "absolute", width: 1, height: 1, opacity: 0, left: -9999 },
  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44 },
  checkbox: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: "center", justifyContent: "center" },
});
