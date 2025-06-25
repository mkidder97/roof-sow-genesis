
import React, { memo, Suspense, lazy } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';

// Lazy load optimized dashboard components for better performance
const OptimizedEngineerDashboard = lazy(() => import('./OptimizedEngineerDashboard'));
const OptimizedInspectorDashboard = lazy(() => import('./OptimizedInspectorDashboard'));

const UnifiedDashboard = memo(() => {
  const { user } = useAuth();
  
  // Enable global keyboard shortcuts
  useGlobalShortcuts();

  const renderDashboard = () => {
    switch (user?.user_metadata?.role || 'inspector') {
      case 'engineer':
        return <OptimizedEngineerDashboard />;
      case 'inspector':
      default:
        return <OptimizedInspectorDashboard />;
    }
  };

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {renderDashboard()}
    </Suspense>
  );
});

UnifiedDashboard.displayName = 'UnifiedDashboard';

export default UnifiedDashboard;
