export interface TechCategory {
  id: string;
  label: string;
  emoji: string;
  emojiLabel: string;
  colorScheme: "sky" | "violet" | "emerald" | "amber";
  items: string[];
}

export const techCategories: TechCategory[] = [
  {
    id: "languages",
    label: "Languages",
    emoji: "💬",
    emojiLabel: "언어",
    colorScheme: "sky",
    items: ["Java", "JavaScript", "TypeScript"],
  },
  {
    id: "frameworks",
    label: "Frameworks & Libraries",
    emoji: "🧩",
    emojiLabel: "프레임워크",
    colorScheme: "violet",
    items: ["Spring Boot", "Spring Security", "React", "Bootstrap", "Tailwind CSS"],
  },
  {
    id: "databases",
    label: "Databases",
    emoji: "🗄️",
    emojiLabel: "데이터베이스",
    colorScheme: "emerald",
    items: ["PostgreSQL", "MariaDB"],
  },
  {
    id: "tools",
    label: "Tools & Environment",
    emoji: "🔧",
    emojiLabel: "도구",
    colorScheme: "amber",
    items: ["Git", "GitHub", "GitLab"],
  },
];

/** About 페이지 호환용 플랫 구조 */
export const techStack = {
  languages: techCategories.find(c => c.id === "languages")!.items,
  frameworks: techCategories.find(c => c.id === "frameworks")!.items,
  databases: techCategories.find(c => c.id === "databases")!.items,
  tools: techCategories.find(c => c.id === "tools")!.items,
};
