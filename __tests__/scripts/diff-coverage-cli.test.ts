/**
 * diff-coverage CLI 진입점 테스트: 인자를 넘기고 종료 코드를 그대로 쓰는지
 */

jest.mock("../../scripts/diff-coverage-lib.mjs", () => ({
  run: jest.fn(() => 1),
}));

describe("scripts/diff-coverage.mjs", () => {
  const originalArgv = process.argv;
  const originalExitCode = process.exitCode;

  afterEach(() => {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
  });

  it("명령행 인자를 run 에 넘기고 반환값을 종료 코드로 쓴다", async () => {
    process.argv = ["node", "scripts/diff-coverage.mjs", "origin/develop"];

    await import("../../scripts/diff-coverage.mjs");
    const { run } = await import("../../scripts/diff-coverage-lib.mjs");

    expect(run).toHaveBeenCalledWith(["origin/develop"]);
    expect(process.exitCode).toBe(1);
  });
});
