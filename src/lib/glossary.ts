import type { GlossaryEntry } from "@/types";

/**
 * frontmatter의 raw glossary 데이터를 GlossaryEntry 배열로 파싱한다.
 * 유효하지 않은 항목은 제외한다.
 */
export function parseGlossary(data: unknown): GlossaryEntry[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(isValidGlossaryEntry);
}

const VALID_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidGlossaryEntry(item: unknown): item is GlossaryEntry {
  if (item == null || typeof item !== "object") {
    return false;
  }

  const entry = item as Record<string, unknown>;

  return (
    typeof entry.id === "string" &&
    VALID_ID_PATTERN.test(entry.id) &&
    typeof entry.term === "string" &&
    typeof entry.brief === "string" &&
    typeof entry.detail === "string"
  );
}
