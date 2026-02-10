"use client";

import type { GlossaryEntry } from "@/types";
import { useGlossarySection } from "./GlossaryProvider";

interface GlossarySectionProps {
  entries: GlossaryEntry[];
}

export function GlossarySection({ entries }: GlossarySectionProps) {
  const { isSectionOpen, toggleSection } = useGlossarySection();

  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      className="glossary-section"
      role="doc-endnotes"
      aria-label="용어 설명"
    >
      <button
        onClick={toggleSection}
        aria-expanded={isSectionOpen}
        aria-label="용어 설명 접기/펼치기"
        className="glossary-toggle-button"
      >
        <h2 className="glossary-section-title">용어 설명</h2>
        <svg
          className={`glossary-toggle-icon ${isSectionOpen ? "rotate-0" : "-rotate-90"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <dl className={`glossary-list ${isSectionOpen ? "glossary-list-open" : "glossary-list-closed"}`}>
        {entries.map((entry) => (
          <div
            key={entry.id}
            id={`glossary-${entry.id}`}
            className="glossary-item"
          >
            <dt className="glossary-item-term">
              {entry.term}
              <a
                href={`#term-${entry.id}`}
                className="glossary-back-link"
                aria-label="본문으로 돌아가기"
              >
                ↑
              </a>
            </dt>
            <dd className="glossary-item-detail">{entry.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
