import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute check:', {
    path: location.pathname,
    user: user?.email,
    role: profile?.role,
    permissions: profile?.permissions,
    requiredRole,
    requiredPermission,
    hasPermissionResult: requiredPermission ? profile?.permissions?.includes(requiredPermission) : 'n/a'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    // Check if user has permission to access this role's features
    if (requiredPermission && profile?.permissions?.includes(requiredPermission)) {
      console.log('Access granted via permission:', requiredPermission);
      return <>{children}</>;
    }
    
    // Redirect to appropriate dashboard based on user's actual role
    const redirectPath = profile?.role === 'engineer' ? '/dashboard' : '/field-inspector/dashboard';
    console.log('Redirecting due to role mismatch to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  if (requiredPermission && !profile?.permissions?.includes(requiredPermission)) {
    // Only redirect if the user doesn't have the permission
    // Don't redirect if they're already on the correct path for their role
    const redirectPath = profile?.role === 'engineer' ? '/dashboard' : '/field-inspector/dashboard';
    console.log('Missing permission, would redirect to:', redirectPath, 'current path:', location.pathname);
    if (location.pathname !== redirectPath) {
      console.log('Actually redirecting to:', redirectPath);
      return <Navigate to={redirectPath} replace />;
    }
  }

  console.log('Access granted, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;