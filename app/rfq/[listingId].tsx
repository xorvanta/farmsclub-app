import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { RfqFormBody } from "@/components/RfqFormBody";
import { LoadingState, ErrorState, EmptyState } from "@/components/StateViews";
import { Button } from "@/components/Button";
import { SectionBanner } from "@/components/SectionBanner";
import { TRADE_DESK_PHOTO } from "@/constants/categoryImages";
import { b2bApi, errorMessage, parseListingId } from "@/lib/api";
import type { B2bListing } from "@/lib/types";

export default function RfqForScreen() {
  const { spacing } = useTheme();
  const { listingId: rawId } = useLocalSearchParams<{ listingId: string }>();
  const listingId = parseListingId(rawId);

  const [listing, setListing] = useState<B2bListing | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setListing(null);
    if (listingId == null) return setLoaded(true);
    setLoaded(false);
    b2bApi
      .getListing(listingId)
      .then(setListing)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoaded(true));
  }, [listingId]);

  useEffect(() => load(), [load]);

  let body: React.ReactNode;
  if (!loaded) {
    body = <LoadingState label="" />;
  } else if (listingId == null) {
    body = (
      <View style={{ alignItems: "center", gap: spacing.md }}>
        <EmptyState title="Listing not found" body="This listing doesn't exist — you can still send us a general enquiry." />
        <Button label="Send a general enquiry" onPress={() => router.replace("/contact")} />
      </View>
    );
  } else if (error || !listing) {
    body = (
      <View style={{ alignItems: "center", gap: spacing.md }}>
        <ErrorState message={error ?? "This listing isn't available."} onRetry={load} />
        <Button label="Send a general enquiry instead" variant="outline" onPress={() => router.replace("/contact")} />
      </View>
    );
  } else {
    body = <RfqFormBody listing={listing} listingId={listing.id} />;
  }

  return (
    <AppShell contentContainerStyle={{ padding: spacing.lg, maxWidth: 640, width: "100%", alignSelf: "center" }}>
      <SeoHead title="Request a Quote · FarmsClub" description="Submit a bulk sourcing enquiry to Formulate India's trade desk." noindex />
      <View style={{ marginBottom: spacing.xl }}>
        <SectionBanner
          eyebrow="Request a Quote"
          title={listing ? `Source ${listing.title} in bulk` : "Tell us what you need"}
          body="Submit your requirement once — our trade desk reviews it and follows up directly, usually within one business day."
          photo={TRADE_DESK_PHOTO}
          insetHorizontal={false}
        />
      </View>
      {body}
    </AppShell>
  );
}
