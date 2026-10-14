import { SeoHead } from "@/components/SeoHead";
import { AppShell } from "@/components/AppShell";
import { LegalPage } from "@/components/LegalPage";

export default function Privacy() {
  return (
    <AppShell>
      <SeoHead title="Privacy policy · FarmsClub" description="How Formulate India collects and uses the information you submit on FarmsClub." />
      <LegalPage
        title="Privacy policy"
        updated="[date — set before launch]"
        note="Reflects exactly what the enquiry form and the Trellis chat on this site collect today. Review against India's DPDP Act before launch, and fill in the grievance-officer contact in section 6 — it can't be published without one."
        sections={[
          {
            heading: "1. What we collect",
            body: "When you submit an enquiry: your name and mobile number; optionally your email, GSTIN, billing name and address (with city, state and pincode), a separate delivery city/state/pincode, and destination railway station; the product and quantity you're enquiring about; and anything you write in the message/notes field. On the website we also record the page address the enquiry was sent from.\n\nTo stop automated abuse, each enquiry and each Trellis chat message is logged with your IP address (and, for enquiries, your mobile number) so we can limit how many can be sent in a short time.\n\nTrellis chat: the questions you type. Questions that aren't answered from our own FAQ are sent — with the recent conversation and the listing you're viewing, if any — to a third-party AI model provider to generate the reply. Please don't type personal or payment details into the chat.",
          },
          {
            heading: "2. Why we collect it",
            body: "Solely to respond to your enquiry, prepare a quote, verify your GSTIN where provided, create an order if you proceed, generate the invoice and dispatch paperwork an order requires, answer your chat questions, and protect these forms from spam.",
          },
          {
            heading: "3. Who sees it",
            body: "Formulate India's sales/trade desk team. Sellers who quote on a requirement see only the product, quantity, destination state and required dispatch timing — not who you are. The seller assigned to a confirmed order sees your name and destination railway station (and, for a sample, the ship-to city). Sellers never see your phone number, email, GSTIN, billing details, or the price you were quoted.",
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
