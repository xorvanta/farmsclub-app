import { useCallback, useEffect, useRef, useState } from "react";
import { View, type ScrollView } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { RfqFormBody } from "@/components/RfqFormBody";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { Button } from "@/components/Button";
import { SectionBanner } from "@/components/SectionBanner";
import { TRADE_DESK_PHOTO } from "@/constants/categoryImages";
import { b2bApi, errorMessage, isNotFound, parseListingId } from "@/lib/api";
import type { B2bListing } from "@/lib/types";

export default function RfqForScreen() {
  const { spacing, colors, radius } = useTheme();
  const { listingId: rawId } = useLocalSearchParams<{ listingId: string }>();
  const listingId = parseListingId(rawId);
  const scrollRef = useRef<ScrollView>(null);

  const [listing, setListing] = useState<B2bListing | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(() => {
    setError(null);
    setNotFound(false);
    setListing(null);
    if (listingId == null) return setLoaded(true);
    setLoaded(false);
    b2bApi
      .getListing(listingId)
      .then(setListing)
      .catch((e) => (isNotFound(e) ? setNotFound(true) : setError(errorMessage(e))))
      .finally(() => setLoaded(true));
  }, [listingId]);

  useEffect(() => load(), [load]);

  const unavailable = loaded && (listingId == null || notFound);

  let body: React.ReactNode;
  if (!loaded) {
    body = <LoadingState label="Loading listing…" />;
  } else if (unavailable) {
    body = (
      <EmptyState
        title="This listing isn't available"
        body="It may have been removed, or the link is incomplete. You can still tell us what you need in a general enquiry."
      >
        <Link href="/contact" replace asChild>
          <Button label="Send a general enquiry" />
        </Link>
        <Link href="/listings" asChild>
          <Button label="Browse the catalogue" variant="outline" />
        </Link>
      </EmptyState>
    );
  } else if (error || !listing) {
    body = (
      <View style={{ alignItems: "center", gap: spacing.md }}>
        <ErrorState message={error ?? "This listing couldn't be loaded."} onRetry={load} />
        <Link href="/contact" replace asChild>
          <Button label="Send a general enquiry instead" variant="outline" />
        </Link>
      </View>
    );
  } else {
    body = <RfqFormBody listing={listing} listingId={listing.id} scrollRef={scrollRef} />;
  }

  return (
    // No bottom nav on the form: it would sit over the keyboard and the submit button.
    <AppShell
      keyboardAware
      hideBottomNav
      scrollRef={scrollRef}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 680, width: "100%", alignSelf: "center" }}
    >
      <SeoHead title="Request a quote · FarmsClub" description="Submit a bulk sourcing enquiry to Formulate India's trade desk." noindex />
      {/* The banner describes the quote form — only shown once there is a listing to quote on. */}
      {listing ? (
        <View style={{ marginBottom: spacing.xl }}>
          <SectionBanner
            eyebrow="Request a quote"
            title={`Source ${listing.title} in bulk`}
            body="Submit your requirement once — our trade desk reviews it and follows up directly, usually within one business day."
            photo={TRADE_DESK_PHOTO}
            insetHorizontal={false}
          />
        </View>
      ) : null}
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing.xl,
          shadowColor: "#111C15",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        {body}
      </View>
    </AppShell>
  );
}
