import { findMatchIndices } from "@/utils/search";

interface HighlightedTextProps {
  text: string;
  query: string;
}

export default function HighlightedText({ text, query }: HighlightedTextProps) {
  if (!query || !text) return <>{text}</>;

  const indices = findMatchIndices(text, query);
  if (indices.length === 0) return <>{text}</>;

  const fragments: React.ReactNode[] = [];
  let lastEnd = 0;

  for (const [start, end] of indices) {
    if (start > lastEnd) {
      fragments.push(text.slice(lastEnd, start));
    }
    fragments.push(
      <mark key={start} className="search-highlight">
        {text.slice(start, end)}
      </mark>
    );
    lastEnd = end;
  }

  if (lastEnd < text.length) {
    fragments.push(text.slice(lastEnd));
  }

  return <>{fragments}</>;
}
