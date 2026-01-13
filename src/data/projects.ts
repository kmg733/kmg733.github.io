import type { Project } from "@/types";

/**
 * 포트폴리오 프로젝트 데이터
 *
 * 프로젝트를 추가하려면 이 배열에 새 항목을 추가하세요.
 */
export const projectsData: Project[] = [
  {
    id: "1",
    title: "Portfolio & Blog",
    description: "Next.js와 TypeScript로 만든 Manuel의 포트폴리오 및 블로그 사이트",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    githubUrl: "https://github.com/kmg733/kmg733.github.io",
    demoUrl: "https://kmg733.github.io",
  },
];
