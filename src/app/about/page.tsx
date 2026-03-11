import type { Metadata } from "next";
import TechCard from "@/components/TechCard";
import TiltCard from "@/components/TiltCard";
import CodeWindow from "@/components/CodeWindow";
import GradientOrbs from "@/components/GradientOrbs";
import PhilosophySection from "@/components/PhilosophySection";
import ScrollReveal from "@/components/ScrollReveal";

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

// 섹션 구분선 (Option D)
function SectionDivider() {
  return (
    <hr className="my-12 h-px border-none bg-gradient-to-r from-transparent via-amber-300/50 to-transparent dark:via-slate-600/50" />
  );
}

export default function AboutPage() {
  return (
    <div className="relative mx-auto max-w-4xl px-4 py-16">
      <GradientOrbs />

      {/* Content */}
      <div className="relative">
        {/* Header — Option G: 그라데이션 아바타 + ScrollReveal */}
        <ScrollReveal direction="fade" duration={800}>
          <TiltCard className="mb-12 rounded-2xl">
          <header className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/30 to-white/20 p-8 shadow-lg backdrop-blur-md dark:border-white/10 dark:from-slate-800/40 dark:to-slate-900/40 dark:shadow-slate-900/30">
            {/* 아바타 + 텍스트 레이아웃 */}
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              {/* 그라데이션 원형 아바타 */}
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl font-bold text-white shadow-lg dark:from-slate-500 dark:to-blue-500"
                aria-hidden="true"
              >
                M
              </div>

              {/* 텍스트 영역 */}
              <div>
                <h1 className="text-4xl font-bold md:text-5xl">
                  <span role="img" aria-label="손 흔들기">👋</span> Hello! I&apos;m{" "}
                  <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent dark:from-slate-300 dark:to-blue-300">
                    MinGyu
                  </span>
                </h1>
                <p className="mt-3 text-xl text-zinc-700 dark:text-zinc-300">
                  <span role="img" aria-label="로켓">🚀</span> 어제보다 성장하는 개발자
                </p>
              </div>
            </div>
          </header>
          </TiltCard>
        </ScrollReveal>

        {/* CodeWindow */}
        <ScrollReveal direction="up" delay={100}>
          <div className="mb-12">
            <CodeWindow />
          </div>
        </ScrollReveal>

        {/* About Me */}
        <ScrollReveal direction="up" delay={200}>
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold">
              <span role="img" aria-label="자기소개">🙋‍♂️</span> About Me
            </h2>
            <TiltCard className="rounded-xl">
              <div className="rounded-xl border border-white/20 bg-gradient-to-br from-white/30 to-white/20 p-6 shadow-md backdrop-blur-md transition-all duration-300 hover:shadow-xl dark:border-white/10 dark:from-slate-800/40 dark:to-slate-900/40">
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
            </TiltCard>
          </section>
        </ScrollReveal>

        {/* Divider: About Me ↔ Tech Stack (Option D) */}
        <SectionDivider />

        {/* Tech Stack */}
        <ScrollReveal direction="up" delay={100}>
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-semibold">
              <span role="img" aria-label="기술 스택">🛠️</span> Tech Stack
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              <TiltCard className="rounded-xl">
                <TechCard
                  icon="💬"
                  iconLabel="언어"
                  title="Languages"
                  items={techStack.languages}
                  colorScheme="sky"
                />
              </TiltCard>

              <TiltCard className="rounded-xl">
                <TechCard
                  icon="🧩"
                  iconLabel="프레임워크"
                  title="Frameworks & Libraries"
                  items={techStack.frameworks}
                  colorScheme="violet"
                />
              </TiltCard>

              <TiltCard className="rounded-xl">
                <TechCard
                  icon="🗄️"
                  iconLabel="데이터베이스"
                  title="Databases"
                  items={techStack.databases}
                  colorScheme="emerald"
                />
              </TiltCard>

              <TiltCard className="rounded-xl">
                <TechCard
                  icon="🔧"
                  iconLabel="도구"
                  title="Tools & Environment"
                  items={techStack.tools}
                  colorScheme="amber"
                />
              </TiltCard>
            </div>
          </section>
        </ScrollReveal>

        {/* Divider: Tech Stack ↔ Philosophy (Option D) */}
        <SectionDivider />

        {/* Philosophy Section — animate 클래스는 PhilosophySection 내부에서 제거됨 */}
        <ScrollReveal direction="up" delay={100}>
          <PhilosophySection />
        </ScrollReveal>

        {/* Divider: Philosophy ↔ Contact (Option D) */}
        <SectionDivider />

        {/* Contact — Option F: 2열 카드 */}
        <ScrollReveal direction="up" delay={100}>
          <section>
            <h2 className="mb-6 text-2xl font-semibold">
              <span role="img" aria-label="연락처">📫</span> Contact
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Email 카드 */}
              <TiltCard className="rounded-xl">
              <a
                href="mailto:mink906@gmail.com"
                className="group flex items-center gap-4 rounded-xl border border-white/20 bg-gradient-to-br from-white/30 to-white/20 p-6 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/50 hover:shadow-lg hover:shadow-amber-200/30 dark:border-white/10 dark:from-slate-800/40 dark:to-slate-900/40 dark:hover:border-slate-500/50 dark:hover:shadow-slate-700/30"
              >
                {/* 메일 아이콘 */}
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition-colors duration-300 group-hover:bg-amber-200 dark:bg-slate-700 dark:text-blue-400 dark:group-hover:bg-slate-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Email</p>
                  <p className="truncate text-sm text-amber-700 transition-colors duration-200 group-hover:text-amber-900 dark:text-blue-400 dark:group-hover:text-blue-300">
                    mink906@gmail.com
                  </p>
                </div>
              </a>
              </TiltCard>

              {/* GitHub 카드 */}
              <TiltCard className="rounded-xl">
              <a
                href="https://github.com/kmg733"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-xl border border-white/20 bg-gradient-to-br from-white/30 to-white/20 p-6 shadow-md backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/50 hover:shadow-lg hover:shadow-amber-200/30 dark:border-white/10 dark:from-slate-800/40 dark:to-slate-900/40 dark:hover:border-slate-500/50 dark:hover:shadow-slate-700/30"
              >
                {/* GitHub 아이콘 */}
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition-colors duration-300 group-hover:bg-amber-200 dark:bg-slate-700 dark:text-blue-400 dark:group-hover:bg-slate-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">GitHub</p>
                  <p className="text-sm text-amber-700 transition-colors duration-200 group-hover:text-amber-900 dark:text-blue-400 dark:group-hover:text-blue-300">
                    @kmg733
                  </p>
                </div>
              </a>
              </TiltCard>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
}
