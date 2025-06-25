
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, ClipboardCheck, Info, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { SOWInputForm } from '@/components/SOWInputForm';
import SOWGenerationStatus from '@/components/SOWGenerationStatus';
import RoleBasedNavigation from '@/components/navigation/RoleBasedNavigation';
import Breadcrumb from '@/components/navigation/Breadcrumb';
import { useSOWGeneration } from '@/hooks/useSOWGeneration';

const SOWGeneration = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [inspectionData, setInspectionData] = useState(null);

  // Use the real SOW generation hook
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
    },
    onError: (error) => {
      console.error('SOW generation failed:', error);
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
    console.log('SOW generation requested with data:', data);
    
    // Transform the form data to match the API expected format
    const apiData = {
      projectName: data.projectName,
      projectAddress: data.projectAddress,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      buildingHeight: data.buildingHeight,
      deckType: data.deckType,
      membraneType: data.membraneType,
      insulationType: data.insulationType,
      windSpeed: data.windSpeed,
      exposureCategory: data.exposureCategory,
      buildingClassification: data.buildingClassification,
      takeoffFile: data.takeoffFile, // Handle file upload if present
    };

    // Make the real API call
    generateSOW(apiData);
  };

  const handleDownload = () => {
    console.log('Downloading SOW PDF...');
    
    if (generationData?.data?.pdf) {
      // Handle base64 PDF download
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
      link.download = `SOW_${inspectionData?.projectName || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else if (generationData?.outputPath) {
      // Handle direct file path download
      const link = document.createElement('a');
      link.href = generationData.outputPath;
      link.download = `SOW_${inspectionData?.projectName || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
    } else {
      console.error('No PDF data available for download');
    }
  };

  const handleRetry = () => {
    reset();
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

        {/* Backend Status Alert */}
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

        {/* Enhanced Inspection Data Alert */}
        {inspectionData && (
          <Alert className="mb-6 bg-green-900/50 border-green-400/30">
            <ClipboardCheck className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Field Inspection Data Loaded:</strong> {inspectionData.projectName} - 
                  Data from the completed field inspection has been automatically populated in the form below.
                </div>
                <Badge className="bg-green-600 text-white">
                  Auto-filled
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

        {/* Enhanced Information Panel */}
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

        {/* Main SOW Form */}
        <SOWInputForm 
          initialData={inspectionData} 
          onSubmit={handleSOWSubmit}
          disabled={!isBackendOnline}
        />

        {/* Enhanced Navigation Help */}
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
  );
};

export default SOWGeneration;
