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
    <div className="mx-auto max-w-3xl px-4 py-16">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-bold">
          👋 Hello! I&apos;m <span className="text-blue-600 dark:text-blue-400">MinGyu</span>
        </h1>
        <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
          🚀 풀스택을 꿈꾸는 개발자
        </p>
      </header>
 
      {/* About Me */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold">🙋‍♂️ About Me</h2>
        <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
          <li className="flex items-start gap-2">
            <span>🎯</span>
            <span>풀스택 개발자가 되기 위해 끊임없이 성장 중</span>
          </li>
          <li className="flex items-start gap-2">
            <span>💻</span>
            <span>백엔드부터 프론트엔드까지 경험을 쌓고 있습니다</span>
          </li>
          <li className="flex items-start gap-2">
            <span>📚</span>
            <span>새로운 기술을 배우고 적용하는 것을 좋아합니다</span>
          </li>
        </ul>
      </section>

      {/* Tech Stack */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-semibold">🛠️ Tech Stack</h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Languages */}
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">
              💬 Languages
            </h3>
            <div className="flex flex-wrap gap-2">
              {techStack.languages.map((lang) => (
                <span
                  key={lang}
                  className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Frameworks & Libraries */}
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">
              🧩 Frameworks & Libraries
            </h3>
            <div className="flex flex-wrap gap-2">
              {techStack.frameworks.map((fw) => (
                <span
                  key={fw}
                  className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300"
                >
                  {fw}
                </span>
              ))}
            </div>
          </div>

          {/* Databases */}
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">
              🗄️ Databases
            </h3>
            <div className="flex flex-wrap gap-2">
              {techStack.databases.map((db) => (
                <span
                  key={db}
                  className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                >
                  {db}
                </span>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-100">
              🔧 Tools & Environment
            </h3>
            <div className="flex flex-wrap gap-2">
              {techStack.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="mb-4 text-2xl font-semibold">📫 Contact</h2>
        <ul className="space-y-2 text-zinc-600 dark:text-zinc-400">
          <li className="flex items-center gap-2">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Email:</span>
            <a
              href="mailto:mink906@gmail.com"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              mink906@gmail.com
            </a>
          </li>
          <li className="flex items-center gap-2">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">GitHub:</span>
            <a
              href="https://github.com/kmg733"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              @kmg733
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
