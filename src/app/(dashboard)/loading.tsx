export default function DashboardLoading() {
  return (
    <div className="animate-fade-in flex flex-col gap-6 p-4 md:p-6 pb-20 md:pb-0">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-5">
            <div className="skeleton h-4 w-20 mb-4" />
            <div className="skeleton h-7 w-28 mb-2" />
            <div className="skeleton h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-5">
          <div className="skeleton h-4 w-28 mb-5" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-[var(--color-border-subtle)] last:border-0">
              <div>
                <div className="skeleton h-4 w-32 mb-2" />
                <div className="skeleton h-3 w-20" />
              </div>
              <div className="skeleton h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] p-5">
          <div className="skeleton h-4 w-28 mb-5" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-[var(--color-border-subtle)] last:border-0">
              <div>
                <div className="skeleton h-4 w-36 mb-2" />
                <div className="skeleton h-3 w-24" />
              </div>
              <div className="skeleton h-5 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
