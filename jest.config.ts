import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // 테스트가 import하지 않은 파일도 lcov에 0%로 남겨야 scripts/diff-coverage.mjs 가 잡는다
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "scripts/**/*.mjs", "!**/*.d.ts"],
  coverageReporters: ["text-summary", "lcov"],
};

export default createJestConfig(config);
