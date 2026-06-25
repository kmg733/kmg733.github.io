"use client";

import { useId, useState } from "react";
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

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/30 to-white/20 shadow-lg backdrop-blur-md dark:border-white/10 dark:from-slate-800/40 dark:to-slate-900/40">
      {/* 헤더 = 아코디언 토글 (WAI-ARIA disclosure 패턴) */}
      <h2 className="text-2xl font-semibold">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 p-6 text-left transition-colors hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400 dark:hover:bg-white/5 dark:focus-visible:ring-blue-500"
        >
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span>{company.name}</span>
            <span className="text-sm font-medium text-amber-700 dark:text-blue-400">
              {company.role}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
              {company.period}
            </span>
            {/* chevron: 펼침 시 아래, 접힘 시 우측 */}
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 text-zinc-400 transition-transform duration-300 motion-reduce:transition-none dark:text-zinc-500 ${
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
          </span>
        </button>
      </h2>

      {/* 접힘 영역: grid-rows 0fr↔1fr 트릭으로 높이 애니메이션 */}
      <div
        id={regionId}
        aria-hidden={!expanded}
        inert={!expanded ? true : undefined}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-6">
            <p className="mb-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {company.description}
            </p>
            <CareerTimeline items={company.items} />
          </div>
        </div>
      </div>
    </section>
  );
}
