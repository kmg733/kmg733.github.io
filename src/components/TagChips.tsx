import type { TagCount } from "@/utils/tag";

interface TagChipsProps {
  tags: TagCount[];
  selectedTag: string | null;
  onSelectTag: (tag: string) => void;
}

export default function TagChips({
  tags,
  selectedTag,
  onSelectTag,
}: TagChipsProps) {
  // 태그가 2개 미만이면 칩 UI 불필요
  if (tags.length < 2) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {tags.map((tag) => {
        const isActive = selectedTag === tag.name;
        return (
          <button
            key={tag.name}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelectTag(tag.name)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            <span>{tag.name}</span>
            <span
              className={`${
                isActive
                  ? "text-blue-500 dark:text-blue-500"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {tag.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
