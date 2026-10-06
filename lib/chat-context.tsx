import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ChatListingContext } from "./types";

// Shared with ChatWidget.tsx and AnnouncementBar.tsx so the FAB (mobile) and the header text
// trigger (desktop) switch over at the exact same width — no gap where neither shows, no
// overlap where both do. Matches Header.tsx's own compact/desktop breakpoint.
export const CHAT_COMPACT_WIDTH = 760;

type ChatContextValue = {
  isOpen: boolean;
  listingContext: ChatListingContext | null;
  openChat: (ctx?: ChatListingContext | null) => void;
  closeChat: () => void;
  setListingContext: (ctx: ChatListingContext | null) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

/** Lets any page (notably a listing detail page) hand the chat widget real context about what
 *  the buyer is looking at — same role as the retail storefront's websiteStore chatProductContext,
 *  implemented as plain Context here since this app has no global store dependency yet. The
 *  widget itself is mounted once at the root layout so a conversation survives navigation. */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [listingContext, setListingContext] = useState<ChatListingContext | null>(null);

  const openChat = useCallback((ctx?: ChatListingContext | null) => {
    if (ctx !== undefined) setListingContext(ctx);
    setIsOpen(true);
  }, []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, listingContext, openChat, closeChat, setListingContext }),
    [isOpen, listingContext, openChat, closeChat]
  );
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
