export default function Loading() {
  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded" />
      <div className="bg-white rounded-xl shadow p-5 space-y-3">
        <div className="h-5 w-full bg-gray-200 rounded" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-full bg-gray-100 rounded" />
        ))}
      </div>
    </main>
  );
}