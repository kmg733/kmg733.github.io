import { ProjectService } from "@/services/project.service";
import type { IProjectRepository } from "@/interfaces";
import type { Project } from "@/types";

/**
 * ProjectService 단위 테스트
 */
describe("ProjectService", () => {
  const mockProjects: Project[] = [
    {
      id: "1",
      title: "Project One",
      description: "Description one",
      tags: ["React", "TypeScript"],
      githubUrl: "https://github.com/test/one",
    },
    {
      id: "2",
      title: "Project Two",
      description: "Description two",
      tags: ["Next.js", "TypeScript"],
      demoUrl: "https://demo.test",
    },
  ];

  const mockRepository: IProjectRepository = {
    findAll: jest.fn(() => mockProjects),
    findById: jest.fn((id: string) =>
      mockProjects.find((p) => p.id === id) ?? null
    ),
  };

  let projectService: ProjectService;

  beforeEach(() => {
    projectService = new ProjectService(mockRepository);
    jest.clearAllMocks();
  });

  describe("getAllProjects", () => {
    it("should return all projects from repository", () => {
      const result = projectService.getAllProjects();

      expect(result).toEqual(mockProjects);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe("getProjectById", () => {
    it("should return project when id exists", () => {
      const result = projectService.getProjectById("1");

      expect(result).toEqual(mockProjects[0]);
      expect(mockRepository.findById).toHaveBeenCalledWith("1");
    });

    it("should return null when id does not exist", () => {
      const result = projectService.getProjectById("999");

      expect(result).toBeNull();
    });
  });

  describe("getProjectsByTag", () => {
    it("should return projects filtered by tag", () => {
      const result = projectService.getProjectsByTag("TypeScript");

      expect(result).toHaveLength(2);
    });

    it("should return empty array when no projects have the tag", () => {
      const result = projectService.getProjectsByTag("Python");

      expect(result).toHaveLength(0);
    });
  });
});
