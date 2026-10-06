import { useEffect, useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { RfqFormBody } from "@/components/RfqFormBody";
import { LoadingState } from "@/components/StateViews";
import { SectionBanner } from "@/components/SectionBanner";
import { TRADE_DESK_PHOTO } from "@/constants/categoryImages";
import { b2bApi } from "@/lib/api";
import type { B2bListing } from "@/lib/types";

export default function RfqForScreen() {
  const { spacing } = useTheme();
  const { listingId } = useLocalSearchParams<{ listingId: string }>();

  const [listing, setListing] = useState<B2bListing | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!listingId) return setLoaded(true);
    b2bApi
      .getListing(Number(listingId))
      .then(setListing)
      .finally(() => setLoaded(true));
  }, [listingId]);

  return (
    <AppShell contentContainerStyle={{ padding: spacing.lg, maxWidth: 640, width: "100%", alignSelf: "center" }}>
      <Head>
        <title>Request a Quote · FarmsClub</title>
        <meta name="description" content="Submit a bulk sourcing enquiry to Formulate India's trade desk." />
      </Head>
      <View style={{ marginBottom: spacing.xl }}>
        <SectionBanner
          eyebrow="Request a Quote"
          title={listing ? `Source ${listing.title} in bulk` : "Tell us what you need"}
          body="Submit your requirement once — our trade desk reviews it and follows up directly, usually within one business day."
          photo={TRADE_DESK_PHOTO}
          insetHorizontal={false}
        />
        {!loaded && <LoadingState label="" />}
      </View>
      {loaded && <RfqFormBody listing={listing} listingId={listingId ? Number(listingId) : undefined} />}
    </AppShell>
  );
}
