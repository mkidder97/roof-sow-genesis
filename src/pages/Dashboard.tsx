
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import RoleBasedNavigation from '@/components/navigation/RoleBasedNavigation';
import Breadcrumb from '@/components/navigation/Breadcrumb';

const Dashboard = () => {
  const { user, loading, updateUserRole } = useAuth();

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

  const currentRole = user?.user_metadata?.role || 'inspector';

  const handleRoleSwitch = async (newRole: string) => {
    const { error } = await updateUserRole(newRole);
    if (!error) {
      window.location.reload(); // Refresh to update the UI
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <RoleBasedNavigation />
      <Breadcrumb />
      
      {/* Temporary Role Switcher for Testing */}
      <div className="container mx-auto px-4 py-4">
        <Card className="bg-white/10 backdrop-blur-md border-yellow-400/50 mb-4">
          <CardHeader>
            <CardTitle className="text-yellow-400 text-sm">🧪 Development Mode - Role Switcher</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-white text-sm">Current Role: <strong>{currentRole}</strong></span>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleRoleSwitch('inspector')}
                  size="sm"
                  variant={currentRole === 'inspector' ? 'default' : 'outline'}
                  className="text-xs"
                >
                  Switch to Inspector
                </Button>
                <Button
                  onClick={() => handleRoleSwitch('engineer')}
                  size="sm"
                  variant={currentRole === 'engineer' ? 'default' : 'outline'}
                  className="text-xs"
                >
                  Switch to Engineer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <UnifiedDashboard />
    </div>
  );
};

export default Dashboard;
