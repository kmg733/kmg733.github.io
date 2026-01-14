import type { Metadata } from "next";
import { projectService } from "@/lib/container";

export const metadata: Metadata = {
  title: "Projects",
  description: "포트폴리오 프로젝트 목록",
};

export default function ProjectsPage() {
  const projects = projectService.getAllProjects();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <header className="mb-12">
        <h1 className="mb-4 text-3xl font-bold">Projects</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          제가 작업한 프로젝트들입니다.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <article
            key={project.id}
            className="group rounded-lg border border-zinc-200 p-6 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
          >
            <h2 className="mb-2 text-xl font-semibold">{project.title}</h2>
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              {project.description}
            </p>

            <div className="mb-4 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
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
        ))}
      </div>
    </div>
  );
}
