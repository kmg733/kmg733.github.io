import type { GlossaryEntry } from "@/types";

interface GlossarySectionProps {
  entries: GlossaryEntry[];
}

export function GlossarySection({ entries }: GlossarySectionProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      className="glossary-section"
      role="doc-endnotes"
      aria-label="용어 설명"
    >
      <h2 className="glossary-section-title">용어 설명</h2>
      <dl className="glossary-list">
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
