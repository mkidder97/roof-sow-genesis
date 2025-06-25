
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, ClipboardCheck, Info } from 'lucide-react';
import { SOWInputForm } from '@/components/SOWInputForm';
import RoleBasedNavigation from '@/components/navigation/RoleBasedNavigation';
import Breadcrumb from '@/components/navigation/Breadcrumb';

const SOWGeneration = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [inspectionData, setInspectionData] = useState(null);

  useEffect(() => {
    // Check if we came from an inspection
    if (location.state?.fromInspection && location.state?.inspectionData) {
      setInspectionData(location.state.inspectionData);
    }
  }, [location.state]);

  const handleSOWSubmit = async (data: any) => {
    try {
      // Handle SOW generation logic here
      console.log('SOW Data:', data);
      // This would integrate with your SOW generation service
      alert('SOW generated successfully!');
    } catch (error) {
      console.error('Error generating SOW:', error);
      alert('Error generating SOW. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <RoleBasedNavigation />
      <Breadcrumb />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Clear Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            SOW Generation
          </h1>
          <p className="text-blue-200 text-lg">
            Generate professional scope of work documents from field inspection data
          </p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge className="bg-purple-600 text-white">
              Engineer Tool
            </Badge>
            <Badge className="bg-green-600 text-white">
              Professional Grade
            </Badge>
          </div>
        </div>

        {/* Inspection Data Alert */}
        {inspectionData && (
          <Alert className="mb-6 bg-green-900/50 border-green-400/30">
            <ClipboardCheck className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">
              <strong>Field Inspection Data Loaded:</strong> {inspectionData.project_name} - 
              Data from the completed field inspection has been automatically populated in the form below.
            </AlertDescription>
          </Alert>
        )}

        {/* Information Panel */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              SOW Generation Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">1</div>
                <h3 className="text-white font-semibold">Review Inspection Data</h3>
                <p className="text-blue-200 text-sm">Verify field inspection information</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">2</div>
                <h3 className="text-white font-semibold">AI Processing</h3>
                <p className="text-blue-200 text-sm">Advanced algorithms analyze requirements</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2">3</div>
                <h3 className="text-white font-semibold">Professional SOW</h3>
                <p className="text-blue-200 text-sm">Download formatted PDF document</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main SOW Form */}
        <SOWInputForm 
          initialData={inspectionData} 
          onSubmit={handleSOWSubmit}
        />

        {/* Navigation Help */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 mt-6">
          <CardContent className="p-4">
            <h3 className="text-white font-semibold mb-3">Need to Review Inspection Data?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="text-blue-200 font-medium">Completed Inspections</h4>
                <p className="text-blue-300">View all completed field inspections ready for SOW generation</p>
                <Button 
                  onClick={() => navigate('/field-inspector/dashboard')}
                  variant="outline" 
                  size="sm"
                  className="mt-2 border-blue-400 text-blue-200 hover:bg-blue-600"
                >
                  View Inspections
                </Button>
              </div>
              <div>
                <h4 className="text-blue-200 font-medium">Dashboard</h4>
                <p className="text-blue-300">Return to engineer dashboard to see all ready inspections</p>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  variant="outline" 
                  size="sm"
                  className="mt-2 border-blue-400 text-blue-200 hover:bg-blue-600"
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
