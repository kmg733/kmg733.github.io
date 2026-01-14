/**
 * 포트폴리오 프로젝트 (Domain Entity)
 */
export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  demoUrl?: string;
  image?: string;
}
