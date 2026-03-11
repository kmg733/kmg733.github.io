"use client";

import TiltCard from "@/components/TiltCard";

const philosophyValues = [
  {
    emoji: "🎯",
    emojiLabel: "목표",
    title: "꾸준한 성장",
    description: "매일 조금씩, 어제보다 나은 코드를 작성합니다",
  },
  {
    emoji: "📝",
    emojiLabel: "기록",
    title: "지식 공유",
    description: "배운 것을 블로그에 기록하고 나눕니다",
  },
  {
    emoji: "🔧",
    emojiLabel: "도구",
    title: "문제 해결",
    description: "복잡한 문제를 단순하게 풀어내는 것을 좋아합니다",
  },
];

export default function PhilosophySection() {
  return (
    <section className="mb-12">
      <h2 className="mb-6 text-2xl font-semibold">
        <span role="img" aria-label="철학">💡</span> My Philosophy
      </h2>

      {/* Blockquote */}
      <blockquote className="mb-8 border-l-[3px] border-amber-500 pl-5 dark:border-slate-400">
        <p className="text-base font-medium leading-relaxed text-zinc-600 italic dark:text-zinc-300">
          좋은 코드는 동작하는 것을 넘어, 읽기 쉽고 유지보수하기 좋은 코드입니다.
          끊임없이 배우고, 배운 것을 나누며 함께 성장하고 싶습니다.
        </p>
      </blockquote>

      {/* Value Cards */}
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
        {philosophyValues.map((value) => (
          <TiltCard key={value.title} className="rounded-xl">
            <div
              className="rounded-xl border border-white/20 bg-gradient-to-br from-white/30 to-white/20 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-amber-300/50 hover:shadow-md dark:border-white/10 dark:from-slate-800/40 dark:to-slate-900/40 dark:hover:border-slate-500/50"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-2xl" role="img" aria-label={value.emojiLabel}>
                  {value.emoji}
                </span>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {value.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {value.description}
              </p>
            </div>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}
