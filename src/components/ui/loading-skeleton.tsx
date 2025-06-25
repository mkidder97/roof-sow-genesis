
import React, { memo } from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = memo<SkeletonProps>(({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
));

Skeleton.displayName = 'Skeleton';

interface DashboardSkeletonProps {
  cards?: number;
  rows?: number;
}

export const DashboardSkeleton = memo<DashboardSkeletonProps>(({ 
  cards = 4, 
  rows = 3 
}) => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>
    
    {/* Metrics Cards Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
    
    {/* Content Skeleton */}
    <div className="border rounded-lg p-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  </div>
));

DashboardSkeleton.displayName = 'DashboardSkeleton';

export const InspectionCardSkeleton = memo(() => (
  <div className="p-4 bg-white/5 rounded-lg space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="h-4 w-32 bg-white/20" />
      <Skeleton className="h-5 w-16 bg-white/20" />
    </div>
    <div className="flex items-center space-x-1">
      <Skeleton className="h-3 w-3 bg-white/20" />
      <Skeleton className="h-3 w-48 bg-white/20" />
    </div>
    <div className="flex items-center space-x-1">
      <Skeleton className="h-3 w-3 bg-white/20" />
      <Skeleton className="h-3 w-24 bg-white/20" />
    </div>
  </div>
));

InspectionCardSkeleton.displayName = 'InspectionCardSkeleton';
