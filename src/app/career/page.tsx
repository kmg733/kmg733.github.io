import type { Metadata } from "next";
import GradientOrbs from "@/components/GradientOrbs";
import ScrollReveal from "@/components/ScrollReveal";
import CareerSection from "@/components/CareerSection";
import { company } from "@/data/career";

export const metadata: Metadata = {
  title: "Career",
  description: `${company.name}에서의 풀스택 개발 경력과 주요 작업 타임라인.`,
};

export default function CareerPage() {
  return (
    <div className="relative mx-auto max-w-4xl px-4 py-16">
      <GradientOrbs />

      <div className="relative">
        {/* Header */}
        <ScrollReveal direction="fade" duration={800}>
          <header className="mb-12">
            <h1 className="mb-4 text-3xl font-bold md:text-4xl">
              <span role="img" aria-label="가방">💼</span> Career
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              성능 · 보안 · 아키텍처 · 인프라 관점에서 수행한 주요 작업을 시간순으로 정리했습니다.
            </p>
          </header>
        </ScrollReveal>

        {/* 회사 섹션 (카드 클릭으로 타임라인 접기/펼치기) */}
        <ScrollReveal direction="up" delay={100}>
          <CareerSection company={company} />
        </ScrollReveal>
      </div>
    </div>
  );
}
