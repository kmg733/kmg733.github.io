"use client";

import { useState, useCallback } from "react";
import { useGlossary } from "./GlossaryProvider";

interface TermProps {
  id: string;
  children: React.ReactNode;
}

export function Term({ id, children }: TermProps) {
  const entry = useGlossary(id);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleScrollToGlossary = useCallback(() => {
    const target = document.getElementById(`glossary-${id}`);
    target?.scrollIntoView({ behavior: "smooth" });
  }, [id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleScrollToGlossary();
      }
    },
    [handleScrollToGlossary]
  );

  if (!entry) {
    return <span>{children}</span>;
  }

  return (
    <abbr
      className="glossary-term"
      role="doc-noteref"
      aria-describedby={`glossary-${id}`}
      tabIndex={0}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      onClick={handleScrollToGlossary}
      onKeyDown={handleKeyDown}
    >
      {children}
      {showTooltip && (
        <span className="glossary-tooltip" role="tooltip" id={`tooltip-${id}`}>
          {entry.brief}
          <span className="glossary-tooltip-more">자세히 보기 ↓</span>
        </span>
      )}
    </abbr>
  );
}
