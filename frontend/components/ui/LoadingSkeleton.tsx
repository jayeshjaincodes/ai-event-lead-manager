import React from 'react';

export function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {/* Table skeleton rows */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 py-3 animate-pulse border-b border-slate-100 last:border-0"
        >
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            <div className="h-3 bg-slate-100 rounded w-1/3"></div>
          </div>
          <div className="h-4 bg-slate-100 rounded w-1/6 hidden sm:block"></div>
          <div className="h-6 bg-slate-200 rounded-full w-24"></div>
          <div className="h-4 bg-slate-100 rounded w-12"></div>
        </div>
      ))}
    </div>
  );
}
