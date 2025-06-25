
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  ClipboardCheck, 
  FileText,
  ArrowLeft
} from 'lucide-react';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  roles: string[];
}

const RoleBasedNavigation = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const userRole = user?.user_metadata?.role || 'inspector';

  const navigationItems: NavigationItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <Home className="w-4 h-4" />,
      description: 'Main dashboard overview',
      roles: ['inspector', 'engineer']
    },
    {
      path: '/field-inspector/dashboard',
      label: 'Field Inspections',
      icon: <ClipboardCheck className="w-4 h-4" />,
      description: 'Manage field inspections',
      roles: ['inspector', 'engineer']
    },
    {
      path: '/sow-generation',
      label: 'SOW Generation',
      icon: <FileText className="w-4 h-4" />,
      description: 'Generate scope of work documents',
      roles: ['engineer']
    }
  ];

  const availableItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  const getCurrentPageInfo = () => {
    const currentPath = location.pathname;
    
    const pageDescriptions: { [key: string]: { title: string; description: string } } = {
      '/dashboard': {
        title: userRole === 'engineer' ? 'Engineer Dashboard' : 'Inspector Dashboard',
        description: userRole === 'engineer' 
          ? 'Review completed inspections and generate SOW documents'
          : 'Manage field inspections and building assessments'
      },
      '/field-inspector/dashboard': {
        title: 'Field Inspections',
        description: 'View and manage all field inspections'
      },
      '/field-inspection/new': {
        title: 'New Field Inspection',
        description: 'Create a new field inspection with mobile-optimized forms'
      },
      '/sow-generation': {
        title: 'SOW Generation',
        description: 'Generate professional scope of work documents from inspection data'
      }
    };

    // Check for dynamic routes
    if (currentPath.startsWith('/field-inspection/') && currentPath !== '/field-inspection/new') {
      return {
        title: 'Inspection Details',
        description: 'View and manage specific field inspection details'
      };
    }

    return pageDescriptions[currentPath] || {
      title: 'SOW Genesis',
      description: 'Professional roof inspection and SOW generation platform'
    };
  };

  const pageInfo = getCurrentPageInfo();
  const isOnDashboard = location.pathname === '/dashboard';

  return (
    <div className="bg-white/10 backdrop-blur-md border-b border-blue-400/30 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Back Button + Page Info */}
          <div className="flex items-center gap-4">
            {!isOnDashboard && (
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            )}
            
            <div>
              <h1 className="text-white font-semibold text-lg">{pageInfo.title}</h1>
              <p className="text-blue-200 text-sm">{pageInfo.description}</p>
            </div>
          </div>

          {/* Right: User Role + Quick Nav */}
          <div className="flex items-center gap-4">
            <Badge className={userRole === 'engineer' ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'}>
              {userRole === 'engineer' ? 'Engineer' : 'Inspector'}
            </Badge>
            
            {/* Quick Navigation */}
            <div className="hidden md:flex gap-2">
              {availableItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  size="sm"
                  className={location.pathname === item.path 
                    ? "bg-blue-600 text-white" 
                    : "text-white hover:bg-white/10"
                  }
                >
                  {item.icon}
                  <span className="ml-2 hidden lg:inline">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedNavigation;
