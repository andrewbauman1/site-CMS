export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-4 w-80 bg-muted rounded animate-pulse" />
      </div>
      <div className="mb-6 flex flex-wrap gap-4 justify-end">
        <div className="h-10 w-full sm:w-[200px] bg-muted rounded animate-pulse" />
        <div className="h-10 w-full sm:w-[200px] bg-muted rounded animate-pulse" />
        <div className="h-10 w-full sm:w-[200px] bg-muted rounded animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="note-panel border rounded-xl h-64 animate-pulse bg-muted/40" />
        ))}
      </div>
    </div>
  )
}
