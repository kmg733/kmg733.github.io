"use client";

import { useId, useState } from "react";
import TiltCard from "@/components/TiltCard";
import CareerTimeline from "@/components/CareerTimeline";
import type { Company } from "@/types";

interface CareerSectionProps {
  company: Company;
  /** 기본 펼침 여부 (기본값: true) */
  defaultExpanded?: boolean;
}

export default function CareerSection({
  company,
  defaultExpanded = true,
}: CareerSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const regionId = useId();

  const toggle = () => setExpanded((prev) => !prev);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <section className="mb-8">
      {/* 회사 카드 = disclosure 토글 */}
      <TiltCard className="rounded-2xl">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={toggle}
          onKeyDown={handleKeyDown}
          className="cursor-pointer rounded-2xl border border-white/20 bg-gradient-to-br from-white/30 to-white/20 p-6 shadow-lg backdrop-blur-md transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-white/10 dark:from-slate-800/40 dark:to-slate-900/40 dark:focus-visible:ring-blue-500"
        >
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="flex items-center gap-2 text-2xl font-semibold">
              {company.name}
              {/* chevron: 펼침 시 아래, 접힘 시 우측 */}
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 text-zinc-400 transition-transform duration-300 dark:text-zinc-500 ${
                  expanded ? "rotate-0" : "-rotate-90"
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </h2>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {company.period}
            </span>
          </div>
          <p className="mb-3 text-sm font-medium text-amber-700 dark:text-blue-400">
            {company.role}
          </p>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {company.description}
          </p>
        </div>
      </TiltCard>

      {/* 펼침 영역: 타임라인 */}
      {expanded && (
        <div id={regionId} className="mt-8">
          <CareerTimeline items={company.items} />
        </div>
      )}
    </section>
  );
}
