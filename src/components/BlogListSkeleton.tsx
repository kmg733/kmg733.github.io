const SKELETON_CARD_COUNT = 3;

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`}
    />
  );
}

function SkeletonCard() {
  return (
    <div data-testid="skeleton-card" className="space-y-3 py-6">
      <SkeletonLine className="h-5 w-3/4" />
      <SkeletonLine className="h-4 w-1/2" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-5/6" />
    </div>
  );
}

export default function BlogListSkeleton() {
  return (
    <div className="flex gap-8" aria-hidden="true">
      {/* 사이드바 스켈레톤 */}
      <aside
        data-testid="skeleton-sidebar"
        className="hidden w-56 shrink-0 lg:block"
      >
        <div className="space-y-3">
          <SkeletonLine className="h-5 w-20" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-3/4" />
          <SkeletonLine className="h-4 w-full" />
          <SkeletonLine className="h-4 w-2/3" />
        </div>
      </aside>

      {/* 메인 콘텐츠 스켈레톤 */}
      <div data-testid="skeleton-main" className="min-w-0 flex-1">
        {/* 검색바 스켈레톤 */}
        <div className="mb-6">
          <SkeletonLine className="h-10 w-full" />
        </div>

        {/* 포스트 카드 스켈레톤 */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
