
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, ClipboardCheck, Info, Sparkles } from 'lucide-react';
import { SOWInputForm } from '@/components/SOWInputForm';
import SOWGenerationStatus from '@/components/SOWGenerationStatus';
import RoleBasedNavigation from '@/components/navigation/RoleBasedNavigation';
import Breadcrumb from '@/components/navigation/Breadcrumb';

const SOWGeneration = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [inspectionData, setInspectionData] = useState(null);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('');

  useEffect(() => {
    // Check if we came from an inspection
    if (location.state?.fromInspection && location.state?.inspectionData) {
      setInspectionData(location.state.inspectionData);
      console.log('SOW Generation page loaded with inspection data:', location.state.inspectionData);
    }
  }, [location.state]);

  const handleSOWSubmit = async (data: any) => {
    console.log('SOW generation requested with data:', data);
    
    // Start generation process
    setGenerationStatus('processing');
    setGenerationProgress(0);
    setGenerationMessage('Initializing SOW generation...');

    try {
      // Simulate the SOW generation process with progress updates
      const steps = [
        { progress: 20, message: 'Analyzing project data...' },
        { progress: 40, message: 'Calculating wind loads...' },
        { progress: 60, message: 'Generating technical specifications...' },
        { progress: 80, message: 'Formatting professional document...' },
        { progress: 100, message: 'SOW generation complete!' }
      ];

      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setGenerationProgress(step.progress);
        setGenerationMessage(step.message);
      }

      // Success
      setGenerationStatus('success');
      console.log('SOW generated successfully (mock)');
    } catch (error) {
      console.error('Error generating SOW:', error);
      setGenerationStatus('error');
      setGenerationMessage('Failed to generate SOW. Please try again.');
    }
  };

  const handleDownload = () => {
    console.log('Downloading SOW PDF...');
    // This will be connected to actual backend PDF download
    alert('PDF download will be implemented with backend integration');
  };

  const handleRetry = () => {
    setGenerationStatus('idle');
    setGenerationProgress(0);
    setGenerationMessage('');
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
          status={generationStatus}
          progress={generationProgress}
          message={generationMessage}
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
