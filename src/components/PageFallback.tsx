import { Skeleton } from './ui'

/** Placeholder shown while a page's code loads. */
export function PageFallback() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-36 w-full" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
      </div>
    </div>
  )
}
