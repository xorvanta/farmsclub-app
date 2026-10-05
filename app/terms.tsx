import Head from "expo-router/head";
import { AppShell } from "@/components/AppShell";
import { LegalPage } from "@/components/LegalPage";

export default function Terms() {
  return (
    <AppShell>
      <Head>
        <title>Terms of Trade · FarmsClub</title>
        <meta name="description" content="Terms governing bulk orders placed through FarmsClub." />
      </Head>
      <LegalPage
        title="Terms of Trade"
        updated="[date — set before launch]"
        note="Drafted as a standard structure for a B2B sourcing platform, not reviewed by counsel. Confirm with Formulate India's legal advisor — particularly the liability, cancellation, and dispute-resolution sections — before this goes live."
        sections={[
          {
            heading: "1. Who you're contracting with",
            body: "Every order placed through FarmsClub is sold by Formulate India, which buys from its network of subscribed sellers and sells to you as a single counterparty. Formulate India issues the invoice, confirms delivery, and is who you contact for any order-related matter — not the originating seller.",
          },
          {
            heading: "2. How an order is formed",
            body: "Browsing FarmsClub and submitting an enquiry is a request for quote, not a binding order. An order is only confirmed once our trade desk has agreed quantity, price, and delivery details with you directly and recorded your advance payment.",
          },
          {
            heading: "3. Pricing",
            body: "Prices shown are per-unit, before GST, and vary by order quantity. Published tiers reflect live supplier rates and may change between your enquiry and order confirmation for requirements not yet quoted.",
          },
          {
            heading: "4. Payment",
            body: "Orders are payable in advance to Formulate India, by the method confirmed during order creation. [Specify accepted payment methods and any partial-payment terms before launch.]",
          },
          {
            heading: "5. Delivery and risk",
            body: "Dispatch details (transport mode, expected arrival) are shared once your order is confirmed. Formulate India calls to confirm delivery before an order is closed. [Confirm risk-of-loss terms in transit with your logistics/legal advisor.]",
          },
          {
            heading: "6. Returns and disputes",
            body: "[To be defined before launch — specify the process for a quantity or quality discrepancy on delivery, and the timeframe for raising it.]",
          },
          {
            heading: "7. Governing law",
            body: "[Specify jurisdiction and dispute-resolution forum before launch.]",
          },
          {
            heading: "8. Contact",
            body: "Questions about an order or these terms — use the enquiry form on our Contact page. [Add a direct trade-desk phone/email here once available.]",
          },
        ]}
      />
    </AppShell>
  );
}
