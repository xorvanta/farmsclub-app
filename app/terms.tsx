import { SeoHead } from "@/components/SeoHead";
import { AppShell } from "@/components/AppShell";
import { LegalPage } from "@/components/LegalPage";

/*
 * Storefront §9.11 / §13 / §14: the Terms page is the only storefront page that may name legal
 * entities. EXACT WORDING TO BE CONFIRMED BY CA/LEGAL before farmsclub.in launch:
 *  - the operator line ("operated by Xorvanta Technologies Pvt. Ltd."), and
 *  - the billing entity for bulk orders — its legal name is deliberately NOT on the page yet; insert
 *    it in section 1 once the CA confirms the name and the bill document type (bill of supply vs
 *    tax invoice).
 * Also still to confirm with legal before launch: payment terms, risk in transit, returns/disputes
 * window, governing law/jurisdiction. This draft has not been reviewed by counsel.
 */
export default function Terms() {
  return (
    <AppShell>
      <SeoHead title="Terms · FarmsClub" description="Terms for using FarmsClub, India's trusted farm network, and for bulk orders placed through it." />
      <LegalPage
        title="Terms"
        updated="October 2026"
        sections={[
          {
            heading: "1. Who runs FarmsClub",
            body: "FarmsClub is operated by Xorvanta Technologies Pvt. Ltd. Bulk orders arranged through FarmsClub are billed by a separate billing entity, which is named on your order confirmation and on your bill.",
          },
          {
            heading: "2. The farm network",
            body: "Farm profiles on FarmsClub are for information only. Each farm owner has agreed that FarmsClub may publish their farm's details, photos and videos. A \"Verified\" farm is one the FarmsClub team has visited; \"Self-listed\" farms have not been visited yet. FarmsClub does not take bookings or payments for farm visits, training, courses or services on this website — any arrangement you make with a farm is between you and the farm.",
          },
          {
            heading: "3. Requests for a quote",
            body: "Browsing FarmsClub and submitting a quote request or enquiry is not a binding order. An order is confirmed only once the FarmsClub team has agreed quantity, price and delivery details with you directly.",
          },
          {
            heading: "4. Prices",
            body: "Prices are shown per unit and change by order quantity. Prices may change between your enquiry and order confirmation; the price that applies is the one confirmed to you by the FarmsClub team. You receive a proper bill for every order.",
          },
          {
            heading: "5. Payment",
            body: "Payment terms and accepted payment methods are confirmed with you before your order is placed.",
          },
          {
            heading: "6. Delivery",
            body: "Delivery is arranged by road or rail. The transport mode and expected arrival are shared with you once your order is confirmed. Delivery timelines are estimates and depend on the transport arranged.",
          },
          {
            heading: "7. Problems with an order",
            body: "If the quantity or condition of what you receive does not match your order, tell the FarmsClub team as soon as possible through the Enquire page, with photos where you can, and we will work with you to resolve it.",
          },
          {
            heading: "8. Contact",
            body: "Questions about an order or these terms — use the Enquire page and the FarmsClub team will get back to you.",
          },
        ]}
      />
    </AppShell>
  );
}
