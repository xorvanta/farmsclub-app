import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, type ScrollView } from "react-native";
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
  const { listingId: rawId } = useLocalSearchParams<{ listingId: string }>();
  const listingId = parseListingId(rawId);
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

  // Static-export template render (no id yet) — neutral loading view.
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
        <View style={{ gap: 4, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: colors.inkSoft }}>Request a quote</Text>
          <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink, lineHeight: 28 }}>
            {listing.title}
          </Text>
          {price || moq ? (
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.brand }}>
              {[price ? `${price}${showsGst(listing) ? " + GST" : ""}` : null, moq].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          <Text style={{ fontFamily: fonts.body, fontSize: 13.5, color: colors.inkSoft, marginTop: 4, lineHeight: 19 }}>
            Share your requirement once — the FarmsClub team confirms price, availability and dispatch with you.
          </Text>
        </View>
        <RfqFormBody listing={listing} listingId={listing.id} scrollRef={scrollRef} />
      </View>
    );
  }

  return (
    // No bottom nav on the form: it would sit over the keyboard and the submit button.
    <AppShell
      keyboardAware
      hideBottomNav
      hideChatFab
      scrollRef={scrollRef}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 680, width: "100%", alignSelf: "center" }}
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
          borderRadius: radius.lg,
          padding: spacing.xl,
        }}
      >
        {body}
      </View>
    </AppShell>
  );
}
