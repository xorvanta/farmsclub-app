import Head from "expo-router/head";
import { AppShell } from "@/components/AppShell";
import { LegalPage } from "@/components/LegalPage";

export default function Privacy() {
  return (
    <AppShell>
      <Head>
        <title>Privacy Policy · FarmsClub</title>
        <meta name="description" content="How Formulate India collects and uses the information you submit on FarmsClub." />
      </Head>
      <LegalPage
        title="Privacy Policy"
        updated="[date — set before launch]"
        note="Reflects exactly what the enquiry form on this site collects today. Review against India's DPDP Act before launch, and fill in the grievance-officer contact in section 6 — it can't be published without one."
        sections={[
          {
            heading: "1. What we collect",
            body: "When you submit an enquiry: your name, mobile number, and optionally email, GSTIN, billing name and address, delivery city/state/pincode, destination railway station, and the product/quantity you're enquiring about.",
          },
          {
            heading: "2. Why we collect it",
            body: "Solely to respond to your enquiry, prepare a quote, verify your GSTIN where provided, create an order if you proceed, and generate the invoice and dispatch paperwork an order requires.",
          },
          {
            heading: "3. Who sees it",
            body: "Formulate India's sales/trade desk team. Sellers fulfilling your order never see your contact details, billing information, or the price you were quoted — only your name and the destination station, shared once an order is confirmed.",
          },
          {
            heading: "4. How long we keep it",
            body: "[Specify retention period before launch — typically tied to statutory invoicing/tax record-keeping requirements.]",
          },
          {
            heading: "5. Your rights",
            body: "You can ask what we hold about you, request a correction, or ask us to delete it where we're not required to retain it for tax or legal purposes. [Add the request channel/email before launch.]",
          },
          {
            heading: "6. Grievance officer",
            body: "[Name, designation, and contact details required here before publishing — not yet provided.]",
          },
        ]}
      />
    </AppShell>
  );
}
