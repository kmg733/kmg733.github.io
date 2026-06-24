import { render, screen, fireEvent } from "@testing-library/react";
import CareerSection from "../CareerSection";
import type { Company } from "@/types";

const company: Company = {
  name: "테스트회사",
  role: "풀스택 개발",
  period: "2022.06 ~ 재직 중",
  description: "테스트 회사 설명",
  items: [
    {
      id: "a",
      title: "성능 개선 작업",
      summary: "성능 요약",
      category: "성능",
      date: "2025.09",
    },
    {
      id: "b",
      title: "보안 강화 작업",
      summary: "보안 요약",
      category: "보안",
      date: "2024.03",
    },
  ],
};

describe("CareerSection", () => {
  it("기본 상태(펼침)에서 타임라인 항목이 보인다", () => {
    render(<CareerSection company={company} />);

    expect(screen.getByText("성능 개선 작업")).toBeInTheDocument();
    expect(screen.getByText("보안 강화 작업")).toBeInTheDocument();
  });

  it("토글이 기본적으로 aria-expanded=true 이다", () => {
    render(<CareerSection company={company} />);

    expect(screen.getByRole("button", { name: /테스트회사/ })).toHaveAttribute(
      "aria-expanded",
      "true"
    );
  });

  it("카드 클릭 시 타임라인이 접힌다", () => {
    render(<CareerSection company={company} />);

    fireEvent.click(screen.getByRole("button", { name: /테스트회사/ }));

    expect(screen.queryByText("성능 개선 작업")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /테스트회사/ })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("재클릭 시 타임라인이 다시 펼쳐진다", () => {
    render(<CareerSection company={company} />);
    const toggle = screen.getByRole("button", { name: /테스트회사/ });

    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(screen.getByText("성능 개선 작업")).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("Enter 키로도 토글된다", () => {
    render(<CareerSection company={company} />);
    const toggle = screen.getByRole("button", { name: /테스트회사/ });

    fireEvent.keyDown(toggle, { key: "Enter" });

    expect(screen.queryByText("성능 개선 작업")).not.toBeInTheDocument();
  });

  it("회사 정보(역할·기간·설명)는 접힘 여부와 무관하게 보인다", () => {
    render(<CareerSection company={company} />);
    const toggle = screen.getByRole("button", { name: /테스트회사/ });

    fireEvent.click(toggle); // 접기

    expect(screen.getByText("풀스택 개발")).toBeInTheDocument();
    expect(screen.getByText("테스트 회사 설명")).toBeInTheDocument();
  });
});
