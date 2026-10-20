import React from 'react';
import SkeletonCard from './SkeletonCard';

export default function SkeletonList({
  count = 3,
  gridClassName = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  lines = 3
}) {
  return (
    <div role="status" aria-busy="true" className={gridClassName}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
      <span className="sr-only">Loading content list...</span>
    </div>
  );
}
