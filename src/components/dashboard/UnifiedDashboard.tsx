
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkflow } from '@/hooks/useWorkflow';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardCheck, 
  FileText, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Building,
  Search,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const UnifiedDashboard = () => {
  const { user } = useAuth();
  const { projects, userTasks } = useWorkflow();
  const { inspections } = useFieldInspections();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Get user role from user metadata or default to 'inspector'
  const userRole = user?.user_metadata?.role || 'inspector';

  // Filter completed inspections ready for SOW
  const readyForSOW = inspections.filter(inspection => 
    inspection.status === 'Completed' && !inspection.sow_generated
  );

  // Get role-specific metrics
  const getMetrics = () => {
    switch (userRole) {
      case 'engineer':
        return {
          title: 'Engineering Dashboard',
          description: 'Review completed inspections and generate SOW documents',
          primary: readyForSOW.length,
          primaryLabel: 'Ready for SOW',
          secondary: projects.filter(p => p.current_stage === 'engineering').length,
          secondaryLabel: 'In Engineering',
          tertiary: projects.filter(p => p.current_stage === 'complete').length,
          tertiaryLabel: 'Completed'
        };
      case 'consultant':
        return {
          title: 'Consultant Dashboard',
          description: 'Review field inspections and prepare for engineering',
          primary: projects.filter(p => p.current_stage === 'consultant_review').length,
          primaryLabel: 'Pending Review',
          secondary: inspections.filter(i => i.status === 'Completed').length,
          secondaryLabel: 'Completed Inspections',
          tertiary: projects.filter(p => p.current_stage === 'engineering').length,
          tertiaryLabel: 'In Engineering'
        };
      default: // inspector
        return {
          title: 'Inspector Dashboard',
          description: 'Manage field inspections and project documentation',
          primary: inspections.filter(i => i.status === 'Draft').length,
          primaryLabel: 'Draft Inspections',
          secondary: inspections.filter(i => i.status === 'Completed').length,
          secondaryLabel: 'Completed',
          tertiary: readyForSOW.length,
          tertiaryLabel: 'Ready for SOW'
        };
    }
  };

  const metrics = getMetrics();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-500';
      case 'Completed': return 'bg-green-500';
      case 'Under Review': return 'bg-blue-500';
      case 'Approved': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'inspection': return 'bg-yellow-500';
      case 'consultant_review': return 'bg-blue-500';
      case 'engineering': return 'bg-purple-500';
      case 'complete': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header with Clear Role Context */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{metrics.title}</h1>
          <p className="text-blue-200 text-lg">{metrics.description}</p>
          <Badge className="mt-2 bg-blue-600 text-white">
            Role: {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </Badge>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">{metrics.primary}</div>
              <div className="text-blue-200">{metrics.primaryLabel}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{metrics.secondary}</div>
              <div className="text-blue-200">{metrics.secondaryLabel}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{metrics.tertiary}</div>
              <div className="text-blue-200">{metrics.tertiaryLabel}</div>
            </CardContent>
          </Card>
        </div>

        {/* Role-Specific Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/10 backdrop-blur-md">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="ready-sow" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Ready for SOW
            </TabsTrigger>
            <TabsTrigger value="active-projects" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Active Projects
            </TabsTrigger>
            <TabsTrigger value="quick-actions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Quick Actions
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inspections.slice(0, 5).map((inspection) => (
                      <div key={inspection.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{inspection.project_name}</p>
                          <p className="text-blue-200 text-sm">{inspection.project_address}</p>
                        </div>
                        <Badge className={`${getStatusColor(inspection.status)} text-white text-xs`}>
                          {inspection.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Workflow Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{project.project_name}</p>
                          <p className="text-blue-200 text-sm">{project.address}</p>
                        </div>
                        <Badge className={`${getStageColor(project.current_stage)} text-white text-xs`}>
                          {project.current_stage.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Ready for SOW Tab - Key Feature for Engineers */}
          <TabsContent value="ready-sow" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-400" />
                  Inspections Ready for SOW Generation
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Completed field inspections that are ready for scope of work generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {readyForSOW.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-blue-200">No inspections ready for SOW generation</p>
                    <p className="text-blue-300 text-sm mt-2">Completed inspections will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {readyForSOW.map((inspection) => (
                      <div key={inspection.id} className="p-4 bg-white/5 rounded-lg border border-green-400/30">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-lg">{inspection.project_name}</h3>
                            <p className="text-blue-200 mt-1">{inspection.project_address}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-blue-300">
                              <span>Completed: {format(new Date(inspection.created_at || ''), 'MMM dd, yyyy')}</span>
                              {inspection.square_footage && (
                                <span>{inspection.square_footage.toLocaleString()} sq ft</span>
                              )}
                              <Badge className="bg-green-500 text-white text-xs">
                                Ready for SOW
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => navigate(`/field-inspection/${inspection.id}`)}
                              variant="outline"
                              size="sm"
                              className="border-blue-400 text-blue-200 hover:bg-blue-600"
                            >
                              View Details
                            </Button>
                            <Button
                              onClick={() => {
                                // Navigate to SOW generation with inspection data
                                navigate('/sow-generation', { 
                                  state: { 
                                    fromInspection: true, 
                                    inspectionData: inspection 
                                  } 
                                });
                              }}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Generate SOW
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Active Projects Tab */}
          <TabsContent value="active-projects" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Active Workflow Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{project.project_name}</h3>
                          <p className="text-blue-200 text-sm mt-1">{project.address}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`${getStageColor(project.current_stage)} text-white text-xs`}>
                              {project.current_stage.replace('_', ' ')}
                            </Badge>
                            {project.square_footage && (
                              <Badge variant="outline" className="border-blue-400 text-blue-200 text-xs">
                                {project.square_footage.toLocaleString()} sq ft
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => navigate('/workflow')}
                          variant="outline"
                          size="sm"
                          className="border-blue-400 text-blue-200 hover:bg-blue-600"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Open Workflow
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Actions Tab */}
          <TabsContent value="quick-actions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userRole === 'inspector' && (
                <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all cursor-pointer"
                      onClick={() => navigate('/field-inspection/new')}>
                  <CardContent className="p-6 text-center">
                    <ClipboardCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">New Field Inspection</h3>
                    <p className="text-blue-200 text-sm">Start a new field inspection</p>
                  </CardContent>
                </Card>
              )}

              {(userRole === 'engineer' || userRole === 'consultant') && (
                <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all cursor-pointer"
                      onClick={() => navigate('/sow-generation')}>
                  <CardContent className="p-6 text-center">
                    <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Generate SOW</h3>
                    <p className="text-blue-200 text-sm">Create scope of work documents</p>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all cursor-pointer"
                    onClick={() => navigate('/workflow')}>
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">Workflow Dashboard</h3>
                  <p className="text-blue-200 text-sm">Multi-role project management</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all cursor-pointer"
                    onClick={() => navigate('/field-inspector/dashboard')}>
                <CardContent className="p-6 text-center">
                  <Search className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-white font-semibold mb-2">View All Inspections</h3>
                  <p className="text-blue-200 text-sm">Browse and search inspections</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UnifiedDashboard;
