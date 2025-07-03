import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, ClipboardCheck, Info, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { SimplifiedSOWGenerator } from '@/components/SimplifiedSOWGenerator';
import SOWGenerationStatus from '@/components/SOWGenerationStatus';
import { SOWErrorBoundary } from '@/components/SOWErrorBoundary';
import RoleBasedNavigation from '@/components/navigation/RoleBasedNavigation';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import { useSOWGeneration } from '@/hooks/useSOWGeneration';
import { useToast } from '@/hooks/use-toast';
import {
  FieldInspectionData,
  SOWGenerationRequest,
  SOWGenerationError,
  createSOWError,
  isNetworkError
} from '@/types/sow';

const SOWGeneration = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inspectionData, setInspectionData] = useState<FieldInspectionData | null>(null);

  // Use the real SOW generation hook with proper error handling
  const {
    generateSOW,
    isGenerating,
    generationError,
    generationData,
    generationProgress,
    generationStatus,
    healthStatus,
    isHealthLoading,
    isBackendOnline,
    reset
  } = useSOWGeneration({
    onSuccess: (data) => {
      console.log('SOW generated successfully:', data);
      toast({
        title: "SOW Generated Successfully",
        description: "Your professional SOW document is ready for download.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error('SOW generation failed:', error);
      const sowError = isNetworkError(error) 
        ? createSOWError('Backend connection failed. Please ensure the server is running.', 'network')
        : createSOWError(error.message, 'server');
      
      toast({
        title: "SOW Generation Failed",
        description: sowError.message,
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    // Check if we came from an inspection
    if (location.state?.fromInspection && location.state?.inspectionData) {
      setInspectionData(location.state.inspectionData);
      console.log('SOW Generation page loaded with inspection data:', location.state.inspectionData);
    }
  }, [location.state]);

  const handleSOWSubmit = async (data: any) => {
    console.log('SOW generation requested with form data:', data);
    
    try {
      // Ensure required fields are present and properly typed
      const sowRequest: SOWGenerationRequest = {
        projectName: data.projectName || 'Untitled Project',
        projectAddress: data.projectAddress || 'TBD',
        companyName: data.companyName,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        squareFootage: data.squareFootage,
        buildingHeight: data.buildingHeight,
        buildingDimensions: data.buildingDimensions,
        deckType: data.deckType,
        projectType: data.projectType,
        roofSlope: data.roofSlope,
        elevation: data.elevation,
        city: data.city,
        state: data.state,
        county: data.county,
        zipCode: data.zipCode,
        asceRequirements: data.asceRequirements,
        asceVersion: data.asceVersion,
        windSpeed: data.windSpeed,
        exposureCategory: data.exposureCategory,
        buildingClassification: data.buildingClassification,
        engineeringNotes: data.engineeringNotes,
        membraneType: data.membraneType,
        membraneThickness: data.membraneThickness,
        membraneMaterial: data.membraneMaterial,
        selectedMembraneBrand: data.selectedMembraneBrand,
        insulationType: data.insulationType,
        takeoffData: data.takeoffData,
        takeoffFile: data.takeoffFile,
        basicWindSpeed: data.basicWindSpeed,
        preferredManufacturer: data.preferredManufacturer,
        includesTaperedInsulation: data.includesTaperedInsulation,
        userSelectedSystem: data.userSelectedSystem,
        customNotes: data.customNotes ? [data.customNotes] : undefined,
        inspectorName: data.inspectorName,
        inspectionDate: data.inspectionDate,
        numberOfDrains: data.numberOfDrains,
        numberOfPenetrations: data.numberOfPenetrations,
        notes: data.notes,
        inspectionId: data.inspectionId
      };
      
      // Make the real API call with properly typed data
      await generateSOW(sowRequest);
    } catch (error: any) {
      console.error('SOW submission error:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit SOW generation request.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    console.log('Downloading SOW PDF...');
    
    if (generationData?.data?.pdf) {
      // Handle base64 PDF download
      try {
        const byteCharacters = atob(generationData.data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SOW_${inspectionData?.project_name || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Started",
          description: "SOW PDF download has been initiated.",
          variant: "default",
        });
      } catch (error) {
        console.error('PDF download error:', error);
        toast({
          title: "Download Failed",
          description: "Failed to download the SOW PDF.",
          variant: "destructive",
        });
      }
    } else if (generationData?.downloadUrl) {
      // Handle direct file URL download
      try {
        const link = document.createElement('a');
        link.href = generationData.downloadUrl;
        link.download = `SOW_${inspectionData?.project_name || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
        
        toast({
          title: "Download Started",
          description: "SOW PDF download has been initiated.",
          variant: "default",
        });
      } catch (error) {
        console.error('File URL download error:', error);
        toast({
          title: "Download Failed",
          description: "Failed to download the SOW PDF from URL.",
          variant: "destructive",
        });
      }
    } else {
      console.error('No PDF data available for download');
      toast({
        title: "No PDF Available",
        description: "No PDF data is available for download.",
        variant: "destructive",
      });
    }
  };

  const handleRetry = () => {
    reset();
    toast({
      title: "Reset Complete",
      description: "SOW generation has been reset. You can try again.",
      variant: "default",
    });
  };

  const handleErrorBoundaryError = (error: SOWGenerationError) => {
    console.error('Error boundary caught SOW error:', error);
    toast({
      title: `${error.type} Error`,
      description: error.message,
      variant: "destructive",
    });
  };

  // Determine the current generation status for the status component
  const getGenerationStatus = () => {
    if (isGenerating) return 'processing';
    if (generationError) return 'error';
    if (generationData?.success) return 'success';
    return 'idle';
  };

  const getGenerationMessage = () => {
    if (isGenerating) return generationStatus || 'Processing SOW generation...';
    if (generationError) return generationError.message || 'SOW generation failed';
    if (generationData?.success) return 'SOW generated successfully!';
    return '';
  };

  return (
    <SOWErrorBoundary onError={(error: SOWGenerationError) => {
      console.error('Error boundary caught SOW error:', error);
      toast({
        title: `${error.type} Error`,
        description: error.message,
        variant: "destructive",
      });
    }}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <RoleBasedNavigation />
        <Breadcrumb />
        
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Enhanced Page Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-600/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                SOW Generation
              </h1>
            </div>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              Generate professional scope of work documents from field inspection data using advanced AI technology
            </p>
            <div className="flex justify-center gap-2 mt-4">
              <Badge className="bg-purple-600 text-white">
                Engineer Tool
              </Badge>
              <Badge className="bg-green-600 text-white">
                Professional Grade
              </Badge>
              <Badge className="bg-blue-600 text-white">
                AI-Powered
              </Badge>
            </div>
          </div>

          {/* Supabase Status Alert */}
          <Alert className="mb-6 bg-blue-900/50 border-blue-400/30">
            <Wifi className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Supabase Integration:</strong> Active (Edge Functions)
                  <span className="ml-2 text-sm opacity-75">
                    Using simplified SOW generation via Supabase
                  </span>
                </div>
                <div className="flex gap-2">
                  <Badge className="bg-blue-600 text-white">
                    Ready
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={async () => {
                      try {
                        const { supabase } = await import('@/integrations/supabase/client');
                        const { data, error } = await supabase.functions.invoke('generate-sow', {
                          body: { 
                            projectName: "Test Project",
                            projectAddress: "123 Test St"
                          }
                        });
                        toast({
                          title: error ? "Connection Failed" : "Connection Success",
                          description: error ? error.message : "Supabase edge function is working",
                          variant: error ? "destructive" : "default"
                        });
                      } catch (err) {
                        toast({
                          title: "Connection Test Failed", 
                          description: err instanceof Error ? err.message : "Unknown error",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="text-blue-200 border-blue-400/30"
                  >
                    Test Connection
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Backward compatibility status */}
          {!isHealthLoading && (
            <Alert className={`mb-6 ${isBackendOnline ? 'bg-green-900/50 border-green-400/30' : 'bg-red-900/50 border-red-400/30'}`}>
              {isBackendOnline ? (
                <Wifi className="h-4 w-4 text-green-400" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-400" />
              )}
              <AlertDescription className={isBackendOnline ? 'text-green-200' : 'text-red-200'}>
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Backend Status:</strong> {isBackendOnline ? 'Connected' : 'Offline'} - 
                    {isBackendOnline 
                      ? 'Ready to generate SOW documents' 
                      : 'Unable to connect to SOW generation service. Please ensure the backend server is running on localhost:3001.'
                    }
                  </div>
                  <Badge className={isBackendOnline ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}>
                    {isBackendOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Generation Status */}
          <SOWGenerationStatus 
            status={getGenerationStatus()}
            progress={generationProgress}
            message={getGenerationMessage()}
            onDownload={handleDownload}
            onRetry={handleRetry}
          />

          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 mb-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                AI-Powered SOW Generation Process
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">1</div>
                  <h3 className="text-white font-semibold text-sm">Data Analysis</h3>
                  <p className="text-blue-200 text-xs">AI reviews inspection data</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">2</div>
                  <h3 className="text-white font-semibold text-sm">Technical Calculation</h3>
                  <p className="text-blue-200 text-xs">Wind loads & specifications</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">3</div>
                  <h3 className="text-white font-semibold text-sm">Content Generation</h3>
                  <p className="text-blue-200 text-xs">Professional document creation</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-3">4</div>
                  <h3 className="text-white font-semibold text-sm">PDF Export</h3>
                  <p className="text-blue-200 text-xs">Formatted professional SOW</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simplified SOW Generator */}
          <SimplifiedSOWGenerator />

          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 mt-6">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4 text-center">Need More Data?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ClipboardCheck className="w-6 h-6 text-blue-400" />
                  </div>
                  <h4 className="text-blue-200 font-medium mb-2">Review Completed Inspections</h4>
                  <p className="text-blue-300 mb-4">View all completed field inspections ready for SOW generation</p>
                  <Button 
                    onClick={() => navigate('/field-inspector/dashboard')}
                    variant="outline" 
                    size="sm"
                    className="border-blue-400 text-blue-200 hover:bg-blue-600"
                  >
                    View Inspections
                  </Button>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-purple-400" />
                  </div>
                  <h4 className="text-blue-200 font-medium mb-2">Engineer Dashboard</h4>
                  <p className="text-blue-300 mb-4">Return to engineer dashboard to see all ready inspections</p>
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    variant="outline" 
                    size="sm"
                    className="border-blue-400 text-blue-200 hover:bg-blue-600"
                  >
                    Engineer Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SOWErrorBoundary>
  );
};

export default SOWGeneration;
