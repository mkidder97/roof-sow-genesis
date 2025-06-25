
import React, { useState } from 'react';
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

const InspectorDashboard = () => {
  const { inspections } = useFieldInspections();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Filter inspections based on status
  const draftInspections = inspections.filter(i => i.status === 'Draft');
  const completedInspections = inspections.filter(i => i.status === 'Completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-500';
      case 'Completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

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
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/15 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-2">{draftInspections.length}</div>
            <div className="text-blue-200">Draft Inspections</div>
            <div className="text-blue-300 text-xs mt-1">In progress</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/15 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">{completedInspections.length}</div>
            <div className="text-blue-200">Completed</div>
            <div className="text-blue-300 text-xs mt-1">Ready for SOW</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/15 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">{inspections.length}</div>
            <div className="text-blue-200">Total Inspections</div>
            <div className="text-blue-300 text-xs mt-1">All time</div>
          </CardContent>
        </Card>
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
                    onClick={() => navigate('/field-inspection/new')}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Inspection
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspections.slice(0, 5).map((inspection) => (
                    <div key={inspection.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
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
                        onClick={() => navigate(`/field-inspection/${inspection.id}`)}
                        variant="outline"
                        size="sm"
                        className="border-blue-400 text-blue-200 hover:bg-blue-600"
                      >
                        View
                      </Button>
                    </div>
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
                          onClick={() => navigate(`/field-inspection/${inspection.id}/edit`)}
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
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all cursor-pointer"
                  onClick={() => navigate('/field-inspection/new')}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">New Field Inspection</h3>
                <p className="text-blue-200 text-sm">Start a new building inspection</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all cursor-pointer"
                  onClick={() => navigate('/field-inspector/dashboard')}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">View All Inspections</h3>
                <p className="text-blue-200 text-sm">Browse and manage inspections</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InspectorDashboard;
