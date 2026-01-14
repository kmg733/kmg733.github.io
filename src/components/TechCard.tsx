interface TechCardProps {
  icon: string;
  title: string;
  items: string[];
  colorScheme: "blue" | "green" | "orange" | "purple";
}

const colorSchemes = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    bgHover: "hover:bg-blue-200 dark:hover:bg-blue-900/50",
    text: "text-blue-700 dark:text-blue-300",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    bgHover: "hover:bg-green-200 dark:hover:bg-green-900/50",
    text: "text-green-700 dark:text-green-300",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    bgHover: "hover:bg-orange-200 dark:hover:bg-orange-900/50",
    text: "text-orange-700 dark:text-orange-300",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    bgHover: "hover:bg-purple-200 dark:hover:bg-purple-900/50",
    text: "text-purple-700 dark:text-purple-300",
  },
};

export default function TechCard({ icon, title, items, colorScheme }: TechCardProps) {
  const colors = colorSchemes[colorScheme];

  return (
    <div className="group rounded-xl border border-zinc-200 bg-white/50 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
        <span className="text-xl">{icon}</span>
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
