
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import RoleBasedNavigation from '@/components/navigation/RoleBasedNavigation';
import Breadcrumb from '@/components/navigation/Breadcrumb';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <RoleBasedNavigation />
      <Breadcrumb />
      <UnifiedDashboard />
    </div>
  );
};

export default Dashboard;
