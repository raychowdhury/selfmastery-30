import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
  return (
    <div className="flex min-h-dvh flex-col items-center px-5 py-8">
      <Skeleton className="h-4 w-32" />
      <div className="mt-14 w-full max-w-[660px]" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="mt-10 h-9 w-3/4" />
        <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
