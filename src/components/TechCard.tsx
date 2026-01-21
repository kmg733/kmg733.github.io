interface TechCardProps {
  icon: string;
  iconLabel: string;
  title: string;
  items: string[];
  colorScheme: "amber" | "orange" | "yellow" | "rose";
}

const colorSchemes = {
  amber: {
    bg: "bg-amber-100 dark:bg-slate-800/50",
    bgHover: "hover:bg-amber-200 dark:hover:bg-slate-700/50",
    text: "text-amber-800 dark:text-slate-300",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-gray-800/50",
    bgHover: "hover:bg-orange-200 dark:hover:bg-gray-700/50",
    text: "text-orange-800 dark:text-gray-300",
  },
  yellow: {
    bg: "bg-yellow-100 dark:bg-zinc-800/50",
    bgHover: "hover:bg-yellow-200 dark:hover:bg-zinc-700/50",
    text: "text-yellow-800 dark:text-zinc-300",
  },
  rose: {
    bg: "bg-rose-100 dark:bg-stone-800/50",
    bgHover: "hover:bg-rose-200 dark:hover:bg-stone-700/50",
    text: "text-rose-800 dark:text-stone-300",
  },
};

export default function TechCard({ icon, iconLabel, title, items, colorScheme }: TechCardProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <div className="group rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/80 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
        <span className="text-xl" role="img" aria-label={iconLabel}>{icon}</span>
        <span>{title}</span>
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={`cursor-default rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 hover:scale-105 ${colors.bg} ${colors.bgHover} ${colors.text}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
