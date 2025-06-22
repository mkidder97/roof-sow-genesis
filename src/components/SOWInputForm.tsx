import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileText, Download, Bug, CheckCircle, AlertCircle, Wifi, WifiOff, MapPin, Zap, Settings, Layers, Wind, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProjectInfoSection } from './sections/ProjectInfoSection';
import { BuildingSpecsSection } from './sections/BuildingSpecsSection';
import { MembraneOptionsSection } from './sections/MembraneOptionsSection';
import { InsulationSection } from './sections/InsulationSection';
import { RoofFeaturesSection } from './sections/RoofFeaturesSection';
import { EngineeringSummaryPanel } from './EngineeringSummaryPanel';
import { DocumentUploadSection } from './DocumentUploadSection';
import { SOWReviewPanel } from './SOWReviewPanel';
import { DevModePanel } from './DevModePanel';
import { generateSOW, generateSOWWithDebug, checkHealth, SOWPayload, SOWResponse } from '@/lib/api';
import { EngineeringSummaryData, SelfHealingAction, SectionAnalysis } from '@/types/engineering';

export const SOWInputForm = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedFile, setGeneratedFile] = useState<SOWResponse | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [lastPayload, setLastPayload] = useState<SOWPayload | null>(null);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  // Enhanced state management
  const [engineeringSummary, setEngineeringSummary] = useState<EngineeringSummaryData | null>(null);
  const [showEngineeringSummary, setShowEngineeringSummary] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [selfHealingActions, setSelfHealingActions] = useState<SelfHealingAction[]>([]);
  const [sectionAnalysis, setSectionAnalysis] = useState<SectionAnalysis | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showSOWReview, setShowSOWReview] = useState(false);
  
  // Dev Mode
  const [isDevMode, setIsDevMode] = useState(() => {
    return new URLSearchParams(window.location.search).get('dev') === 'true';
  });
  
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
    // Enhanced fields
    elevation: 0,
    deckType: 'Steel',
    exposureCategory: '',
    roofSlope: 0,
    documentAttachment: undefined as {
      filename: string;
      type: string;
      data: string;
    } | undefined,
    // New insulation fields
    insulationType: 'Polyisocyanurate',
    insulationThickness: 2.0,
    insulationRValue: 12.0,
    coverBoardType: 'Gypsum',
    coverBoardThickness: 0.625,
    hasExistingInsulation: false,
    existingInsulationCondition: 'good',
    // New roof features fields
    numberOfDrains: 0,
    drainTypes: [] as string[],
    numberOfPenetrations: 0,
    penetrationTypes: [] as string[],
    skylights: 0,
    roofHatches: 0,
    hvacUnits: 0,
    walkwayPadRequested: false,
    gutterType: 'None',
    downspouts: 0,
    expansionJoints: 0,
    parapetHeight: 0,
    roofConfiguration: 'Single Level',
  });

  const [openSections, setOpenSections] = useState({
    project: true,
    building: false,
    insulation: false,
    features: false,
    membrane: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const calculateCompleteness = () => {
    const requiredFields = ['projectName', 'address'];
    const optionalFields = ['companyName', 'squareFootage', 'buildingHeight'];
    
    const completed = requiredFields.filter(field => formData[field as keyof typeof formData]).length +
                     optionalFields.filter(field => formData[field as keyof typeof formData]).length;
    
    return Math.round((completed / (requiredFields.length + optionalFields.length)) * 100);
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

  const autoFillTestData = () => {
    setFormData({
      projectName: 'Test Hospital Roof Project',
      address: '123 Medical Center Dr, Miami, FL 33101',
      companyName: 'Test Roofing Solutions Inc.',
      squareFootage: 25000,
      buildingHeight: 45,
      length: 200,
      width: 125,
      projectType: 'tearoff',
      membraneThickness: '80',
      membraneColor: 'White',
      elevation: 10,
      deckType: 'Concrete',
      exposureCategory: 'C',
      roofSlope: 0.125,
      documentAttachment: undefined,
      insulationType: 'Polyisocyanurate',
      insulationThickness: 3.0,
      insulationRValue: 18.0,
      coverBoardType: 'Gypsum',
      coverBoardThickness: 0.625,
      hasExistingInsulation: true,
      existingInsulationCondition: 'poor',
      numberOfDrains: 8,
      drainTypes: ['Roof Drain', 'Scupper'],
      numberOfPenetrations: 12,
      penetrationTypes: ['HVAC', 'Plumbing Vent', 'Electrical'],
      skylights: 2,
      roofHatches: 1,
      hvacUnits: 4,
      walkwayPadRequested: true,
      gutterType: 'Internal',
      downspouts: 6,
      expansionJoints: 3,
      parapetHeight: 42,
      roofConfiguration: 'Multi-Level',
    });
    
    toast({
      title: "Test Data Loaded",
      description: "Form has been populated with comprehensive test data",
    });
  };

  const handleRetryGeneration = () => {
    if (lastPayload) {
      handleSubmitWithPayload(lastPayload);
    }
  };

  const handleDocumentUpload = (fileData: { filename: string; type: string; data: string }) => {
    updateFormData({ documentAttachment: fileData });
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
      deckType: formData.deckType,
      elevation: formData.elevation || undefined,
      exposureCategory: formData.exposureCategory || undefined,
      roofSlope: formData.roofSlope || undefined,
      documentAttachment: formData.documentAttachment,
    };

    setLastPayload(payload);
    handleSubmitWithPayload(payload);
  };

  const handleSubmitWithPayload = async (payload: SOWPayload) => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedFile(null);
    setEngineeringSummary(null);
    setShowEngineeringSummary(false);
    setSelfHealingActions([]);
    setSectionAnalysis(null);
    setGenerationError(null);
    setShowSOWReview(false);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      // Use debug endpoint if debug mode is enabled
      const result = debugMode 
        ? await generateSOWWithDebug(payload)
        : await generateSOW(payload);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setGeneratedFile(result);
      setBackendStatus('connected');
      
      // Extract engineering summary and debug data
      if (result.metadata?.engineeringSummary) {
        setEngineeringSummary(result.metadata.engineeringSummary);
        
        // Extract self-healing actions if available
        if (result.metadata.engineeringSummary.selfHealingActions) {
          setSelfHealingActions(result.metadata.engineeringSummary.selfHealingActions);
        }
        
        // Extract section analysis if available
        if (result.metadata.engineeringSummary.sectionAnalysis) {
          setSectionAnalysis(result.metadata.engineeringSummary.sectionAnalysis);
        }
        
        setShowEngineeringSummary(false); // Start collapsed
      }
      
      // Show the SOW Review panel after successful generation
      setShowSOWReview(true);
      
      toast({
        title: "SOW Generated Successfully!",
        description: `PDF generated in ${result.generationTime}ms${debugMode ? ' with debug data' : ''}`,
      });
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Error generating SOW:', error);
      setBackendStatus('disconnected');
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setGenerationError(errorMessage);
      setGeneratedFile({
        success: false,
        error: errorMessage
      });
      
      // Show the SOW Review panel even for errors (to display error handling)
      setShowSOWReview(true);
      
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

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Project Information Section */}
        <Collapsible open={openSections.project} onOpenChange={() => toggleSection('project')}>
          <div className="tesla-section-header">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 tesla-glass-card rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-tesla-blue" />
                  </div>
                  <div>
                    <h3 className="tesla-h3">Project Information & Site Details</h3>
                    <p className="tesla-small text-tesla-text-muted">Basic project information and document upload for data extraction</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="tesla-progress-ring" style={{ background: `conic-gradient(var(--tesla-blue) ${completeness * 3.6}deg, var(--tesla-surface) 0deg)` }}>
                    <span>{completeness}%</span>
                  </div>
                  <Zap className={`h-5 w-5 transition-transform duration-300 ${openSections.project ? 'rotate-180' : ''}`} />
                </div>
              </div>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="tesla-glass-card mt-4 p-6">
              <ProjectInfoSection data={formData} onChange={updateFormData} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Additional Input Upload Section */}
        <Collapsible open={true}>
          <div className="tesla-section-header">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 tesla-glass-card rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-tesla-blue" />
                </div>
                <div>
                  <h3 className="tesla-h3">Additional Document Upload</h3>
                  <p className="tesla-small text-tesla-text-muted">Upload takeoff forms, NOAs, or plans for data extraction</p>
                </div>
              </div>
            </div>
          </div>
          <div className="tesla-glass-card mt-4 p-6">
            <DocumentUploadSection
              onFileUpload={handleDocumentUpload}
              uploadedFile={formData.documentAttachment ? { filename: formData.documentAttachment.filename, type: formData.documentAttachment.type } : null}
              onClearFile={() => updateFormData({ documentAttachment: undefined })}
            />
          </div>
        </Collapsible>

        {/* Building Specifications Section */}
        <Collapsible open={openSections.building} onOpenChange={() => toggleSection('building')}>
          <div className="tesla-section-header">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 tesla-glass-card rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-tesla-success" />
                  </div>
                  <div>
                    <h3 className="tesla-h3">Building Specifications</h3>
                    <p className="tesla-small text-tesla-text-muted">Dimensions, height, and project type</p>
                  </div>
                </div>
                <Zap className={`h-5 w-5 transition-transform duration-300 ${openSections.building ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="tesla-glass-card mt-4 p-6">
              <BuildingSpecsSection data={formData} onChange={updateFormData} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Insulation Specifications Section */}
        <Collapsible open={openSections.insulation} onOpenChange={() => toggleSection('insulation')}>
          <div className="tesla-section-header">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 tesla-glass-card rounded-lg flex items-center justify-center">
                    <Layers className="h-5 w-5 text-tesla-warning" />
                  </div>
                  <div>
                    <h3 className="tesla-h3">Insulation & Cover Board</h3>
                    <p className="tesla-small text-tesla-text-muted">Thermal specifications and substrate details</p>
                  </div>
                </div>
                <Zap className={`h-5 w-5 transition-transform duration-300 ${openSections.insulation ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="tesla-glass-card mt-4 p-6">
              <InsulationSection data={formData} onChange={updateFormData} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Roof Features Section */}
        <Collapsible open={openSections.features} onOpenChange={() => toggleSection('features')}>
          <div className="tesla-section-header">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 tesla-glass-card rounded-lg flex items-center justify-center">
                    <Wind className="h-5 w-5 text-tesla-blue" />
                  </div>
                  <div>
                    <h3 className="tesla-h3">Roof Features & Penetrations</h3>
                    <p className="tesla-small text-tesla-text-muted">Drains, penetrations, and equipment</p>
                  </div>
                </div>
                <Zap className={`h-5 w-5 transition-transform duration-300 ${openSections.features ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="tesla-glass-card mt-4 p-6">
              <RoofFeaturesSection data={formData} onChange={updateFormData} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Membrane Options Section */}
        <Collapsible open={openSections.membrane} onOpenChange={() => toggleSection('membrane')}>
          <div className="tesla-section-header">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 tesla-glass-card rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-tesla-success" />
                  </div>
                  <div>
                    <h3 className="tesla-h3">Membrane System</h3>
                    <p className="tesla-small text-tesla-text-muted">Membrane thickness and color specifications</p>
                  </div>
                </div>
                <Zap className={`h-5 w-5 transition-transform duration-300 ${openSections.membrane ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="tesla-glass-card mt-4 p-6">
              <MembraneOptionsSection data={formData} onChange={updateFormData} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Enhanced Generation Panel */}
        <div className="tesla-glass-card p-8">
          <div className="flex flex-col gap-6">
            {isGenerating && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 tesla-glass-card rounded-full flex items-center justify-center">
                      <Loader2 className="h-4 w-4 text-tesla-blue animate-spin" />
                    </div>
                    <span className="tesla-body font-medium">Generating SOW...</span>
                  </div>
                  <span className="tesla-small text-tesla-text-muted">{progress}%</span>
                </div>
                <div className="w-full bg-tesla-surface rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-tesla-blue to-tesla-blue-light h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowDebug(!showDebug)}
                  className="tesla-btn bg-tesla-surface text-tesla-text-secondary"
                >
                  <Bug className="mr-2 h-4 w-4" />
                  Debug
                </button>
                
                <button
                  type="button"
                  onClick={() => setDebugMode(!debugMode)}
                  className={`tesla-btn ${debugMode ? 'bg-tesla-warning text-black' : 'bg-tesla-surface text-tesla-text-secondary'}`}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {debugMode ? 'Debug Mode ON' : 'Debug Mode OFF'}
                </button>
                
                <button
                  type="button"
                  onClick={testBackendConnection}
                  className="tesla-btn bg-tesla-surface text-tesla-text-secondary"
                >
                  {backendStatus === 'connected' ? (
                    <Wifi className="mr-2 h-4 w-4 text-tesla-success" />
                  ) : backendStatus === 'disconnected' ? (
                    <WifiOff className="mr-2 h-4 w-4 text-tesla-error" />
                  ) : (
                    <Wifi className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </button>

                {isDevMode && (
                  <button
                    type="button"
                    onClick={() => setIsDevMode(!isDevMode)}
                    className="tesla-btn bg-purple-600 text-white"
                  >
                    Dev Mode
                  </button>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isGenerating}
                className="tesla-btn px-8 py-4 text-lg font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Generating SOW...
                  </>
                ) : (
                  <>
                    <Zap className="mr-3 h-5 w-5" />
                    {debugMode ? 'Generate SOW (Debug)' : 'Generate SOW'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* SOW Review Panel - Shows AFTER generation */}
      {showSOWReview && (
        <SOWReviewPanel
          generatedSOW={generatedFile}
          selfHealingActions={selfHealingActions}
          sectionAnalysis={sectionAnalysis}
          engineeringSummary={engineeringSummary}
          error={generationError}
          onRetryGeneration={handleRetryGeneration}
          onDownloadPDF={handleDownload}
          isOpen={showSOWReview}
          onToggle={() => setShowSOWReview(!showSOWReview)}
        />
      )}

      {/* Dev Mode Panel */}
      <DevModePanel
        isDevMode={isDevMode}
        onToggleDevMode={() => setIsDevMode(!isDevMode)}
        onAutoFill={autoFillTestData}
        rawData={isDevMode ? { engineeringSummary, selfHealingActions, sectionAnalysis, generatedFile } : undefined}
      />

      {/* Debug Panel */}
      {showDebug && lastPayload && (
        <div className="tesla-glass-card p-6">
          <h4 className="tesla-h3 mb-4">Debug: Request Payload</h4>
          <pre className="tesla-small bg-tesla-bg-secondary text-tesla-success p-4 rounded-lg overflow-x-auto">
            {JSON.stringify(lastPayload, null, 2)}
          </pre>
        </div>
      )}

      {/* Legacy Engineering Summary Panel */}
      {engineeringSummary && (
        <EngineeringSummaryPanel
          data={engineeringSummary}
          isOpen={showEngineeringSummary}
          onToggle={() => setShowEngineeringSummary(!showEngineeringSummary)}
        />
      )}
    </div>
  );
};
