import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building, Wind, FileText, Download, Eye, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import ManufacturerAnalysisPreview from '@/components/ManufacturerAnalysisPreview';
import { SOWInputForm } from '@/components/SOWInputForm'; // Changed to named import
import { useSOWGeneration, useSOWDebug } from '@/hooks/useSOWGeneration';
import { SOWGenerationRequest } from '@/lib/api';

interface ProjectData {
  projectName?: string;
  address?: string;
  buildingHeight?: number;
  squareFootage?: number;
  membraneType?: string;
  selectedMembraneBrand?: string;
  windSpeed?: number;
  exposureCategory?: string;
  projectType?: string;
}

const SOWGeneration = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('input');
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Backend integration hooks
  const {
    generateSOW,
    isGenerating,
    generationError,
    generationData,
    generationProgress,
    generationStatus,
    isBackendOnline,
    healthStatus,
    reset
  } = useSOWGeneration({
    onSuccess: (data) => {
      console.log('SOW generated successfully:', data);
      setActiveTab('download');
    },
    onError: (error) => {
      console.error('SOW generation failed:', error);
    }
  });

  const {
    debugSOW,
    isDebugging,
    debugError,
    debugData,
    resetDebug
  } = useSOWDebug();

  const handleProjectDataSubmit = (data: ProjectData, file?: File) => {
    setProjectData(data);
    if (file) {
      setUploadedFile(file);
    }
    setActiveTab('preview');
  };

  const handleAnalysisComplete = (results: any) => {
    setAnalysisResults(results);
    setActiveTab('generate');
  };

  const handleGenerateSOW = async () => {
    if (!projectData) return;

    const sowRequest: SOWGenerationRequest = {
      projectName: projectData.projectName,
      projectAddress: projectData.address,
      buildingHeight: projectData.buildingHeight,
      deckType: 'steel', // Default or from form
      membraneType: projectData.membraneType,
      windSpeed: projectData.windSpeed,
      exposureCategory: projectData.exposureCategory as 'B' | 'C' | 'D',
      takeoffFile: uploadedFile || undefined,
    };

    if (debugMode) {
      debugSOW(sowRequest);
    } else {
      generateSOW(sowRequest);
    }
  };

  const downloadGeneratedSOW = () => {
    if (generationData?.data?.pdf) {
      // Handle base64 PDF download
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${generationData.data.pdf}`;
      link.download = `SOW_${projectData?.projectName || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const TabContent = ({ value, title, description, children }: {
    value: string;
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <TabsContent value={value} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-blue-200">{description}</p>
      </div>
      {children}
    </TabsContent>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-white">SOW Generator</h1>
            {/* Backend Status Indicator */}
            <div className="flex items-center gap-2">
              {isBackendOnline ? (
                <div className="flex items-center gap-1 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Backend Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Backend Offline</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-blue-200 text-lg">
            Dynamic scope of work generation with manufacturer analysis and wind calculations
          </p>
          
          {/* Debug Mode Toggle */}
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className={`border-blue-400 text-blue-200 hover:bg-blue-800 ${debugMode ? 'bg-blue-800' : ''}`}
            >
              Debug Mode: {debugMode ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {/* Backend Connection Alert */}
        {!isBackendOnline && (
          <Alert className="mb-6 bg-red-500/20 border-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              Backend server is not responding. Please ensure your backend is running on http://localhost:3001
            </AlertDescription>
          </Alert>
        )}

        {/* Generation Progress */}
        {(isGenerating || isDebugging) && (
          <Card className="mb-6 bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">
                    {isDebugging ? 'Debug Analysis' : 'SOW Generation'} Progress
                  </span>
                  <span className="text-blue-200">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="w-full" />
                <p className="text-blue-200 text-sm">{generationStatus}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {(generationError || debugError) && (
          <Alert className="mb-6 bg-red-500/20 border-red-500/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              {generationError?.message || debugError?.message || 'An error occurred'}
            </AlertDescription>
          </Alert>
        )}

        {/* Workflow Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/10 backdrop-blur-md">
            <TabsTrigger 
              value="input" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Building className="w-4 h-4" />
              Project Input
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              disabled={!projectData}
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white disabled:opacity-50"
            >
              <Wind className="w-4 h-4" />
              Analysis Preview
              {analysisResults && <Badge className="ml-1">✓</Badge>}
            </TabsTrigger>
            <TabsTrigger 
              value="generate" 
              disabled={!analysisResults}
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              Generate SOW
            </TabsTrigger>
            <TabsTrigger 
              value="download" 
              disabled={!generationData?.data?.pdf && !debugData}
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download
              {(generationData?.data?.pdf || debugData) && <Badge className="ml-1">Ready</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* Project Input Tab */}
          <TabContent
            value="input"
            title="Project Information"
            description="Enter your project details to begin SOW generation"
          >
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardContent className="p-6">
                <SOWInputForm 
                  onSubmit={handleProjectDataSubmit}
                  initialData={projectData}
                />
              </CardContent>
            </Card>
          </TabContent>

          {/* Analysis Preview Tab */}
          <TabContent
            value="preview"
            title="Manufacturer & Wind Analysis"
            description="Review approved manufacturers and wind pressure calculations"
          >
            {projectData ? (
              <ManufacturerAnalysisPreview
                projectData={projectData}
                onContinue={handleAnalysisComplete}
                onRefresh={() => setAnalysisResults(null)}
              />
            ) : (
              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardContent className="p-8 text-center">
                  <p className="text-blue-200">Please complete project input first</p>
                </CardContent>
              </Card>
            )}
          </TabContent>

          {/* Generate SOW Tab */}
          <TabContent
            value="generate"
            title="Generate Final SOW"
            description="Create your professional scope of work document"
          >
            {analysisResults ? (
              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    SOW Generation Ready
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    Analysis complete. Click below to generate your final SOW PDF using the backend engine.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Analysis Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                      <h3 className="text-green-300 font-medium mb-1">Approved Manufacturer</h3>
                      <p className="text-white text-lg">
                        {analysisResults.manufacturerSelection?.selectedSystem?.manufacturer || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                      <h3 className="text-blue-300 font-medium mb-1">Wind Speed</h3>
                      <p className="text-white text-lg">
                        {analysisResults.windCalculation?.windSpeed || projectData?.windSpeed || 'N/A'} mph
                      </p>
                    </div>
                    <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                      <h3 className="text-purple-300 font-medium mb-1">HVHZ Status</h3>
                      <p className="text-white text-lg">
                        {analysisResults.jurisdictionAnalysis?.hvhz ? 'Required' : 'Not Required'}
                      </p>
                    </div>
                  </div>

                  {/* File Upload Info */}
                  {uploadedFile && (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                      <h3 className="text-blue-300 font-medium mb-1">Takeoff File</h3>
                      <p className="text-white">{uploadedFile.name}</p>
                      <p className="text-blue-200 text-sm">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  )}

                  <div className="text-center space-y-4">
                    <Button
                      onClick={handleGenerateSOW}
                      disabled={isGenerating || isDebugging || !isBackendOnline}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg disabled:opacity-50"
                    >
                      {isGenerating || isDebugging ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          {debugMode ? 'Running Debug Analysis...' : 'Generating SOW...'}
                        </>
                      ) : (
                        <>
                          <FileText className="w-5 h-5 mr-2" />
                          {debugMode ? 'Debug SOW Generation' : 'Generate SOW PDF'}
                        </>
                      )}
                    </Button>
                    
                    {(generationData || debugData) && (
                      <Button
                        onClick={() => {
                          reset();
                          resetDebug();
                        }}
                        variant="outline"
                        className="border-blue-400 text-blue-200 hover:bg-blue-800 ml-4"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardContent className="p-8 text-center">
                  <p className="text-blue-200">Please complete analysis preview first</p>
                </CardContent>
              </Card>
            )}
          </TabContent>

          {/* Download Tab */}
          <TabContent
            value="download"
            title="Download Complete"
            description="Your SOW has been generated and is ready for use"
          >
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardContent className="p-8 text-center space-y-6">
                {(generationData?.data?.pdf || debugData) ? (
                  <>
                    <div className="text-green-400 text-6xl mb-4">✓</div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {debugMode ? 'Debug Analysis Complete!' : 'SOW Generated Successfully!'}
                    </h3>
                    <p className="text-blue-200 mb-6">
                      {debugMode 
                        ? 'Your debug analysis has been completed. Review the results below.'
                        : 'Your professional scope of work document has been generated.'
                      }
                    </p>
                    
                    {/* Debug Data Display */}
                    {debugMode && debugData && (
                      <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-left">
                        <h4 className="text-white font-medium mb-2">Debug Results:</h4>
                        <pre className="text-blue-200 text-sm overflow-auto max-h-96">
                          {JSON.stringify(debugData, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    <div className="flex justify-center gap-4">
                      {generationData?.data?.pdf && (
                        <>
                          <Button
                            onClick={downloadGeneratedSOW}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button
                            onClick={() => {
                              const pdfUrl = `data:application/pdf;base64,${generationData.data.pdf}`;
                              window.open(pdfUrl, '_blank');
                            }}
                            variant="outline"
                            className="border-blue-400 text-blue-200 hover:bg-blue-800"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview PDF
                          </Button>
                        </>
                      )}
                      
                      <Button
                        onClick={() => {
                          reset();
                          resetDebug();
                          setActiveTab('input');
                        }}
                        variant="outline"
                        className="border-blue-400 text-blue-200 hover:bg-blue-800"
                      >
                        Generate Another SOW
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-blue-200">No SOW generated yet</p>
                )}
              </CardContent>
            </Card>
          </TabContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SOWGeneration;