import { createContext, useContext, useState, useEffect, useCallback, type PropsWithChildren } from "react";
import { Platform } from "react-native";

const STORAGE_KEY = "fc_mandi_tour_seen_v1";

type TourContextValue = {
  isOpen: boolean;
  step: number;
  showHintPill: boolean;
  openTour: (initialStep?: number) => void;
  closeTour: () => void;
  dismissHintPill: () => void;
  setStep: (step: number) => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [showHintPill, setShowHintPill] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        const seen = window.localStorage.getItem(STORAGE_KEY);
        if (!seen) {
          const timer = setTimeout(() => setShowHintPill(true), 1800);
          return () => clearTimeout(timer);
        }
      } catch {
        // localStorage blocked or unavailable
      }
    }
  }, []);

  const markSeen = useCallback(() => {
    setShowHintPill(false);
    if (Platform.OS === "web" && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        // ignore
      }
    }
  }, []);

  const openTour = useCallback(
    (initialStep = 0) => {
      setStep(initialStep);
      setIsOpen(true);
      markSeen();
    },
    [markSeen],
  );

  const closeTour = useCallback(() => {
    setIsOpen(false);
    markSeen();
  }, [markSeen]);

  const dismissHintPill = useCallback(() => {
    markSeen();
  }, [markSeen]);

  return (
    <TourContext.Provider value={{ isOpen, step, showHintPill, openTour, closeTour, dismissHintPill, setStep }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within a TourProvider");
  return ctx;
}
