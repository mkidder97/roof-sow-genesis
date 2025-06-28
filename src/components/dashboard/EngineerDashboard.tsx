
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  TrendingUp,
  Calendar,
  User,
  Building,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSOWGeneration } from '@/hooks/useSOWGeneration';
import { useCompletedInspections } from '@/hooks/useCompletedInspections';
import { useToast } from '@/hooks/use-toast';
import { FieldInspection } from '@/types/fieldInspection';
import { SOWGenerationRequest, transformInspectionToSOWRequest } from '@/types/sow';

export const EngineerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { completedInspections, loading: inspectionsLoading, error: inspectionsError, refetch } = useCompletedInspections();
  const {
    generateSOW,
    isGenerating,
    generationData,
    generationError,
    generationStatus,
    healthStatus,
    isBackendOnline
  } = useSOWGeneration();

  // Enhanced debug logging for troubleshooting
  useEffect(() => {
    console.log('🔧 === ENGINEER DASHBOARD DEBUG SESSION ===');
    console.log('🔧 Total completed inspections found:', completedInspections.length);
    console.log('🔧 Loading state:', inspectionsLoading);
    console.log('🔧 Error state:', inspectionsError);
    console.log('🔧 Backend online:', isBackendOnline);
    
    if (completedInspections.length > 0) {
      console.log('🔧 === DETAILED INSPECTION ANALYSIS ===');
      completedInspections.forEach((inspection, index) => {
        console.log(`🔧 Inspection ${index + 1}:`, {
          name: inspection.project_name,
          id: inspection.id,
          status: inspection.status,
          completed: inspection.completed,
          ready_for_handoff: inspection.ready_for_handoff,
          sow_generated: inspection.sow_generated,
          completed_at: inspection.completed_at
        });
      });
    } else {
      console.log('🔧 ❌ NO COMPLETED INSPECTIONS FOUND - This is the problem!');
    }
  }, [completedInspections, inspectionsLoading, inspectionsError, isBackendOnline]);

  const readyForSOW = completedInspections.filter(inspection => {
    const isCompleted = inspection.status === 'Completed' || 
                       inspection.completed === true || 
                       inspection.ready_for_handoff === true;
    const noSOWGenerated = !inspection.sow_generated;
    
    console.log(`🎯 SOW Filter - "${inspection.project_name}":`, {
      isCompleted,
      noSOWGenerated,
      readyForSOW: isCompleted && noSOWGenerated
    });
    
    return isCompleted && noSOWGenerated;
  });

  console.log('📊 === ENGINEER DASHBOARD SUMMARY ===');
  console.log('📊 Total completed inspections:', completedInspections.length);
  console.log('📊 Ready for SOW count:', readyForSOW.length);
  console.log('📊 Ready for SOW inspections:', readyForSOW.map(i => i.project_name));

  const handleGenerateSOW = async (inspection: FieldInspection) => {
    if (!inspection.id) {
      console.error('❌ Cannot generate SOW: inspection ID is missing');
      toast({
        title: "Error",
        description: "Cannot generate SOW: inspection ID is missing",
        variant: "destructive",
      });
      return;
    }

    console.log('🚀 Generating SOW for inspection:', inspection.project_name);

    try {
      const sowRequest: SOWGenerationRequest = transformInspectionToSOWRequest({
        ...inspection,
        id: inspection.id
      });

      console.log('📄 SOW request:', sowRequest);
      await generateSOW(sowRequest);

      toast({
        title: "SOW Generation Started",
        description: `Generating SOW for ${inspection.project_name}`,
      });
    } catch (error) {
      console.error('💥 SOW generation error:', error);
      toast({
        title: "SOW Generation Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    }
  };

  const handleForceRefresh = () => {
    console.log('🔄 Engineer Dashboard: Force refreshing completed inspections...');
    refetch();
    toast({
      title: "Refreshing Data",
      description: "Fetching latest completed inspection data...",
    });
  };

  if (inspectionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Clock className="w-6 h-6 animate-spin" />
          Loading engineer dashboard...
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Engineer Dashboard</h1>
          <p className="text-blue-200">Review completed inspections and generate SOW documents</p>
        </div>
        <Button 
          onClick={handleForceRefresh}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* CRITICAL DEBUG PANEL - Always visible for troubleshooting */}
      <Alert className="mb-6 bg-blue-900/50 border-blue-400/30">
        <AlertDescription className="text-blue-200">
          <div className="space-y-2 text-sm">
            <div className="font-medium">🔧 CRITICAL DEBUG INFO:</div>
            <div>• Database query completed: {inspectionsLoading ? 'No' : 'Yes'}</div>
            <div>• Completed inspections found: {completedInspections.length}</div>
            <div>• Ready for SOW generation: {readyForSOW.length}</div>
            <div>• Backend status: {isBackendOnline ? 'Connected ✅' : 'Offline ❌'}</div>
            {inspectionsError && <div className="text-red-300">• Error: {inspectionsError}</div>}
            
            {completedInspections.length > 0 && (
              <div className="mt-3">
                <div className="font-medium">✅ FOUND THESE COMPLETED INSPECTIONS:</div>
                {completedInspections.map(i => (
                  <div key={i.id} className="ml-2 text-xs bg-green-900/30 p-1 rounded">
                    📋 "{i.project_name}" - Status: {i.status} | Completed: {i.completed ? 'Yes' : 'No'} | SOW: {i.sow_generated ? 'Generated' : 'Pending'}
                  </div>
                ))}
              </div>
            )}
            
            {readyForSOW.length > 0 && (
              <div className="mt-2">
                <div className="font-medium">🎯 READY FOR SOW GENERATION:</div>
                {readyForSOW.map(i => (
                  <div key={i.id} className="ml-2 text-xs bg-orange-900/30 p-1 rounded">
                    🚀 "{i.project_name}" - Ready to generate SOW!
                  </div>
                ))}
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Backend Status */}
      <Alert className={`mb-6 ${isBackendOnline ? 'bg-green-900/50 border-green-400/30' : 'bg-red-900/50 border-red-400/30'}`}>
        <AlertDescription className="text-white">
          <div className="flex items-center justify-between">
            <div>
              Backend Status: {isBackendOnline ? 'Connected ✅' : 'Offline ❌'}
              {isBackendOnline && ' - Ready to generate SOW documents'}
            </div>
            <Badge className={isBackendOnline ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
              {isBackendOnline ? 'Connected' : 'Offline'}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>

      {/* Error Display */}
      {inspectionsError && (
        <Alert className="mb-6 bg-red-900/50 border-red-400/30">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            Error loading completed inspections: {inspectionsError}
            <Button onClick={refetch} className="ml-4 bg-red-600 hover:bg-red-700" size="sm">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 backdrop-blur border-blue-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total Inspections</p>
                <p className="text-white text-2xl font-bold">{completedInspections.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-green-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Completed</p>
                <p className="text-white text-2xl font-bold">{completedInspections.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-orange-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-200 text-sm">Ready for SOW</p>
                <p className="text-white text-2xl font-bold">{readyForSOW.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-purple-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Generation Status</p>
                <p className="text-white text-sm">{generationStatus || 'Ready'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="ready" className="space-y-6">
        <TabsList className="bg-white/10 backdrop-blur">
          <TabsTrigger value="ready">Ready for SOW ({readyForSOW.length})</TabsTrigger>
          <TabsTrigger value="completed">All Completed ({completedInspections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ready">
          <div className="grid gap-6">
            {readyForSOW.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur border-blue-400/30">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-white text-lg mb-2">No Inspections Ready for SOW</h3>
                  <p className="text-blue-200 mb-4">
                    {completedInspections.length === 0 
                      ? 'No completed inspections found. Check the debug panel above for details.'
                      : `Found ${completedInspections.length} completed inspection(s), but they already have SOW generated.`
                    }
                  </p>
                  <Button onClick={handleForceRefresh} className="bg-blue-600 hover:bg-blue-700" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh & Check for New Inspections
                  </Button>
                </CardContent>
              </Card>
            ) : (
              readyForSOW.map((inspection) => (
                <Card key={inspection.id} className="bg-white/10 backdrop-blur border-blue-400/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">{inspection.project_name}</CardTitle>
                        <CardDescription className="text-blue-200">
                          {inspection.project_address}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-green-600 text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                        <Badge className="bg-orange-600 text-white">
                          Ready for SOW
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-blue-200">
                        <User className="h-4 w-4" />
                        <span className="text-sm">{inspection.inspector_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-200">
                        <Building className="h-4 w-4" />
                        <span className="text-sm">{inspection.square_footage?.toLocaleString()} sq ft</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-200">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{inspection.city}, {inspection.state}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-200">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {inspection.completed_at ? new Date(inspection.completed_at).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                    
                    {/* ASCE Requirements Preview */}
                    {inspection.asce_requirements && (
                      <div className="mb-4 p-3 bg-blue-900/30 rounded-lg">
                        <p className="text-blue-200 text-sm font-medium mb-1">ASCE Requirements:</p>
                        <p className="text-blue-100 text-sm">
                          {inspection.asce_requirements.version} | 
                          {inspection.asce_requirements.wind_speed || inspection.wind_speed || 'TBD'} mph | 
                          Exposure {inspection.asce_requirements.exposure_category || inspection.exposure_category} | 
                          Class {inspection.asce_requirements.building_classification || inspection.building_classification}
                        </p>
                        {inspection.city === 'Orlando' && inspection.state === 'FL' && (
                          <p className="text-green-300 text-xs mt-1">
                            ✓ Orlando, FL location detected - ASCE auto-suggestions available
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => handleGenerateSOW(inspection)}
                        disabled={isGenerating || !isBackendOnline}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isGenerating ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate SOW
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-6">
            {completedInspections.map((inspection) => (
              <Card key={inspection.id} className="bg-white/10 backdrop-blur border-blue-400/30">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{inspection.project_name}</CardTitle>
                      <CardDescription className="text-blue-200">
                        {inspection.project_address}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                      {inspection.sow_generated && (
                        <Badge className="bg-purple-600 text-white">
                          SOW Generated
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-blue-200">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{inspection.inspector_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-200">
                      <Building className="h-4 w-4" />
                      <span className="text-sm">{inspection.square_footage?.toLocaleString()} sq ft</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-200">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{inspection.city}, {inspection.state}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-200">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {inspection.completed_at ? new Date(inspection.completed_at).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EngineerDashboard;
