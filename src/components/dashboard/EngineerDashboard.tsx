
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  MapPin,
  Calendar,
  TrendingUp,
  Building,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const EngineerDashboard = () => {
  const { user } = useAuth();
  const { inspections } = useFieldInspections();
  const navigate = useNavigate();

  // Filter inspections based on SOW workflow
  const completedInspections = inspections.filter(i => i.status === 'Completed');
  const readyForSOW = completedInspections.filter(inspection => !inspection.sow_generated);
  const sowGenerated = inspections.filter(inspection => inspection.sow_generated);

  // Calculate metrics
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
    const numberOfDrains = countItems(drainageOptions);

    // Parse penetrations and calculate penetration count
    const penetrations = safeJsonParse(inspection.penetrations, []);
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
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/15 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-yellow-400 mb-2">{engineerStats.pendingReview}</div>
            <div className="text-blue-200">Pending Review</div>
            <div className="text-blue-300 text-xs mt-1">Ready for SOW</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/15 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400 mb-2">{engineerStats.sowsGenerated}</div>
            <div className="text-blue-200">SOWs Generated</div>
            <div className="text-blue-300 text-xs mt-1">Total completed</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/15 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-400 mb-2">{engineerStats.thisWeekSOWs}</div>
            <div className="text-blue-200">This Week</div>
            <div className="text-blue-300 text-xs mt-1">Recent activity</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/15 transition-colors">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-purple-400 mb-2">{engineerStats.totalProcessed}</div>
            <div className="text-blue-200">Total Processed</div>
            <div className="text-blue-300 text-xs mt-1">All time</div>
          </CardContent>
        </Card>
      </div>

      {/* Ready for SOW Section */}
      <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-400" />
            Inspections Ready for SOW Generation
            <Badge className="bg-green-600 text-white ml-2">
              {readyForSOW.length} ready
            </Badge>
          </CardTitle>
          <CardDescription className="text-blue-200">
            Completed field inspections awaiting SOW document creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readyForSOW.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
              <p className="text-blue-200">No inspections ready for SOW generation</p>
              <p className="text-blue-300 text-sm mt-2">Completed inspections will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {readyForSOW.map((inspection) => (
                <div key={inspection.id} className="p-4 bg-white/5 rounded-lg border border-green-400/30 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{inspection.project_name}</h3>
                      <div className="flex items-center text-blue-200 mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {inspection.project_address}
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <div className="flex items-center text-blue-300">
                          <Calendar className="w-4 h-4 mr-1" />
                          Completed: {format(new Date(inspection.created_at || ''), 'MMM dd, yyyy')}
                        </div>
                        {inspection.square_footage && (
                          <Badge variant="outline" className="border-blue-400 text-blue-200 text-xs">
                            {inspection.square_footage.toLocaleString()} sq ft
                          </Badge>
                        )}
                        <Badge className="bg-green-500 text-white text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
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

      {/* Recently Generated SOWs */}
      {sowGenerated.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Recently Generated SOWs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sowGenerated.slice(0, 3).map((inspection) => (
                <div key={inspection.id} className="p-3 bg-white/5 rounded-lg border border-green-400/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{inspection.project_name}</h4>
                      <p className="text-blue-200 text-sm">{inspection.project_address}</p>
                    </div>
                    <Badge className="bg-green-500 text-white text-xs">
                      SOW Generated
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
            onClick={() => navigate('/field-inspector/dashboard')}
            variant="outline"
            className="border-blue-400 text-blue-200 hover:bg-blue-600 justify-start h-12"
          >
            <Building className="w-5 h-5 mr-2" />
            View All Inspections
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EngineerDashboard;
