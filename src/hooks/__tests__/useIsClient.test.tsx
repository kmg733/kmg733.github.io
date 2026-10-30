import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useIsClient } from "../useIsClient";

function Probe() {
  return <span>{useIsClient() ? "client" : "server"}</span>;
}

describe("useIsClient", () => {
  it("서버 렌더링에서는 false를 반환한다", () => {
    const html = renderToString(<Probe />);

    expect(html).toContain("server");
    expect(html).not.toContain("client");
  });

  it("클라이언트 렌더링에서는 true를 반환한다", () => {
    render(<Probe />);

    expect(screen.getByText("client")).toBeInTheDocument();
    expect(screen.queryByText("server")).not.toBeInTheDocument();
  });
});
