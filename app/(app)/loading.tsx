import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-10 w-64" />
      <Skeleton className="mt-5 h-1.5 w-full" />
      <Skeleton className="mt-7 h-24 w-full" />
      <Skeleton className="mt-10 h-7 w-28" />
      <div className="mt-5 flex flex-col gap-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
