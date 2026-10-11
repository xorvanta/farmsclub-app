/**
 * Single source for the public contact details shown in the header strip and footer.
 * Same numbers already hardcoded in paudhewale-dashboard-frontend's StorefrontFooter.jsx — no
 * public API exposes SupportContactSettingsService today, so these stay hardcoded here.
 * TODO(owner): confirm the FarmsClub WhatsApp number before go-live.
 */
export const WHATSAPP_NUMBER = "917969513372";
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;
/** "+91 79695 13372" */
export const WHATSAPP_DISPLAY = `+91 ${WHATSAPP_NUMBER.slice(2, 7)} ${WHATSAPP_NUMBER.slice(7)}`;
