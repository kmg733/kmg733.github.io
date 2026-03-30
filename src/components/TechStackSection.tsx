import ScrollReveal from "@/components/ScrollReveal";
import { techCategories } from "@/data/techStack";
import { techIcons } from "@/components/TechCard";

const colorSchemes = {
  sky: {
    bg: "bg-sky-100 dark:bg-sky-900/30",
    bgHover: "hover:bg-sky-200 dark:hover:bg-sky-800/40",
    text: "text-sky-800 dark:text-sky-300",
    icon: "text-sky-700 dark:text-sky-400",
  },
  violet: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    bgHover: "hover:bg-violet-200 dark:hover:bg-violet-800/40",
    text: "text-violet-800 dark:text-violet-300",
    icon: "text-violet-700 dark:text-violet-400",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    bgHover: "hover:bg-emerald-200 dark:hover:bg-emerald-800/40",
    text: "text-emerald-800 dark:text-emerald-300",
    icon: "text-emerald-700 dark:text-emerald-400",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    bgHover: "hover:bg-amber-200 dark:hover:bg-amber-800/40",
    text: "text-amber-800 dark:text-amber-300",
    icon: "text-amber-700 dark:text-amber-400",
  },
};

export default function TechStackSection() {
  return (
    <section aria-label="Tech Stack" className="mb-16">
      <ScrollReveal direction="fade">
        <h2 className="mb-8 text-center text-2xl font-bold">
          <span role="img" aria-label="기술 스택">🛠️</span> Tech Stack
        </h2>
      </ScrollReveal>

      <div className="grid gap-4 sm:grid-cols-2">
        {techCategories.map((category, index) => {
          const colors = colorSchemes[category.colorScheme];
          return (
            <ScrollReveal key={category.id} direction="up" index={index} staggerDelay={100}>
              <div className="rounded-xl border border-white/20 bg-gradient-to-br from-white/30 to-white/20 p-5 shadow-md backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:from-slate-800/40 dark:to-slate-900/40">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  <span className="text-lg" role="img" aria-label={category.emojiLabel}>
                    {category.emoji}
                  </span>
                  <span>{category.label}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((item) => {
                    const svgIcon = techIcons[item];
                    return (
                      <span
                        key={item}
                        className={`inline-flex cursor-default items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm ${colors.bg} ${colors.bgHover} ${colors.text}`}
                      >
                        {svgIcon && (
                          <span className={colors.icon}>{svgIcon}</span>
                        )}
                        {item}
                      </span>
                    );
                  })}
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
