import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardCheck, 
  FileText, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Building,
  MapPin,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const UnifiedDashboard = () => {
  const { user } = useAuth();
  const { inspections } = useFieldInspections();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Get user role from user metadata or default to 'inspector'
  const userRole = user?.user_metadata?.role || 'inspector';

  // Filter inspections based on role
  const draftInspections = inspections.filter(i => i.status === 'Draft');
  const completedInspections = inspections.filter(i => i.status === 'Completed');
  const readyForSOW = completedInspections.filter(inspection => !inspection.sow_generated);
  const sowGenerated = inspections.filter(inspection => inspection.sow_generated);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-500';
      case 'Completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Engineer Dashboard
  if (userRole === 'engineer') {
    // Engineer-specific metrics based on SOW generation workflow
    const engineerStats = {
      pendingReview: readyForSOW.length,
      sowsGenerated: sowGenerated.length,
      thisWeekSOWs: sowGenerated.filter(i => {
        const sowDate = new Date(i.updated_at || '');
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return sowDate >= weekAgo;
      }).length,
      totalProcessed: sowGenerated.length + readyForSOW.length
    };

    const handleGenerateSOW = (inspection: any) => {
      console.log('Starting SOW generation for inspection:', inspection);
      
      // Helper function to safely parse JSON data
      const safeJsonParse = (jsonString: any, fallback: any = []) => {
        if (!jsonString) return fallback;
        try {
          if (typeof jsonString === 'string') {
            return JSON.parse(jsonString);
          }
          if (Array.isArray(jsonString) || typeof jsonString === 'object') {
            return jsonString;
          }
          return fallback;
        } catch (error) {
          console.warn('JSON parse error:', error, 'for data:', jsonString);
          return fallback;
        }
      };

      // Helper function to count items from array data
      const countItems = (items: any[], countField: string = 'count') => {
        if (!Array.isArray(items)) return 0;
        return items.reduce((sum, item) => {
          const count = item[countField] || item.count || 1;
          return sum + (typeof count === 'number' ? count : 0);
        }, 0);
      };

      // Parse drainage options and calculate drain count
      const drainageOptions = safeJsonParse(inspection.drainage_options, []);
      console.log('Parsed drainage options:', drainageOptions);
      const numberOfDrains = countItems(drainageOptions);

      // Parse penetrations and calculate penetration count
      const penetrations = safeJsonParse(inspection.penetrations, []);
      console.log('Parsed penetrations:', penetrations);
      const numberOfPenetrations = countItems(penetrations);

      // Convert field inspection data to SOW format with proper field mapping
      const sowData = {
        // Customer Information
        customerName: inspection.customer_name || '',
        customerPhone: inspection.customer_phone || '',
        customerEmail: '', // Not available in field inspection
        
        // Project Information
        projectName: inspection.project_name || '',
        address: inspection.project_address || '',
        
        // Building Specifications
        buildingHeight: inspection.building_height || undefined,
        squareFootage: inspection.square_footage || undefined,
        
        // Technical Specifications
        membraneType: inspection.existing_membrane_type || 'TPO',
        selectedMembraneBrand: '', // Not available in field inspection
        windSpeed: 120, // Default - should be calculated based on location
        exposureCategory: 'C', // Default - should be determined based on location
        projectType: 'recover', // Default - could be inferred from inspection data
        
        // Takeoff Data
        numberOfDrains,
        numberOfPenetrations,
        
        // Additional data for debugging
        _inspectionId: inspection.id,
        _originalData: {
          drainageOptions,
          penetrations,
          hvacUnits: safeJsonParse(inspection.hvac_units, []),
          roofDrains: safeJsonParse(inspection.roof_drains, [])
        }
      };

      console.log('Final SOW data being passed:', sowData);

      // Navigate to SOW generation with the converted data
      navigate('/sow-generation', { 
        state: { 
          fromInspection: true, 
          inspectionData: sowData,
          originalInspection: inspection // Keep original for reference
        } 
      });
    };

    return (
      <div className="container mx-auto px-4 py-6">
        {/* Engineer Dashboard Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Engineer Dashboard</h1>
          <p className="text-blue-200 text-lg">Review completed inspections and generate SOW documents</p>
          <Badge className="mt-2 bg-purple-600 text-white">
            Role: Engineer
          </Badge>
        </div>

        {/* Engineer-Specific Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">{engineerStats.pendingReview}</div>
              <div className="text-blue-200">Pending Review</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{engineerStats.sowsGenerated}</div>
              <div className="text-blue-200">SOWs Generated</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">{engineerStats.thisWeekSOWs}</div>
              <div className="text-blue-200">This Week</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">{engineerStats.totalProcessed}</div>
              <div className="text-blue-200">Total Processed</div>
            </CardContent>
          </Card>
        </div>

        {/* Ready for SOW Section */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-400" />
              Inspections Ready for SOW Generation
            </CardTitle>
            <CardDescription className="text-blue-200">
              Completed field inspections awaiting SOW document creation
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
                        <div className="flex items-center text-blue-200 mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {inspection.project_address}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-blue-300">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Completed: {format(new Date(inspection.created_at || ''), 'MMM dd, yyyy')}
                          </div>
                          {inspection.square_footage && (
                            <Badge variant="outline" className="border-blue-400 text-blue-200 text-xs">
                              {inspection.square_footage.toLocaleString()} sq ft
                            </Badge>
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
                          Review Details
                        </Button>
                        <Button
                          onClick={() => handleGenerateSOW(inspection)}
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

        {/* Engineer Quick Actions */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => navigate('/sow-generation')}
              className="bg-blue-600 hover:bg-blue-700 justify-start h-12"
            >
              <FileText className="w-5 h-5 mr-2" />
              Create New SOW
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="border-blue-400 text-blue-200 hover:bg-blue-600 justify-start h-12"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              View SOW Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Inspector Dashboard
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

      {/* ... keep existing code (Inspector metrics and tabs) the same ... */}
      
      {/* Inspector Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">{draftInspections.length}</div>
            <div className="text-blue-200">Draft Inspections</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">{completedInspections.length}</div>
            <div className="text-blue-200">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">{inspections.length}</div>
            <div className="text-blue-200">Total Inspections</div>
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
                  <ClipboardCheck className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-200">No draft inspections</p>
                  <p className="text-blue-300 text-sm mt-2">All inspections are completed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {draftInspections.map((inspection) => (
                    <div key={inspection.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{inspection.project_name}</h3>
                          <p className="text-blue-200 text-sm mt-1">{inspection.project_address}</p>
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
                <ClipboardCheck className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">New Field Inspection</h3>
                <p className="text-blue-200 text-sm">Start a new building inspection</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all cursor-pointer"
                  onClick={() => navigate('/field-inspector/dashboard')}>
              <CardContent className="p-6 text-center">
                <Building className="w-12 h-12 text-blue-400 mx-auto mb-4" />
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

export default UnifiedDashboard;
