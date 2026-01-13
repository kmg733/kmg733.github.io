import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "풀스택 개발자를 꿈꾸는 MinGyu입니다.",
};

const techStack = {
  languages: ["Java", "JavaScript", "TypeScript"],
  frameworks: ["Spring Boot", "Spring Security", "React", "Bootstrap", "Tailwind CSS"],
  databases: ["PostgreSQL", "MariaDB"],
  tools: ["Git", "GitHub", "GitLab"],
};

export default function AboutPage() {
  return (
    <div className="relative mx-auto max-w-3xl px-4 py-16">
      {/* Background Decorative Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl dark:from-blue-500/5 dark:to-purple-500/5" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-green-500/10 to-blue-500/10 blur-3xl dark:from-green-500/5 dark:to-blue-500/5" />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Header with gradient background */}
        <header className="mb-12 animate-fade-in-up rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-lg dark:from-blue-950/30 dark:to-indigo-950/30 dark:shadow-blue-900/20">
          <h1 className="text-4xl font-bold md:text-5xl">
            👋 Hello! I&apos;m{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              MinGyu
            </span>
          </h1>
          <p className="mt-4 text-xl text-zinc-700 dark:text-zinc-300">
            🚀 풀스택을 꿈꾸는 개발자
          </p>
        </header>

        {/* About Me with staggered animation */}
        <section className="mb-12 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="mb-6 text-2xl font-semibold">🙋‍♂️ About Me</h2>
          <div className="group rounded-xl border border-zinc-200 bg-white/50 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50">
            <ul className="space-y-4 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-3 transition-transform duration-200 hover:translate-x-1">
                <span className="text-2xl">🎯</span>
                <span className="pt-1">풀스택 개발자가 되기 위해 끊임없이 성장 중</span>
              </li>
              <li className="flex items-start gap-3 transition-transform duration-200 hover:translate-x-1">
                <span className="text-2xl">💻</span>
                <span className="pt-1">백엔드부터 프론트엔드까지 경험을 쌓고 있습니다</span>
              </li>
              <li className="flex items-start gap-3 transition-transform duration-200 hover:translate-x-1">
                <span className="text-2xl">📚</span>
                <span className="pt-1">새로운 기술을 배우고 적용하는 것을 좋아합니다</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Tech Stack with enhanced cards */}
        <section className="mb-12 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="mb-6 text-2xl font-semibold">🛠️ Tech Stack</h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Languages */}
            <div className="group rounded-xl border border-zinc-200 bg-white/50 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                <span className="text-xl">💬</span>
                <span>Languages</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {techStack.languages.map((lang) => (
                  <span
                    key={lang}
                    className="cursor-default rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 transition-all duration-200 hover:scale-105 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            {/* Frameworks & Libraries */}
            <div className="group rounded-xl border border-zinc-200 bg-white/50 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                <span className="text-xl">🧩</span>
                <span>Frameworks & Libraries</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {techStack.frameworks.map((fw) => (
                  <span
                    key={fw}
                    className="cursor-default rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 transition-all duration-200 hover:scale-105 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
                  >
                    {fw}
                  </span>
                ))}
              </div>
            </div>

            {/* Databases */}
            <div className="group rounded-xl border border-zinc-200 bg-white/50 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                <span className="text-xl">🗄️</span>
                <span>Databases</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {techStack.databases.map((db) => (
                  <span
                    key={db}
                    className="cursor-default rounded-full bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-700 transition-all duration-200 hover:scale-105 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50"
                  >
                    {db}
                  </span>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div className="group rounded-xl border border-zinc-200 bg-white/50 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                <span className="text-xl">🔧</span>
                <span>Tools & Environment</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {techStack.tools.map((tool) => (
                  <span
                    key={tool}
                    className="cursor-default rounded-full bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-700 transition-all duration-200 hover:scale-105 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact with enhanced styling */}
        <section className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="mb-6 text-2xl font-semibold">📫 Contact</h2>
          <div className="rounded-xl border border-zinc-200 bg-white/50 p-6 shadow-md backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
            <ul className="space-y-4 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-3 transition-all duration-200 hover:translate-x-1">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">Email:</span>
                <a
                  href="mailto:mink906@gmail.com"
                  className="text-blue-600 transition-colors duration-200 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  mink906@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3 transition-all duration-200 hover:translate-x-1">
                <span className="font-medium text-zinc-900 dark:text-zinc-100">GitHub:</span>
                <a
                  href="https://github.com/kmg733"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 transition-colors duration-200 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  @kmg733
                </a>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
