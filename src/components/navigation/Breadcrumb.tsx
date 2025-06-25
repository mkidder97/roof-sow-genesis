
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Breadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbItems = () => {
    const path = location.pathname;
    const items = [];

    // Always start with Dashboard
    items.push({ label: 'Dashboard', path: '/dashboard' });

    // Parse the current path
    if (path.startsWith('/field-inspector')) {
      items.push({ label: 'Field Inspector', path: '/field-inspector/dashboard' });
      
      if (path.includes('/new')) {
        items.push({ label: 'New Inspection', path: path });
      } else if (path.match(/\/field-inspection\/[^\/]+$/)) {
        items.push({ label: 'Inspection Details', path: path });
      } else if (path.includes('/edit')) {
        items.push({ label: 'Edit Inspection', path: path });
      }
    } else if (path.startsWith('/sow-generation')) {
      items.push({ label: 'SOW Generation', path: path });
    } else if (path.startsWith('/workflow')) {
      items.push({ label: 'Workflow', path: '/workflow' });
      
      if (path.includes('/create-project')) {
        items.push({ label: 'Create Project', path: path });
      } else if (path.includes('/sow-generation')) {
        items.push({ label: 'SOW Generation', path: path });
      }
    }

    return items;
  };

  const breadcrumbItems = getBreadcrumbItems();

  if (breadcrumbItems.length <= 1) return null;

  return (
    <div className="bg-white/5 border-b border-blue-400/20">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center space-x-2 text-sm">
          <Home className="w-4 h-4 text-blue-300" />
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.path}>
              {index > 0 && <ChevronRight className="w-4 h-4 text-blue-300" />}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className={`text-xs h-6 px-2 ${
                  index === breadcrumbItems.length - 1
                    ? 'text-white font-medium'
                    : 'text-blue-300 hover:text-white hover:bg-white/10'
                }`}
                disabled={index === breadcrumbItems.length - 1}
              >
                {item.label}
              </Button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Breadcrumb;
