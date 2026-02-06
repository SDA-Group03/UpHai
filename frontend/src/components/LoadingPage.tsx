import { Skeleton } from "@/components/ui/skeleton";

export function LoadingPage() {
  return (
    <div className="flex h-screen w-screen bg-slate-50">
      {/* Sidebar Skeleton */}
      <div className="hidden w-64 border-r p-4 lg:block">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full bg-purple-300/50" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px] bg-slate-200" />
            <Skeleton className="h-4 w-[100px] bg-slate-200" />
          </div>
        </div>
        <div className="mt-10 space-y-4">
          <Skeleton className="h-8 w-full bg-slate-200" />
          <Skeleton className="h-8 w-full bg-slate-200" />
          <Skeleton className="h-8 w-full bg-slate-200" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-slate-200" />
          <Skeleton className="h-10 w-10 rounded-full bg-purple-300/50" />
        </div>

        {/* Content Skeleton */}
        <div className="mt-8 space-y-6">
          <Skeleton className="h-32 w-full rounded-lg bg-purple-200/50" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Skeleton className="h-24 w-full bg-slate-200" />
              <Skeleton className="h-4 w-3/4 bg-slate-200" />
              <Skeleton className="h-4 w-1/2 bg-slate-200" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-24 w-full bg-slate-200" />
              <Skeleton className="h-4 w-3/4 bg-slate-200" />
              <Skeleton className="h-4 w-1/2 bg-slate-200" />
            </div>
            <div className="hidden space-y-2 lg:block">
              <Skeleton className="h-24 w-full bg-slate-200" />
              <Skeleton className="h-4 w-3/4 bg-slate-200" />
              <Skeleton className="h-4 w-1/2 bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
