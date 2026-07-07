export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-72 bg-muted rounded animate-pulse" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="note-panel border rounded-xl h-32 animate-pulse bg-muted/40" />
        ))}
      </div>
      <div className="note-panel border rounded-xl h-64 animate-pulse bg-muted/40" />
    </div>
  )
}
