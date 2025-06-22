import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building, Wind, FileText, Download, Eye } from 'lucide-react';
import ManufacturerAnalysisPreview from '@/components/ManufacturerAnalysisPreview';
import SOWInputForm from '@/components/SOWInputForm';

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
  const [generatedSOW, setGeneratedSOW] = useState<string | null>(null);

  const handleProjectDataSubmit = (data: ProjectData) => {
    setProjectData(data);
    setActiveTab('preview');
  };

  const handleAnalysisComplete = (results: any) => {
    setAnalysisResults(results);
    setActiveTab('generate');
  };

  const handleGenerateSOW = async () => {
    try {
      const response = await fetch('/api/sow/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectData,
          analysisResults
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate SOW');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setGeneratedSOW(url);

      // Auto-download the PDF
      const link = document.createElement('a');
      link.href = url;
      link.download = `SOW_${projectData?.projectName || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating SOW:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Loading...</div>
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
          <h1 className="text-4xl font-bold text-white mb-4">SOW Generator</h1>
          <p className="text-blue-200 text-lg">
            Dynamic scope of work generation with manufacturer analysis and wind calculations
          </p>
        </div>

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
              disabled={!generatedSOW}
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Download
              {generatedSOW && <Badge className="ml-1">Ready</Badge>}
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
                    Analysis complete. Click below to generate your final SOW PDF.
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
                        {analysisResults.windCalculation?.windSpeed || 'N/A'} mph
                      </p>
                    </div>
                    <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                      <h3 className="text-purple-300 font-medium mb-1">HVHZ Status</h3>
                      <p className="text-white text-lg">
                        {analysisResults.jurisdictionAnalysis?.hvhz ? 'Required' : 'Not Required'}
                      </p>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={handleGenerateSOW}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Generate SOW PDF
                    </Button>
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
                {generatedSOW ? (
                  <>
                    <div className="text-green-400 text-6xl mb-4">✓</div>
                    <h3 className="text-2xl font-bold text-white mb-2">SOW Generated Successfully!</h3>
                    <p className="text-blue-200 mb-6">
                      Your professional scope of work document has been generated and downloaded.
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = generatedSOW;
                          link.download = `SOW_${projectData?.projectName || 'Project'}_${new Date().toISOString().split('T')[0]}.pdf`;
                          link.click();
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Again
                      </Button>
                      <Button
                        onClick={() => window.open(generatedSOW, '_blank')}
                        variant="outline"
                        className="border-blue-400 text-blue-200 hover:bg-blue-800"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview PDF
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