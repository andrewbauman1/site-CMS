export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 space-y-2">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-4 w-80 bg-muted rounded animate-pulse" />
      </div>
      <div className="mb-6 flex justify-end">
        <div className="h-10 w-full md:w-64 bg-muted rounded animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="note-panel border rounded-xl h-32 animate-pulse bg-muted/40" />
        ))}
      </div>
    </div>
  )
}
