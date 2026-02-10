"use client";

import { createContext, useContext, useMemo } from "react";
import type { GlossaryEntry } from "@/types";

const GlossaryContext = createContext<Map<string, GlossaryEntry>>(new Map());

interface GlossaryProviderProps {
  entries: GlossaryEntry[];
  children: React.ReactNode;
}

export function GlossaryProvider({ entries, children }: GlossaryProviderProps) {
  const entryMap = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries]
  );

  return (
    <GlossaryContext.Provider value={entryMap}>
      {children}
    </GlossaryContext.Provider>
  );
}

export function useGlossary(id: string): GlossaryEntry | undefined {
  const map = useContext(GlossaryContext);
  return map.get(id);
}
