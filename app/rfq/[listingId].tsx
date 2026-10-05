import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { useTheme } from "@/constants/theme-context";
import { AppShell } from "@/components/AppShell";
import { RfqFormBody } from "@/components/RfqFormBody";
import { LoadingState } from "@/components/StateViews";
import { b2bApi } from "@/lib/api";
import type { B2bListing } from "@/lib/types";

export default function RfqForScreen() {
  const { fonts, colors, spacing } = useTheme();
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
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.ink }}>Request a quote</Text>
        {!loaded ? (
          <LoadingState label="" />
        ) : listing ? (
          <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 4 }}>
            For: {listing.title}
          </Text>
        ) : null}
      </View>
      {loaded && <RfqFormBody listing={listing} listingId={listingId ? Number(listingId) : undefined} />}
    </AppShell>
  );
}
