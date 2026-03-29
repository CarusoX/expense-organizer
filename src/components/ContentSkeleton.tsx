export default function ContentSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Budget section */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-50 rounded-lg px-4 py-3">
              <div className="h-3 w-10 bg-gray-200 rounded mb-2" />
              <div className="h-6 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Expenses header */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-gray-200 rounded" />
        <div className="h-9 w-32 bg-blue-100 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="h-9 bg-gray-100 rounded-lg" />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-10 bg-gray-50 rounded" />
        ))}
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-20 bg-gray-200 rounded" />
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <div className="h-6 w-16 bg-gray-200 rounded-md" />
            <div className="h-6 w-20 bg-gray-200 rounded-md" />
            <div className="h-6 w-16 bg-gray-200 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <div className="h-4 w-10 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-200 rounded" />
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
