// Structural mirror of AmlDataGrid — same DOM hierarchy, grid columns, and borders.
// Used during async payload resolution to prevent layout shift (Skeleton Hydration).

const ROW_COUNT = 10;

const SkeletonBar = ({ className = 'w-3/4' }: { className?: string }) => (
  <div className={`h-4 bg-slate-700/50 rounded animate-pulse ${className}`} />
);

export const AmlDataGridSkeleton = () => (
  <div
    className="rounded-xl border border-border bg-surface overflow-hidden"
    role="status"
    aria-label="Loading AML data"
  >
    {/* Grid header — structural mirror of AmlDataGrid title + actions strip */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-elevated">
      <SkeletonBar className="w-48" />
      <div className="flex items-center gap-2">
        <SkeletonBar className="w-20" />
        <SkeletonBar className="w-24" />
      </div>
    </div>

    {/* Column headers — same grid template; pulsing placeholders for semantics */}
    <div className="hidden md:grid md:grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr] gap-3 px-4 py-2 text-xs font-semibold text-text-muted uppercase tracking-wide border-b border-border bg-surface-elevated">
      <SkeletonBar className="w-16" />
      <SkeletonBar className="w-14" />
      <SkeletonBar className="w-8" />
      <SkeletonBar className="w-12" />
      <SkeletonBar className="w-10" />
      <div className="text-right">
        <SkeletonBar className="w-20 ml-auto" />
      </div>
    </div>

    {/* Scroll container — fixed height to match real grid; no virtualizer */}
    <div className="h-[500px] overflow-auto">
      <div className="relative">
        {Array.from({ length: ROW_COUNT }).map((_, i) => (
          <div key={i}>
            {/* Desktop row — same grid-cols and padding as AmlDataGrid */}
            <div className="hidden md:grid md:grid-cols-[1fr_2fr_1.5fr_1fr_1fr_1fr] gap-3 items-center px-4 py-3 text-sm border-b border-border bg-surface">
              <SkeletonBar />
              <div className="flex flex-col gap-1.5 min-w-0">
                <SkeletonBar className="w-4/5" />
                <SkeletonBar className="w-3/5" />
              </div>
              <SkeletonBar />
              <SkeletonBar className="w-16" />
              <SkeletonBar className="w-8" />
              <div className="text-right">
                <SkeletonBar className="w-16 ml-auto" />
              </div>
            </div>

            {/* Mobile card — structural mirror of AmlDataGrid card */}
            <div className="md:hidden mx-3 my-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-surface">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <SkeletonBar className="w-32" />
                  <SkeletonBar className="w-40" />
                </div>
                <SkeletonBar className="w-14 h-5 rounded-full shrink-0" />
              </div>
              <div className="border-t border-slate-100 dark:border-slate-800 mb-3" />
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex justify-between items-center">
                    <SkeletonBar className="w-24" />
                    <SkeletonBar className="w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
