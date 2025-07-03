
import React, { memo, Suspense, lazy, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardSkeleton } from '@/components/ui/loading-skeleton';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';
import { supabase } from "@/integrations/supabase/client";

// Lazy load optimized dashboard components for better performance
const OptimizedEngineerDashboard = lazy(() => import('./OptimizedEngineerDashboard'));
const OptimizedInspectorDashboard = lazy(() => import('./OptimizedInspectorDashboard'));

const UnifiedDashboard = memo(() => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>('inspector');
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  
  // Enable global keyboard shortcuts
  useGlobalShortcuts();

  // Fetch user role from database
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setIsLoadingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          // Fallback to user_metadata role or default to inspector
          setUserRole(user?.user_metadata?.role || 'inspector');
        } else {
          setUserRole(data?.role || 'inspector');
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        // Fallback to user_metadata role or default to inspector
        setUserRole(user?.user_metadata?.role || 'inspector');
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const renderDashboard = () => {
    console.log('UnifiedDashboard renderDashboard:', {
      isLoadingRole,
      userRole,
      actualUserRole: user?.user_metadata?.role,
      databaseRole: userRole
    });
    
    if (isLoadingRole) {
      return <DashboardSkeleton />;
    }

    switch (userRole) {
      case 'engineer':
        console.log('Rendering OptimizedEngineerDashboard');
        return <OptimizedEngineerDashboard />;
      case 'inspector':
      default:
        console.log('Rendering OptimizedInspectorDashboard');
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
