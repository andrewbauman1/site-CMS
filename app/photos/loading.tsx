export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-4 w-80 bg-muted rounded animate-pulse" />
      </div>
      <div className="flex flex-wrap gap-4 justify-end">
        <div className="h-10 w-full sm:w-[200px] bg-muted rounded animate-pulse" />
        <div className="h-10 w-full sm:w-[200px] bg-muted rounded animate-pulse" />
        <div className="h-10 w-full sm:w-[200px] bg-muted rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="note-panel border rounded-xl aspect-square animate-pulse bg-muted/40" />
        ))}
      </div>
    </div>
  )
}
