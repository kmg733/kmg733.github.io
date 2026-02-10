"use client";

import { createContext, useContext, useMemo, useState, useCallback } from "react";
import type { GlossaryEntry } from "@/types";

interface GlossaryContextValue {
  entries: Map<string, GlossaryEntry>;
  isSectionOpen: boolean;
  openSection: () => void;
  toggleSection: () => void;
}

const defaultValue: GlossaryContextValue = {
  entries: new Map(),
  isSectionOpen: true,
  openSection: () => {},
  toggleSection: () => {},
};

const GlossaryContext = createContext<GlossaryContextValue>(defaultValue);

interface GlossaryProviderProps {
  entries: GlossaryEntry[];
  children: React.ReactNode;
}

export function GlossaryProvider({ entries, children }: GlossaryProviderProps) {
  const entryMap = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries]
  );

  const [isSectionOpen, setIsSectionOpen] = useState(true);

  const openSection = useCallback(() => {
    setIsSectionOpen(true);
  }, []);

  const toggleSection = useCallback(() => {
    setIsSectionOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ entries: entryMap, isSectionOpen, openSection, toggleSection }),
    [entryMap, isSectionOpen, openSection, toggleSection]
  );

  return (
    <GlossaryContext.Provider value={value}>
      {children}
    </GlossaryContext.Provider>
  );
}

export function useGlossary(id: string): GlossaryEntry | undefined {
  const { entries } = useContext(GlossaryContext);
  return entries.get(id);
}

export function useGlossarySection() {
  const { isSectionOpen, openSection, toggleSection } = useContext(GlossaryContext);
  return { isSectionOpen, openSection, toggleSection };
}
