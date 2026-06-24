"use client";

import { Fragment, useMemo, useState } from "react";
import TiltCard from "@/components/TiltCard";
import type { CareerCategory, CareerCategoryFilter, CareerItem } from "@/types";
import {
  filterByCategory,
  extractCategoriesWithCount,
  groupByYear,
} from "@/utils/career";

interface CareerTimelineProps {
  items: CareerItem[];
}

/** 유형별 배지 색상 (light / dark 대응) */
const categoryColor: Record<CareerCategory, string> = {
  성능: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  보안: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  아키텍처:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  인프라:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

/** 타임라인 노드 점 색상 */
const nodeColor: Record<CareerCategory, string> = {
  성능: "bg-sky-400 dark:bg-sky-500",
  보안: "bg-rose-400 dark:bg-rose-500",
  아키텍처: "bg-violet-400 dark:bg-violet-500",
  인프라: "bg-emerald-400 dark:bg-emerald-500",
};

export default function CareerTimeline({ items }: CareerTimelineProps) {
  const [filter, setFilter] = useState<CareerCategoryFilter>("전체");

  const categoryCounts = useMemo(
    () => extractCategoriesWithCount(items),
    [items]
  );

  const yearGroups = useMemo(
    () => groupByYear(filterByCategory(items, filter)),
    [items, filter]
  );

  const chips: { label: CareerCategoryFilter; count: number }[] = [
    { label: "전체", count: items.length },
    ...categoryCounts.map((c) => ({ label: c.category, count: c.count })),
  ];

  const hasHighlight = items.some((item) => item.highlight);

  return (
    <div>
      {/* 유형 필터 칩 */}
      <div
        className="mb-8 flex flex-wrap gap-2"
        role="group"
        aria-label="작업 유형 필터"
      >
        {chips.map(({ label, count }) => {
          const isActive = filter === label;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={isActive}
              onClick={() => setFilter(label)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-amber-500 text-white dark:bg-blue-600"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              <span>{label}</span>
              <span className={isActive ? "text-white/80" : "text-zinc-400 dark:text-zinc-500"}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ⭐ 범례 */}
      {hasHighlight && (
        <p className="mb-6 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span aria-hidden="true">⭐</span>
          <span>대표 성과</span>
        </p>
      )}

      {/* 연도별 세로 타임라인 */}
      <ol className="relative ml-2 border-l border-zinc-200 dark:border-zinc-700">
        {yearGroups.map((group) => (
          <Fragment key={group.year}>
            {/* 연도 마커 */}
            <li className="relative ml-6 mb-5">
              <span
                className="absolute -left-[2.05rem] top-0.5 h-4 w-4 rounded-full bg-zinc-300 ring-4 ring-white dark:bg-zinc-600 dark:ring-zinc-900"
                aria-hidden="true"
              />
              <span className="text-sm font-bold tracking-wide text-zinc-700 dark:text-zinc-300">
                {group.year}
              </span>
            </li>

            {/* 해당 연도 항목 */}
            {group.items.map((item) => (
              <li key={item.id} className="relative ml-6 pb-8">
                {/* 노드 점 */}
                <span
                  className={`absolute -left-[1.6rem] top-1.5 h-3 w-3 rounded-full ring-4 ring-white dark:ring-zinc-900 ${nodeColor[item.category]}`}
                  aria-hidden="true"
                />

                {/* 카드 */}
                <TiltCard className="rounded-xl" maxTilt={6} scale={1.01}>
                  <div className="rounded-xl border border-white/20 bg-gradient-to-br from-white/30 to-white/20 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-md dark:border-white/10 dark:from-slate-800/40 dark:to-slate-900/40">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor[item.category]}`}
                      >
                        {item.category}
                      </span>
                      <time className="text-xs text-zinc-500 dark:text-zinc-400">
                        {item.period ?? item.date}
                      </time>
                      {item.highlight && (
                        <span
                          className="text-xs text-amber-500 dark:text-amber-400"
                          role="img"
                          aria-label="대표 성과"
                        >
                          ⭐
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {item.summary}
                    </p>
                  </div>
                </TiltCard>
              </li>
            ))}
          </Fragment>
        ))}
      </ol>
    </div>
  );
}
