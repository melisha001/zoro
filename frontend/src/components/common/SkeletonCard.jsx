import React from 'react';

export default function SkeletonCard({ className = '', lines = 3 }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs animate-pulse space-y-4 ${className}`}
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded-md w-3/4" />
          <div className="h-3 bg-slate-100 rounded-md w-1/2" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-3 bg-slate-100 rounded-md ${
              i === lines - 1 ? 'w-2/3' : 'w-full'
            }`}
          />
        ))}
      </div>
      <div className="h-9 bg-slate-200/70 rounded-xl w-full mt-4" />
      <span className="sr-only">Loading card...</span>
    </div>
  );
}
