import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-gradient-to-r from-[#0e1223] via-[#0f172a] to-[#0e1223] bg-[length:200%_100%]",
        className
      )}
      style={{ animation: "skeleton-shimmer 1.6s ease-in-out infinite" }}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#0e1223] p-4 space-y-2.5">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function TradeRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-[#0f172a] last:border-0">
      <Skeleton className="w-1 h-10" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-3.5 w-16 ml-auto" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
    </div>
  );
}
