
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileText, Download, Bug, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProjectInfoSection } from './sections/ProjectInfoSection';
import { BuildingSpecsSection } from './sections/BuildingSpecsSection';
import { MembraneOptionsSection } from './sections/MembraneOptionsSection';
import { generateSOW, checkHealth, SOWPayload, SOWResponse } from '@/lib/api';

export const SOWInputForm = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedFile, setGeneratedFile] = useState<SOWResponse | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [lastPayload, setLastPayload] = useState<SOWPayload | null>(null);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  const [formData, setFormData] = useState({
    projectName: '',
    address: '',
    companyName: '',
    squareFootage: 0,
    buildingHeight: 0,
    length: 0,
    width: 0,
    projectType: 'recover',
    membraneThickness: '60',
    membraneColor: 'White',
  });

  const [openSections, setOpenSections] = useState({
    project: true,
    building: false,
    membrane: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateForm = (): boolean => {
    if (!formData.projectName || !formData.address) {
      toast({
        title: "Validation Error",
        description: "Project Name and Address are required fields",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const testBackendConnection = async () => {
    try {
      await checkHealth();
      setBackendStatus('connected');
      toast({
        title: "Backend Connected ✅",
        description: "Successfully connected to the SOW generation service",
      });
    } catch (error) {
      setBackendStatus('disconnected');
      toast({
        title: "Backend Connection Failed ❌",
        description: error instanceof Error ? error.message : "Cannot connect to backend",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const payload: SOWPayload = {
      projectName: formData.projectName,
      address: formData.address,
      companyName: formData.companyName,
      squareFootage: formData.squareFootage,
      buildingHeight: formData.buildingHeight,
      buildingDimensions: {
        length: formData.length,
        width: formData.width,
      },
      projectType: formData.projectType,
      membraneThickness: formData.membraneThickness,
      membraneColor: formData.membraneColor,
    };

    setLastPayload(payload);
    setIsGenerating(true);
    setProgress(0);
    setGeneratedFile(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      const result = await generateSOW(payload);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setGeneratedFile(result);
      setBackendStatus('connected');
      toast({
        title: "SOW Generated Successfully!",
        description: `PDF generated in ${result.generationTime}ms`,
      });
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error generating SOW:', error);
      setBackendStatus('disconnected');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setGeneratedFile({
        success: false,
        error: errorMessage
      });
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedFile?.outputPath) {
      // Create download link
      const link = document.createElement('a');
      link.href = generatedFile.outputPath;
      link.download = generatedFile.filename || 'sow.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your SOW PDF is being downloaded",
      });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Info Section */}
        <Collapsible open={openSections.project} onOpenChange={() => toggleSection('project')}>
          <Card className="border-l-4 border-l-blue-500">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                <CardTitle className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Project Information
                  </span>
                  <span className="text-sm font-normal text-slate-500">
                    {openSections.project ? 'Click to collapse' : 'Click to expand'}
                  </span>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <ProjectInfoSection data={formData} onChange={updateFormData} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Building Specs Section */}
        <Collapsible open={openSections.building} onOpenChange={() => toggleSection('building')}>
          <Card className="border-l-4 border-l-emerald-500">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                <CardTitle className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    Building Specifications
                  </span>
                  <span className="text-sm font-normal text-slate-500">
                    {openSections.building ? 'Click to collapse' : 'Click to expand'}
                  </span>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <BuildingSpecsSection data={formData} onChange={updateFormData} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Membrane Options Section */}
        <Collapsible open={openSections.membrane} onOpenChange={() => toggleSection('membrane')}>
          <Card className="border-l-4 border-l-amber-500">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-slate-50 transition-colors">
                <CardTitle className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z"/>
                    </svg>
                    Membrane Options
                  </span>
                  <span className="text-sm font-normal text-slate-500">
                    {openSections.membrane ? 'Click to collapse' : 'Click to expand'}
                  </span>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <MembraneOptionsSection data={formData} onChange={updateFormData} />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Submit Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Generating SOW...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-xs"
                  >
                    <Bug className="mr-1 h-3 w-3" />
                    Debug
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={testBackendConnection}
                    className="text-xs"
                  >
                    {backendStatus === 'connected' ? (
                      <Wifi className="mr-1 h-3 w-3 text-green-600" />
                    ) : backendStatus === 'disconnected' ? (
                      <WifiOff className="mr-1 h-3 w-3 text-red-600" />
                    ) : (
                      <Wifi className="mr-1 h-3 w-3" />
                    )}
                    Test Connection
                  </Button>
                </div>
                
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating SOW...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate SOW
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Debug Panel */}
      {showDebug && lastPayload && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm text-slate-600">Debug: Request Payload</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-slate-800 text-green-400 p-4 rounded overflow-x-auto">
              {JSON.stringify(lastPayload, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Backend Status */}
      {showDebug && (
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm text-slate-600">Backend Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              Status: 
              {backendStatus === 'connected' && (
                <span className="text-green-600 font-medium">✅ Connected</span>
              )}
              {backendStatus === 'disconnected' && (
                <span className="text-red-600 font-medium">❌ Disconnected</span>
              )}
              {backendStatus === 'unknown' && (
                <span className="text-gray-600 font-medium">❓ Unknown</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {generatedFile && (
        <Card className={`${generatedFile.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <CardContent className="pt-6">
            {generatedFile.success ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">
                    SOW Generated Successfully!
                  </h3>
                </div>
                
                {generatedFile.metadata && (
                  <div className="bg-white p-4 rounded border border-green-200">
                    <h4 className="font-medium text-slate-700 mb-2">Generation Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-slate-500">Template:</span>
                        <div className="font-medium">{generatedFile.metadata.template}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Wind Pressure:</span>
                        <div className="font-medium">{generatedFile.metadata.windPressure}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Generation Time:</span>
                        <div className="font-medium">{generatedFile.generationTime}ms</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-700">
                    <div className="font-medium">{generatedFile.filename}</div>
                    <div>{generatedFile.fileSize} KB</div>
                  </div>
                  <Button 
                    onClick={handleDownload}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">
                    Generation Failed
                  </h3>
                </div>
                <p className="text-red-700">{generatedFile.error}</p>
                {generatedFile.error?.includes('Cannot connect') && (
                  <div className="bg-red-100 p-3 rounded border border-red-200">
                    <p className="text-sm text-red-800">
                      <strong>Troubleshooting:</strong>
                    </p>
                    <ul className="text-sm text-red-700 mt-1 list-disc pl-5">
                      <li>Make sure your test server is running: <code>node test-server.js</code></li>
                      <li>Check that it's running on port 3001</li>
                      <li>Click "Test Connection" to verify backend status</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
