export default function Loading() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-gray-200 rounded" />
        <div className="h-7 w-28 bg-gray-200 rounded" />
      </div>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow p-5 space-y-3">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
        </div>
      ))}
      <p className="text-center text-sm text-gray-500">Loading your study data...</p>
    </main>
  );
}