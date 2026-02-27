import type { Metadata } from "next";
import { projectService } from "@/lib/container";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Projects",
  description: "포트폴리오 프로젝트 목록",
};

export default function ProjectsPage() {
  const projects = projectService.getAllProjects();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-12">
        <ScrollReveal direction="fade">
          <h1 className="mb-4 text-3xl font-bold">Projects</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            제가 작업한 프로젝트들입니다.
          </p>
        </ScrollReveal>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project, index) => (
          <ScrollReveal key={project.id} direction="up" index={index} staggerDelay={120}>
            <article className="group rounded-lg border border-zinc-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:shadow-zinc-900/30">
              <h2 className="mb-2 text-xl font-semibold">{project.title}</h2>
              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                {project.description}
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 transition-all duration-200 hover:scale-105 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-4 text-sm">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    GitHub
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Demo
                  </a>
                )}
              </div>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
