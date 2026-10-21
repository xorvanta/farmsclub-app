import { SeoHead } from "@/components/SeoHead";
import { AppShell } from "@/components/AppShell";
import { LegalPage } from "@/components/LegalPage";

/*
 * Reflects what the enquiry/quote forms, the farm registration form, the private farm edit link,
 * "Ask about this farm" and the Trellis chat collect today (Storefront §9.11). Before launch:
 * review against India's DPDP Act, set the retention period, and add a named grievance officer
 * (name, designation, contact) — until then the page points people to the Enquire page.
 */
export default function Privacy() {
  return (
    <AppShell>
      <SeoHead title="Privacy · FarmsClub" description="How FarmsClub collects, uses and protects the information you share, including farm registration details." />
      <LegalPage
        title="Privacy policy"
        updated="October 2026"
        sections={[
          {
            heading: "1. Who we are",
            body: "FarmsClub is operated by Xorvanta Technologies Pvt. Ltd. This policy explains what we collect on this website and how we use it.",
          },
          {
            heading: "2. Quote requests and enquiries",
            body: "When you request a quote or send an enquiry we collect your name and mobile number; optionally your email, GSTIN, billing name and address, delivery city, state and pincode, and nearest railway station; the product and quantity you ask about; and anything you write in the message. We also record the page the enquiry was sent from. We use this only to reply, prepare a quote, and arrange and bill an order if you go ahead. Your details are only seen by the FarmsClub team.",
          },
          {
            heading: "3. Farm registration (List your farm)",
            body: "When you list your farm we collect: owner name, mobile number and whether it is on WhatsApp, farm name, state and district, farm type, main crops, total land, up to three photos, the services you offer, whether you offer training, and whether you also want to buy planting material in bulk. Through the private edit link our team sends you, you can add more details such as your farm's story, facts, photos, videos, what you grow, services and training.\n\nConsent: you tick a box allowing FarmsClub to publish your farm's details, photos and videos. We record that consent with the time and the IP address it was given from.",
          },
          {
            heading: "4. What we publish about a farm — and what we never publish",
            body: "A live farm profile shows the farm's name, district and state, farm type, crops, story, facts, photos, videos, services and training details. We never publish a farm's phone number, WhatsApp number, email, full address or map location, and they are not sent to visitors' browsers.\n\nHow contact numbers are used: the FarmsClub team uses the mobile number to call you, complete your profile and arrange a visit if you ask for one. On Verified farms that have chosen WhatsApp, visitors can tap \"Chat with the farm\" — this opens WhatsApp without ever showing the number on the page. Messages sent through \"Ask about this farm\" go to the FarmsClub team, who pass them on.",
          },
          {
            heading: "5. Private edit link",
            body: "Your private edit link lets you update your profile without an account. Keep it to yourself — anyone with the link can propose changes. Changes are reviewed by our team before they go live. If you think the link has been shared, ask us and we will replace it.",
          },
          {
            heading: "6. Trellis chat",
            body: "We keep the questions you type to Trellis. Questions that aren't answered from our own FAQs are sent, with the recent conversation and the listing you're viewing, to a third-party AI model provider to generate a reply. Please don't type personal or payment details into the chat.",
          },
          {
            heading: "7. Protecting the forms",
            body: "To stop automated abuse, submissions are logged with your IP address (and, where given, your mobile number) so we can limit how many can be sent in a short time. Some forms use a security check from Cloudflare.",
          },
          {
            heading: "8. Your choices and removal requests",
            body: "You can ask what we hold about you, ask us to correct it, or ask us to delete it. Farm owners can ask us to unpublish their farm and delete its details at any time. Send these requests through the Enquire page. We remove published farm details promptly, and delete the rest except where we must keep records (for example, bills for orders).",
          },
          {
            heading: "9. Contact",
            body: "For any privacy question or complaint, contact the FarmsClub team through the Enquire page.",
          },
        ]}
      />
    </AppShell>
  );
}
