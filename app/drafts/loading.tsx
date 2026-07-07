export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
      </div>
      <div className="mb-6 flex flex-wrap gap-4 justify-end">
        <div className="h-10 w-full sm:w-[200px] bg-muted rounded animate-pulse" />
        <div className="h-10 w-full sm:w-[200px] bg-muted rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="note-panel border rounded-xl h-28 animate-pulse bg-muted/40" />
        ))}
      </div>
    </div>
  )
}
