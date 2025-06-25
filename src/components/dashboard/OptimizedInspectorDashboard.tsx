
import React, { memo, useState, useMemo, useCallback } from 'react';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardCheck, 
  ArrowRight,
  Building,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const MetricCard = memo<MetricCardProps>(({ title, value, description, icon, color }) => (
  <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/15 transition-colors">
    <CardContent className="p-6 text-center">
      <div className={`w-12 h-12 ${color}/20 rounded-full flex items-center justify-center mx-auto mb-3`}>
        {icon}
      </div>
      <div className={`text-3xl font-bold ${color} mb-2`}>{value}</div>
      <div className="text-blue-200">{title}</div>
      <div className="text-blue-300 text-xs mt-1">{description}</div>
    </CardContent>
  </Card>
));

MetricCard.displayName = 'MetricCard';

interface InspectionRowProps {
  inspection: any;
  onNavigate: (path: string) => void;
  getStatusColor: (status: string) => string;
}

const InspectionRow = memo<InspectionRowProps>(({ inspection, onNavigate, getStatusColor }) => {
  const handleView = useCallback(() => {
    onNavigate(`/field-inspection/${inspection.id}`);
  }, [inspection.id, onNavigate]);

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h4 className="text-white font-medium">{inspection.project_name}</h4>
          <Badge className={`${getStatusColor(inspection.status)} text-white text-xs`}>
            {inspection.status}
          </Badge>
        </div>
        <div className="flex items-center text-blue-200 text-sm mt-1">
          <MapPin className="w-3 h-3 mr-1" />
          {inspection.project_address}
        </div>
        <div className="flex items-center text-blue-300 text-xs mt-1">
          <Calendar className="w-3 h-3 mr-1" />
          {format(new Date(inspection.created_at || ''), 'MMM dd, yyyy')}
        </div>
      </div>
      <Button
        onClick={handleView}
        variant="outline"
        size="sm"
        className="border-blue-400 text-blue-200 hover:bg-blue-600"
      >
        View
      </Button>
    </div>
  );
});

InspectionRow.displayName = 'InspectionRow';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const QuickActionCard = memo<QuickActionCardProps>(({ title, description, icon, color, onClick }) => (
  <Card 
    className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all cursor-pointer"
    onClick={onClick}
  >
    <CardContent className="p-6 text-center">
      <div className={`w-16 h-16 ${color}/20 rounded-full flex items-center justify-center mx-auto mb-4`}>
        {icon}
      </div>
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-blue-200 text-sm">{description}</p>
    </CardContent>
  </Card>
));

QuickActionCard.displayName = 'QuickActionCard';

const OptimizedInspectorDashboard = memo(() => {
  const { inspections } = useFieldInspections();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-500';
      case 'Completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const { draftInspections, completedInspections, metrics } = useMemo(() => {
    const drafts = inspections.filter(i => i.status === 'Draft');
    const completed = inspections.filter(i => i.status === 'Completed');
    
    return {
      draftInspections: drafts,
      completedInspections: completed,
      metrics: {
        draft: drafts.length,
        completed: completed.length,
        total: inspections.length
      }
    };
  }, [inspections]);

  const metricCards = useMemo(() => [
    {
      title: "Draft Inspections",
      value: metrics.draft,
      description: "In progress",
      icon: <Clock className="w-6 h-6 text-yellow-400" />,
      color: "text-yellow-400"
    },
    {
      title: "Completed",
      value: metrics.completed,
      description: "Ready for SOW",
      icon: <CheckCircle className="w-6 h-6 text-green-400" />,
      color: "text-green-400"
    },
    {
      title: "Total Inspections",
      value: metrics.total,
      description: "All time",
      icon: <Building className="w-6 h-6 text-blue-400" />,
      color: "text-blue-400"
    }
  ], [metrics]);

  const quickActions = useMemo(() => [
    {
      title: "New Field Inspection",
      description: "Start a new building inspection",
      icon: <ClipboardCheck className="w-8 h-8 text-green-400" />,
      color: "bg-green-500",
      onClick: () => handleNavigate('/field-inspection/new')
    },
    {
      title: "View All Inspections",
      description: "Browse and manage inspections",
      icon: <Building className="w-8 h-8 text-blue-400" />,
      color: "bg-blue-500",
      onClick: () => handleNavigate('/field-inspector/dashboard')
    }
  ], [handleNavigate]);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Inspector Dashboard Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Inspector Dashboard</h1>
        <p className="text-blue-200 text-lg">Manage field inspections and building assessments</p>
        <Badge className="mt-2 bg-blue-600 text-white">
          Role: Inspector
        </Badge>
      </div>

      {/* Inspector Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {metricCards.map((card, index) => (
          <MetricCard
            key={index}
            title={card.title}
            value={card.value}
            description={card.description}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>

      {/* Inspector Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/10 backdrop-blur-md">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="active-inspections" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Active Inspections
          </TabsTrigger>
          <TabsTrigger value="quick-actions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Quick Actions
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Recent Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inspections.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardCheck className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-200">No inspections yet</p>
                  <p className="text-blue-300 text-sm mt-2">Start your first inspection to see it here</p>
                  <Button 
                    onClick={() => handleNavigate('/field-inspection/new')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Inspection
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspections.slice(0, 5).map((inspection) => (
                    <InspectionRow
                      key={inspection.id}
                      inspection={inspection}
                      onNavigate={handleNavigate}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Inspections Tab */}
        <TabsContent value="active-inspections" className="space-y-6">
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-white">Draft Inspections</CardTitle>
              <CardDescription className="text-blue-200">
                Inspections in progress that need to be completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {draftInspections.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-blue-200">No draft inspections</p>
                  <p className="text-blue-300 text-sm mt-2">All inspections are completed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {draftInspections.map((inspection) => (
                    <div key={inspection.id} className="p-4 bg-white/5 rounded-lg border border-yellow-400/30">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{inspection.project_name}</h3>
                          <p className="text-blue-200 text-sm mt-1">{inspection.project_address}</p>
                          <div className="flex items-center text-blue-300 text-xs mt-2">
                            <Calendar className="w-3 h-3 mr-1" />
                            Started: {format(new Date(inspection.created_at || ''), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleNavigate(`/field-inspection/${inspection.id}/edit`)}
                          className="bg-yellow-600 hover:bg-yellow-700"
                          size="sm"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Continue
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                title={action.title}
                description={action.description}
                icon={action.icon}
                color={action.color}
                onClick={action.onClick}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

OptimizedInspectorDashboard.displayName = 'OptimizedInspectorDashboard';

export default OptimizedInspectorDashboard;
