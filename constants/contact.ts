import { useEffect, useState } from "react";
import { b2bApi } from "@/lib/api";
import type { B2bContact } from "@/lib/types";

/**
 * FarmsClub's own trade-desk contact details — read from GET /public/b2b/contact, which an admin
 * edits at Admin > B2B Console > Settings > FarmsClub contact. Nothing is hardcoded here: a value
 * that hasn't been set comes back null and every surface (announcement bar, footer) simply leaves
 * it out. Never fall back to another brand's contact details.
 *
 * One request per app session, shared by every caller (the announcement bar and footer both
 * mount on every page).
 */
let cached: B2bContact | null = null;
let inflight: Promise<B2bContact | null> | null = null;

function fetchContact(): Promise<B2bContact | null> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = b2bApi
      .getContact()
      .then((c) => {
        cached = normalize(c);
        return cached;
      })
      .catch(() => {
        inflight = null; // let a later mount try again
        return null;
      });
  }
  return inflight;
}

function clean(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function normalize(c: Partial<B2bContact> | null | undefined): B2bContact {
  return {
    supportEmail: clean(c?.supportEmail),
    whatsappNumber: clean(c?.whatsappNumber),
    phone: clean(c?.phone),
    hoursLabel: clean(c?.hoursLabel),
    whatsappAvailableNow: !!c?.whatsappAvailableNow,
  };
}

/** The configured contact details, or null while loading / if the request failed. */
export function useB2bContact(): B2bContact | null {
  const [contact, setContact] = useState<B2bContact | null>(cached);
  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    fetchContact().then((c) => {
      if (!cancelled) setContact(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return contact;
}

/** wa.me link for a configured number ("+91 98765 43210" → https://wa.me/919876543210). A bare
 *  10-digit Indian mobile gets the 91 country code; anything else is used as entered. */
export function whatsappUrl(number: string): string | null {
  let digits = number.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

/** tel: link for a configured phone number. */
export function telUrl(number: string): string | null {
  const cleaned = number.replace(/[^\d+]/g, "");
  return cleaned.replace(/\D/g, "").length >= 6 ? `tel:${cleaned}` : null;
}
