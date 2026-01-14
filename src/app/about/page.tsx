import type { Metadata } from "next";
import TechCard from "@/components/TechCard";

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
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-3xl dark:from-blue-500/5 dark:to-purple-500/5" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-green-500/10 to-blue-500/10 blur-3xl dark:from-green-500/5 dark:to-blue-500/5" />
      </div>

      {/* Content */}
      <div className="relative">
        {/* Header with gradient background */}
        <header className="mb-12 animate-fade-in-up rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 shadow-lg dark:from-blue-950/30 dark:to-indigo-950/30 dark:shadow-blue-900/20">
          <h1 className="text-4xl font-bold md:text-5xl">
            <span role="img" aria-label="손 흔들기">👋</span> Hello! I&apos;m{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              MinGyu
            </span>
          </h1>
          <p className="mt-4 text-xl text-zinc-700 dark:text-zinc-300">
            <span role="img" aria-label="로켓">🚀</span> 풀스택을 꿈꾸는 개발자
          </p>
        </header>

        {/* About Me with staggered animation */}
        <section className="mb-12 animate-fade-in-up animate-delay-100">
          <h2 className="mb-6 text-2xl font-semibold"><span role="img" aria-label="자기소개">🙋‍♂️</span> About Me</h2>
          <div className="group rounded-xl border border-zinc-200 bg-white/50 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50">
            <ul className="space-y-4 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-3 transition-transform duration-200 hover:translate-x-1">
                <span className="text-2xl" role="img" aria-label="목표">🎯</span>
                <span className="pt-1">풀스택 개발자가 되기 위해 끊임없이 성장 중</span>
              </li>
              <li className="flex items-start gap-3 transition-transform duration-200 hover:translate-x-1">
                <span className="text-2xl" role="img" aria-label="컴퓨터">💻</span>
                <span className="pt-1">백엔드부터 프론트엔드까지 경험을 쌓고 있습니다</span>
              </li>
              <li className="flex items-start gap-3 transition-transform duration-200 hover:translate-x-1">
                <span className="text-2xl" role="img" aria-label="책">📚</span>
                <span className="pt-1">새로운 기술을 배우고 적용하는 것을 좋아합니다</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Tech Stack with enhanced cards */}
        <section className="mb-12 animate-fade-in-up animate-delay-200">
          <h2 className="mb-6 text-2xl font-semibold"><span role="img" aria-label="기술 스택">🛠️</span> Tech Stack</h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <TechCard
              icon="💬"
              iconLabel="언어"
              title="Languages"
              items={techStack.languages}
              colorScheme="blue"
            />

            <TechCard
              icon="🧩"
              iconLabel="프레임워크"
              title="Frameworks & Libraries"
              items={techStack.frameworks}
              colorScheme="green"
            />

            <TechCard
              icon="🗄️"
              iconLabel="데이터베이스"
              title="Databases"
              items={techStack.databases}
              colorScheme="orange"
            />

            <TechCard
              icon="🔧"
              iconLabel="도구"
              title="Tools & Environment"
              items={techStack.tools}
              colorScheme="purple"
            />
          </div>
        </section>

        {/* Contact with enhanced styling */}
        <section className="animate-fade-in-up animate-delay-300">
          <h2 className="mb-6 text-2xl font-semibold"><span role="img" aria-label="연락처">📫</span> Contact</h2>
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
