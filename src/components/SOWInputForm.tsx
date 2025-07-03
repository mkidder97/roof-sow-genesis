import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Building2, Wind, AlertTriangle, ClipboardCheck, Info, Layers, Zap, CheckCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { SOWFormData, FieldInspectionData, SOWGenerationRequest, transformInspectionToSOWRequest, transformFormDataToSOWRequest, createSOWError, SOWGenerationRequestSchema } from '@/types/sowGeneration';
import { MEMBRANE_TYPES, INSULATION_TYPES, getTemplateCategory, RoofLayer } from '@/types/roofingTypes';
import { RoofAssemblyEditor } from '@/components/field-inspector/components/RoofAssemblyEditorWrapper';
import { useAssemblyTemplateSync, useDebounceSync } from '@/hooks/useAssemblyTemplateSync';
import { useToast } from '@/hooks/use-toast';

interface SOWInputFormProps {
  initialData?: FieldInspectionData;
  onSubmit: (data: SOWGenerationRequest) => void;
  disabled?: boolean;
}

export const SOWInputForm: React.FC<SOWInputFormProps> = ({
  initialData,
  onSubmit,
  disabled = false
}) => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<SOWFormData>({
    projectName: '',
    projectAddress: '',
    city: '',
    state: '',
    zipCode: '',
    buildingHeight: '',
    deckType: '',
    membraneType: '',
    insulationType: '',
    windSpeed: '',
    exposureCategory: '',
    buildingClassification: '',
    takeoffFile: null,
    notes: ''
  });

  // Assembly layers state for dynamic roof assembly
  const [assemblyLayers, setAssemblyLayers] = useState<RoofLayer[]>([]);
  const [projectType, setProjectType] = useState<'recover' | 'tearoff' | 'new'>('tearoff');
  
  // ✅ PHASE 2: Enhanced smart sync with comprehensive hook
  const [syncState, syncActions] = useAssemblyTemplateSync({
    onSyncComplete: (layers, compatibility) => {
      setAssemblyLayers(layers);
      toast({
        title: "Smart Sync Complete",
        description: `Generated ${layers.length} layers. Template: ${compatibility?.recommendedTemplate}`,
      });
    },
    onValidationChange: (validation) => {
      if (validation && !validation.isValid) {
        toast({
          title: "Assembly Validation",
          description: `${validation.errors.length} errors found in assembly`,
          variant: "destructive"
        });
      }
    },
    autoSyncDelay: 750 // Slightly longer delay for better UX
  });
  
  const [activeTab, setActiveTab] = useState('project');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const transformedData = transformInspectionToSOWRequest(initialData);
      setFormData(prev => ({
        ...prev,
        projectName: transformedData.projectName || '',
        projectAddress: transformedData.projectAddress || '',
        city: transformedData.city || '',
        state: transformedData.state || '',
        zipCode: transformedData.zipCode || '',
        buildingHeight: transformedData.buildingHeight?.toString() || '',
        deckType: transformedData.deckType || '',
        membraneType: transformedData.membraneType || '',
        insulationType: transformedData.insulationType || '',
        windSpeed: transformedData.windSpeed?.toString() || '',
        exposureCategory: transformedData.exposureCategory || '',
        buildingClassification: transformedData.buildingClassification || '',
        notes: transformedData.notes || ''
      }));

      // Load assembly layers from inspection data
      if (initialData.roof_assembly_layers && initialData.roof_assembly_layers.length > 0) {
        setAssemblyLayers(initialData.roof_assembly_layers);
        console.log('🏗️ Loaded assembly layers from inspection:', initialData.roof_assembly_layers);
        
        // ✅ PHASE 2: Analyze loaded assembly with enhanced hook
        syncActions.analyzeAssemblyCompatibility(initialData.roof_assembly_layers);
      }

      // Set project type from inspection data
      if (initialData.project_type) {
        setProjectType(initialData.project_type as 'recover' | 'tearoff' | 'new');
      }
    }
  }, [initialData, syncActions]);

  // ✅ PHASE 2: Debounced auto-sync for template changes
  useDebounceSync(
    () => {
      if (syncState.autoSyncEnabled && 
          (formData.membraneType || formData.insulationType || formData.deckType) &&
          (assemblyLayers.length === 0 || syncState.syncMode === 'template-to-assembly')) {
        const newLayers = syncActions.syncTemplateToAssembly(
          formData.membraneType,
          formData.insulationType,
          formData.deckType,
          projectType
        );
        if (newLayers.length > 0) {
          setAssemblyLayers(newLayers);
        }
      }
    },
    750,
    [formData.membraneType, formData.insulationType, formData.deckType, projectType, syncState.autoSyncEnabled]
  );

  const handleInputChange = (field: keyof SOWFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // ✅ PHASE 2: Enhanced assembly change handler with smart sync
  const handleAssemblyChange = (newLayers: RoofLayer[]) => {
    setAssemblyLayers(newLayers);
    
    // Analyze compatibility when assembly changes
    if (newLayers.length > 0) {
      syncActions.analyzeAssemblyCompatibility(newLayers);
    } else {
      // Reset sync state for empty assembly
      syncActions.resetSync();
    }
    
    console.log('🏗️ Assembly layers updated:', newLayers);
  };

  // ✅ PHASE 2: Manual sync trigger
  const handleManualSync = () => {
    const newLayers = syncActions.syncTemplateToAssembly(
      formData.membraneType,
      formData.insulationType,
      formData.deckType,
      projectType
    );
    if (newLayers.length > 0) {
      setAssemblyLayers(newLayers);
    }
  };

  // Handle project type changes
  const handleProjectTypeChange = (newProjectType: 'recover' | 'tearoff' | 'new') => {
    setProjectType(newProjectType);
    
    // Re-sync if template-driven and auto-sync enabled
    if (syncState.autoSyncEnabled && syncState.syncMode === 'template-to-assembly') {
      const newLayers = syncActions.syncTemplateToAssembly(
        formData.membraneType,
        formData.insulationType,
        formData.deckType,
        newProjectType
      );
      if (newLayers.length > 0) {
        setAssemblyLayers(newLayers);
      }
    }
    
    console.log('🏗️ Project type updated:', newProjectType);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, Excel, or CSV file.",
          variant: "destructive"
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive"
        });
        return;
      }
      setFormData(prev => ({
        ...prev,
        takeoffFile: file
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    try {
      const sowRequest = transformFormDataToSOWRequest(formData);
      SOWGenerationRequestSchema.parse(sowRequest);
      setValidationErrors({});
      return true;
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
      }
      setValidationErrors(errors);
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      const sowRequest = transformFormDataToSOWRequest(formData);
      
      // Add assembly data to SOW request
      sowRequest.roofAssemblyLayers = assemblyLayers;
      sowRequest.projectType = projectType;
      
      console.log('SOW generation requested with validated data:', sowRequest);
      console.log('🏗️ Including assembly layers:', assemblyLayers);
      console.log('🔄 Sync state:', syncState);
      console.log('🎯 Template compatibility:', syncState.templateCompatibility);

      // Log membrane type for template selection logic
      if (formData.membraneType) {
        const templateCategory = getTemplateCategory(formData.membraneType);
        console.log('Selected membrane type for template logic:', formData.membraneType, 'Template category:', templateCategory);
      }
      
      onSubmit(sowRequest);
    } catch (error: any) {
      console.error('Form transformation error:', error);
      toast({
        title: "Form Error",
        description: "There was an error processing the form data.",
        variant: "destructive"
      });
    }
  };

  const isFormValid = formData.projectName && formData.projectAddress && Object.keys(validationErrors).length === 0;

  return (
    <Card className={`bg-white/10 backdrop-blur-md border-blue-400/30 ${disabled ? 'opacity-50' : ''}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          SOW Generation Form
          {initialData && (
            <Badge className="bg-green-600 text-white">
              Pre-filled from Inspection
            </Badge>
          )}
          {/* ✅ PHASE 2: Enhanced sync indicators */}
          <div className="flex items-center gap-2 ml-auto">
            {syncState.autoSyncEnabled && (
              <Badge className="bg-blue-600 text-white text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Smart Sync
              </Badge>
            )}
            {syncState.isAnalyzing && (
              <Badge className="bg-orange-600 text-white text-xs">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Analyzing
              </Badge>
            )}
            {syncState.templateCompatibility && (
              <Badge className="bg-green-600 text-white text-xs">
                {syncState.templateCompatibility.confidence}% Match
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {disabled && (
          <Alert className="mb-6 bg-red-900/50 border-red-400/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              SOW generation is currently unavailable. Please ensure the backend server is running and try again.
            </AlertDescription>
          </Alert>
        )}

        {initialData && (
          <Alert className="mb-6 bg-green-900/50 border-green-400/30">
            <ClipboardCheck className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Field Inspection Data Loaded:</strong> {initialData.projectName || initialData.project_name} - 
                  Data from the completed field inspection has been automatically populated in the form below.
                  {assemblyLayers.length > 0 && (
                    <div className="mt-1">
                      <Badge className="bg-blue-600 text-white text-xs">
                        Assembly Layers: {assemblyLayers.length}
                      </Badge>
                    </div>
                  )}
                </div>
                <Badge className="bg-green-600 text-white">
                  Auto-filled
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Streamlined 4-tab layout */}
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/10 backdrop-blur-md">
              <TabsTrigger value="project" disabled={disabled} className="data-[state=active]:bg-blue-600 text-slate-950">
                <Building2 className="w-4 h-4 mr-2" />
                Project
              </TabsTrigger>
              <TabsTrigger value="assembly" disabled={disabled} className="data-[state=active]:bg-blue-600 text-slate-950">
                <Layers className="w-4 h-4 mr-2" />
                Assembly
              </TabsTrigger>
              <TabsTrigger value="wind" disabled={disabled} className="data-[state=active]:bg-blue-600 text-gray-950">
                <Wind className="w-4 h-4 mr-2" />
                Wind
              </TabsTrigger>
              <TabsTrigger value="upload" disabled={disabled} className="data-[state=active]:bg-blue-600 text-gray-950">
                <Upload className="w-4 h-4 mr-2" />
                Files
              </TabsTrigger>
            </TabsList>

            {/* Enhanced Project Tab with Building Height */}
            <TabsContent value="project" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName" className="text-blue-200">Project Name *</Label>
                  <Input 
                    id="projectName" 
                    value={formData.projectName} 
                    onChange={e => handleInputChange('projectName', e.target.value)} 
                    className="bg-white/10 border-blue-400/30 text-white" 
                    disabled={disabled} 
                    required 
                  />
                  {validationErrors.projectName && <p className="text-red-400 text-sm mt-1">{validationErrors.projectName}</p>}
                </div>
                <div>
                  <Label htmlFor="projectAddress" className="text-blue-200">Project Address *</Label>
                  <Input 
                    id="projectAddress" 
                    value={formData.projectAddress} 
                    onChange={e => handleInputChange('projectAddress', e.target.value)} 
                    className="bg-white/10 border-blue-400/30 text-white" 
                    disabled={disabled} 
                    required 
                  />
                  {validationErrors.projectAddress && <p className="text-red-400 text-sm mt-1">{validationErrors.projectAddress}</p>}
                </div>
                <div>
                  <Label htmlFor="city" className="text-blue-200">City</Label>
                  <Input 
                    id="city" 
                    value={formData.city} 
                    onChange={e => handleInputChange('city', e.target.value)} 
                    className="bg-white/10 border-blue-400/30 text-white" 
                    disabled={disabled} 
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-blue-200">State</Label>
                  <Input 
                    id="state" 
                    value={formData.state} 
                    onChange={e => handleInputChange('state', e.target.value)} 
                    className="bg-white/10 border-blue-400/30 text-white" 
                    disabled={disabled} 
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode" className="text-blue-200">Zip Code</Label>
                  <Input 
                    id="zipCode" 
                    value={formData.zipCode} 
                    onChange={e => handleInputChange('zipCode', e.target.value)} 
                    className="bg-white/10 border-blue-400/30 text-white" 
                    disabled={disabled} 
                  />
                </div>
                <div>
                  <Label htmlFor="buildingHeight" className="text-blue-200">Building Height (ft)</Label>
                  <Input 
                    id="buildingHeight" 
                    type="number" 
                    value={formData.buildingHeight} 
                    onChange={e => handleInputChange('buildingHeight', e.target.value)} 
                    className="bg-white/10 border-blue-400/30 text-white" 
                    disabled={disabled} 
                  />
                  {validationErrors.buildingHeight && <p className="text-red-400 text-sm mt-1">{validationErrors.buildingHeight}</p>}
                </div>
              </div>
            </TabsContent>

            {/* ✅ PHASE 2: Completely Enhanced Assembly Tab with Full Smart Sync */}
            <TabsContent value="assembly" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white text-lg font-semibold">Intelligent Roof Assembly Configuration</h3>
                    <p className="text-blue-200 text-sm">
                      {syncState.syncMode === 'template-to-assembly' && 'Template selections drive assembly generation'}
                      {syncState.syncMode === 'assembly-to-template' && 'Assembly layers suggest compatible templates'}
                      {syncState.syncMode === 'manual' && 'Manual configuration mode'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {assemblyLayers.length > 0 && (
                      <Badge className="bg-green-600 text-white">
                        {assemblyLayers.length} Layers
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => syncActions.setAutoSyncEnabled(!syncState.autoSyncEnabled)}
                      className="text-blue-200 border-blue-400/30"
                    >
                      <Settings className="w-3 h-3 mr-1" />
                      {syncState.autoSyncEnabled ? 'Auto' : 'Manual'}
                    </Button>
                  </div>
                </div>

                {/* ✅ PHASE 2: Enhanced Smart Sync Status with Real-time Feedback */}
                {syncState.templateCompatibility && (
                  <Alert className="bg-blue-900/50 border-blue-400/30">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-200">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span><strong>Recommended Template:</strong> {syncState.templateCompatibility.recommendedTemplate}</span>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600 text-white text-xs">
                              {syncState.templateCompatibility.confidence}% Match
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {syncState.syncMode.replace('-', ' → ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs">
                          <strong>Compatible:</strong> {syncState.templateCompatibility.compatibleTemplates.slice(0, 3).join(', ')}
                          {syncState.templateCompatibility.compatibleTemplates.length > 3 && ` +${syncState.templateCompatibility.compatibleTemplates.length - 3} more`}
                        </div>
                        {syncState.templateCompatibility.warnings.length > 0 && (
                          <div className="text-xs opacity-75">
                            ⚠️ {syncState.templateCompatibility.warnings.join(', ')}
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* ✅ PHASE 2: Enhanced Assembly Validation with Detailed Feedback */}
                {syncState.assemblyValidation && (
                  <div className="space-y-2">
                    {!syncState.assemblyValidation.isValid && (
                      <Alert className="bg-red-900/50 border-red-400/30">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-200">
                          <div className="space-y-1">
                            <div><strong>Assembly Issues:</strong></div>
                            {syncState.assemblyValidation.errors.map((error, idx) => (
                              <div key={idx} className="text-xs">• {error}</div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {syncState.assemblyValidation.warnings.length > 0 && (
                      <Alert className="bg-orange-900/50 border-orange-400/30">
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                        <AlertDescription className="text-orange-200">
                          <div className="space-y-1">
                            <div><strong>Assembly Warnings:</strong></div>
                            {syncState.assemblyValidation.warnings.map((warning, idx) => (
                              <div key={idx} className="text-xs">• {warning}</div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Enhanced Template Selection + Assembly Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium">Template Selection</h4>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleManualSync}
                          disabled={!formData.membraneType && !formData.insulationType && !formData.deckType}
                          className="text-blue-200 border-blue-400/30"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Force Sync
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => syncActions.resetSync()}
                          className="text-blue-200 border-blue-400/30"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Reset
                        </Button>
                      </div>
                    </div>
                    
                    {/* Membrane Type */}
                    <div className="space-y-3">
                      <Label htmlFor="membraneType" className="text-blue-200 text-sm font-semibold">
                        Membrane Type *
                        {syncState.autoSyncEnabled && (
                          <Badge className="ml-2 bg-yellow-600 text-white text-xs">
                            <Zap className="w-2 h-2 mr-1" />
                            Auto-Sync
                          </Badge>
                        )}
                      </Label>
                      <Select value={formData.membraneType} onValueChange={value => handleInputChange('membraneType', value)} disabled={disabled}>
                        <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                          <SelectValue placeholder="Select membrane type" />
                        </SelectTrigger>
                        <SelectContent>
                          {MEMBRANE_TYPES.map(membrane => (
                            <SelectItem key={membrane.value} value={membrane.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{membrane.label}</span>
                                <span className="text-xs text-gray-500">{membrane.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Insulation Type */}
                    <div className="space-y-3">
                      <Label htmlFor="insulationType" className="text-blue-200 text-sm font-semibold">
                        Insulation Type
                      </Label>
                      <Select value={formData.insulationType} onValueChange={value => handleInputChange('insulationType', value)} disabled={disabled}>
                        <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                          <SelectValue placeholder="Select insulation type" />
                        </SelectTrigger>
                        <SelectContent>
                          {INSULATION_TYPES.map(insulation => (
                            <SelectItem key={insulation.value} value={insulation.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{insulation.label}</span>
                                <span className="text-xs text-gray-500">{insulation.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Deck Type */}
                    <div className="space-y-3">
                      <Label htmlFor="deckType" className="text-blue-200 text-sm font-semibold">Deck Type</Label>
                      <Select value={formData.deckType} onValueChange={value => handleInputChange('deckType', value)} disabled={disabled}>
                        <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                          <SelectValue placeholder="Select deck type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="steel">Steel Deck</SelectItem>
                          <SelectItem value="concrete">Concrete Deck</SelectItem>
                          <SelectItem value="wood">Wood Deck</SelectItem>
                          <SelectItem value="gypsum">Gypsum Deck</SelectItem>
                          <SelectItem value="loadmaster">Loadmaster Deck</SelectItem>
                          <SelectItem value="composite">Composite Deck</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Template Selection Logic Display */}
                    {formData.membraneType && (
                      <Alert className="bg-purple-900/50 border-purple-400/30">
                        <Info className="h-4 w-4 text-purple-400" />
                        <AlertDescription className="text-purple-200 text-xs">
                          <strong>Template Logic:</strong> {MEMBRANE_TYPES.find(m => m.value === formData.membraneType)?.label} → 
                          {getTemplateCategory(formData.membraneType)} category
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-white font-medium">Assembly Layers</h4>
                    {initialData && assemblyLayers.length > 0 && (
                      <Alert className="bg-blue-900/50 border-blue-400/30">
                        <Info className="h-4 w-4 text-blue-400" />
                        <AlertDescription className="text-blue-200 text-xs">
                          Assembly layers loaded from field inspection. Smart sync available.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* Roof Assembly Editor Integration */}
                <div className="bg-white/5 rounded-lg p-4 border border-blue-400/20">
                  <RoofAssemblyEditor
                    layers={assemblyLayers}
                    onChange={handleAssemblyChange}
                    projectType={projectType}
                    onProjectTypeChange={handleProjectTypeChange}
                    readOnly={disabled}
                  />
                </div>

                {/* ✅ PHASE 2: Enhanced Assembly Summary with Complete Smart Feedback */}
                {assemblyLayers.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">Assembly Summary</h4>
                      <div className="flex items-center gap-2">
                        {syncState.templateCompatibility && (
                          <Badge className="bg-blue-600 text-white text-xs">
                            {syncState.templateCompatibility.recommendedTemplate.split('-')[0]}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {syncState.syncMode}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 border border-blue-400/20">
                      <div className="space-y-2">
                        {assemblyLayers.map((layer, index) => (
                          <div key={layer.id} className="flex items-center justify-between text-sm">
                            <span className="text-blue-200">
                              {assemblyLayers.length - index}. {layer.description || `${layer.material || ''} ${layer.type}`.trim()}
                            </span>
                            <div className="flex gap-2">
                              {layer.thickness && (
                                <Badge variant="outline" className="text-xs">
                                  {layer.thickness}
                                </Badge>
                              )}
                              {layer.attachment && (
                                <Badge variant="outline" className="text-xs">
                                  {layer.attachment.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* ✅ PHASE 2: Enhanced smart suggestions */}
                      {syncState.assemblyValidation?.suggestions && syncState.assemblyValidation.suggestions.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-blue-400/20">
                          <div className="text-blue-200 text-xs font-medium mb-2">💡 Smart Suggestions:</div>
                          {syncState.assemblyValidation.suggestions.map((suggestion, idx) => (
                            <div key={idx} className="text-blue-300 text-xs">• {suggestion}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Wind Parameters Tab */}
            <TabsContent value="wind" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="windSpeed" className="text-blue-200">Design Wind Speed (mph)</Label>
                  <Input 
                    id="windSpeed" 
                    type="number" 
                    value={formData.windSpeed} 
                    onChange={e => handleInputChange('windSpeed', e.target.value)} 
                    className="bg-white/10 border-blue-400/30 text-white" 
                    disabled={disabled} 
                  />
                  {validationErrors.windSpeed && <p className="text-red-400 text-sm mt-1">{validationErrors.windSpeed}</p>}
                </div>
                <div>
                  <Label htmlFor="exposureCategory" className="text-blue-200">Exposure Category</Label>
                  <Select value={formData.exposureCategory} onValueChange={value => handleInputChange('exposureCategory', value)} disabled={disabled}>
                    <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                      <SelectValue placeholder="Select exposure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="B">B - Urban/Suburban</SelectItem>
                      <SelectItem value="C">C - Open Terrain</SelectItem>
                      <SelectItem value="D">D - Flat/Unobstructed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="buildingClassification" className="text-blue-200">Building Classification</Label>
                  <Select value={formData.buildingClassification} onValueChange={value => handleInputChange('buildingClassification', value)} disabled={disabled}>
                    <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                      <SelectValue placeholder="Select classification" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="I">I - Low Hazard</SelectItem>
                      <SelectItem value="II">II - Standard</SelectItem>
                      <SelectItem value="III">III - Substantial Hazard</SelectItem>
                      <SelectItem value="IV">IV - Essential Facilities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* File Upload Tab */}
            <TabsContent value="upload" className="space-y-4">
              <div>
                <Label htmlFor="takeoffFile" className="text-blue-200">Takeoff File (PDF, Excel, etc.)</Label>
                <Input 
                  id="takeoffFile" 
                  type="file" 
                  onChange={handleFileUpload} 
                  className="bg-white/10 border-blue-400/30 text-white file:bg-blue-600 file:text-white file:border-0 file:rounded" 
                  accept=".pdf,.xlsx,.xls,.csv" 
                  disabled={disabled} 
                />
                {formData.takeoffFile && (
                  <p className="text-green-400 text-sm mt-2">
                    File selected: {formData.takeoffFile.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="notes" className="text-blue-200">Additional Notes</Label>
                <Textarea 
                  id="notes" 
                  value={formData.notes} 
                  onChange={e => handleInputChange('notes', e.target.value)} 
                  className="bg-white/10 border-blue-400/30 text-white" 
                  rows={4} 
                  placeholder="Any additional specifications or requirements..." 
                  disabled={disabled} 
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2" 
              disabled={disabled || !isFormValid}
            >
              <FileText className="w-4 h-4 mr-2" />
              Generate SOW
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SOWInputForm;