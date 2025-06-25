
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import EngineerDashboard from './EngineerDashboard';
import InspectorDashboard from './InspectorDashboard';

const UnifiedDashboard = () => {
  const { user } = useAuth();

  // Get user role from user metadata or default to 'inspector'
  const userRole = user?.user_metadata?.role || 'inspector';

  // Render role-specific dashboard
  if (userRole === 'engineer') {
    return <EngineerDashboard />;
  }

  // Default to inspector dashboard
  return <InspectorDashboard />;
};

export default UnifiedDashboard;
