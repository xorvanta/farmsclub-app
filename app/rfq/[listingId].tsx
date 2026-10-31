import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, type ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useLocalSearchParams } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { RfqFormBody } from "@/components/RfqFormBody";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { Button } from "@/components/Button";
import { b2bApi, errorMessage, isAvailableListing, isNotFound, parseListingId } from "@/lib/api";
import { listingMoqLabel, listingPriceLabel, showsGst } from "@/lib/listing";
import type { B2bListing } from "@/lib/types";

export default function RfqForScreen() {
  const { spacing, colors, radius, fonts } = useTheme();
  const { listingId: rawId, qty: rawQty } = useLocalSearchParams<{ listingId: string; qty?: string }>();
  const listingId = parseListingId(rawId);
  const prefillQty = Array.isArray(rawQty) ? rawQty[0] : rawQty;
  const scrollRef = useRef<ScrollView>(null);

  const [listing, setListing] = useState<B2bListing | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<{ title: string | null } | null>(null);

  const load = useCallback(() => {
    setError(null);
    setUnavailable(null);
    setListing(null);
    if (listingId == null) {
      setUnavailable({ title: null });
      return setLoaded(true);
    }
    setLoaded(false);
    b2bApi
      .getListing(listingId)
      .then((l) => (isAvailableListing(l) ? setListing(l) : setUnavailable({ title: l?.title ?? null })))
      .catch((e) => (isNotFound(e) ? setUnavailable({ title: null }) : setError(errorMessage(e))))
      .finally(() => setLoaded(true));
  }, [listingId]);

  useEffect(() => load(), [load]);

  const idPending = rawId === undefined || rawId === "" || rawId === "[listingId]";

  let body: React.ReactNode;
  if (idPending || !loaded) {
    body = <LoadingState label="Loading…" />;
  } else if (unavailable) {
    body = (
      <View style={{ gap: spacing.lg }}>
        <View style={{ gap: 6 }}>
          <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>
            This item is currently not available
          </Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 20 }}>
            Tell us what you need and the FarmsClub team will get back to you.
          </Text>
        </View>
        <RfqFormBody listing={null} listingId={null} scrollRef={scrollRef} initialNotes={unavailable.title ?? undefined} />
      </View>
    );
  } else if (error || !listing) {
    body = (
      <View style={{ alignItems: "center", gap: spacing.md }}>
        <ErrorState message={error ?? "This item couldn't be loaded."} onRetry={load} />
        <Link href="/contact" replace asChild>
          <Button label="Send a general enquiry instead" variant="outline" />
        </Link>
      </View>
    );
  } else {
    const price = listingPriceLabel(listing);
    const moq = listingMoqLabel(listing);
    body = (
      <View style={{ gap: spacing.lg }}>
        <LinearGradient
          colors={["#071A10", "#123824"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: radius.lg,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: "rgba(229,180,98,0.35)",
            gap: 6,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 0.9, textTransform: "uppercase", color: "#E5B462" }}>
              B2B WHOLESALE QUOTE REQUEST
            </Text>
            <Link href={{ pathname: "/listings/[id]", params: { id: String(listing.id) } }} style={{ fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: "#6FC28F" }}>
              ← Back to lot details
            </Link>
          </View>
          <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 23, color: "#FFFFFF", lineHeight: 29 }}>
            {listing.title}
          </Text>
          {price || moq ? (
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14.5, color: "#E5B462" }}>
              {[price ? `${price}${showsGst(listing) ? " + GST" : ""}` : null, moq].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: "rgba(255,255,255,0.82)", marginTop: 2, lineHeight: 19 }}>
            Share your requirement once — the FarmsClub trade desk confirms live batch price, availability, and road/rail dispatch.
          </Text>
        </LinearGradient>

        <RfqFormBody listing={listing} listingId={listing.id} scrollRef={scrollRef} initialQuantity={prefillQty} />
      </View>
    );
  }

  return (
    <AppShell
      keyboardAware
      hideBottomNav
      scrollRef={scrollRef}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 720, width: "100%", alignSelf: "center" }}
    >
      <SeoHead
        title={listing ? `Request a quote: ${listing.title} · FarmsClub` : "Request a quote · FarmsClub"}
        description="Send the FarmsClub team your bulk requirement — quantity, delivery city and nearest railway station."
        noindex
      />
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.xl,
          padding: spacing.xl,
          shadowColor: "#081E12",
          shadowOpacity: 0.06,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
      >
        {body}
      </View>
    </AppShell>
  );
}
