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
import { Upload, FileText, Building2, Wind, Settings, AlertTriangle, ClipboardCheck, Info } from 'lucide-react';
import { SOWFormData, FieldInspectionData, SOWGenerationRequest, transformInspectionToSOWRequest, transformFormDataToSOWRequest, createSOWError, SOWGenerationRequestSchema } from '@/types/sowGeneration';
import { MEMBRANE_TYPES, INSULATION_TYPES, getTemplateCategory } from '@/types/roofingTypes';
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
  const {
    toast
  } = useToast();
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
  const [activeTab, setActiveTab] = useState('project');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedMembraneInfo, setSelectedMembraneInfo] = useState<string>('');
  const [selectedInsulationInfo, setSelectedInsulationInfo] = useState<string>('');
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
    }
  }, [initialData]);
  const handleInputChange = (field: keyof SOWFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update info displays for membrane and insulation types
    if (field === 'membraneType') {
      const membraneInfo = MEMBRANE_TYPES.find(m => m.value === value)?.description || '';
      setSelectedMembraneInfo(membraneInfo);
    }
    if (field === 'insulationType') {
      const insulationInfo = INSULATION_TYPES.find(i => i.value === value)?.description || '';
      setSelectedInsulationInfo(insulationInfo);
    }

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = {
          ...prev
        };
        delete newErrors[field];
        return newErrors;
      });
    }
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
      console.log('SOW generation requested with validated data:', sowRequest);

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
  return <Card className={`bg-white/10 backdrop-blur-md border-blue-400/30 ${disabled ? 'opacity-50' : ''}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileText className="w-5 h-5" />
          SOW Generation Form
          {initialData && <Badge className="bg-green-600 text-white">
              Pre-filled from Inspection
            </Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {disabled && <Alert className="mb-6 bg-red-900/50 border-red-400/30">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              SOW generation is currently unavailable. Please ensure the backend server is running and try again.
            </AlertDescription>
          </Alert>}

        {initialData && <Alert className="mb-6 bg-green-900/50 border-green-400/30">
            <ClipboardCheck className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <strong>Field Inspection Data Loaded:</strong> {initialData.projectName || initialData.project_name} - 
                  Data from the completed field inspection has been automatically populated in the form below.
                </div>
                <Badge className="bg-green-600 text-white">
                  Auto-filled
                </Badge>
              </div>
            </AlertDescription>
          </Alert>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/10 backdrop-blur-md">
              <TabsTrigger value="project" disabled={disabled} className="data-[state=active]:bg-blue-600 text-slate-950">
                <Building2 className="w-4 h-4 mr-2" />
                Project
              </TabsTrigger>
              <TabsTrigger value="building" disabled={disabled} className="data-[state=active]:bg-blue-600 text-slate-950">
                <Settings className="w-4 h-4 mr-2" />
                Building
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

            {/* Project Information Tab */}
            <TabsContent value="project" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName" className="text-blue-200">Project Name *</Label>
                  <Input id="projectName" value={formData.projectName} onChange={e => handleInputChange('projectName', e.target.value)} className="bg-white/10 border-blue-400/30 text-white" disabled={disabled} required />
                  {validationErrors.projectName && <p className="text-red-400 text-sm mt-1">{validationErrors.projectName}</p>}
                </div>
                <div>
                  <Label htmlFor="projectAddress" className="text-blue-200">Project Address *</Label>
                  <Input id="projectAddress" value={formData.projectAddress} onChange={e => handleInputChange('projectAddress', e.target.value)} className="bg-white/10 border-blue-400/30 text-white" disabled={disabled} required />
                  {validationErrors.projectAddress && <p className="text-red-400 text-sm mt-1">{validationErrors.projectAddress}</p>}
                </div>
                <div>
                  <Label htmlFor="city" className="text-blue-200">City</Label>
                  <Input id="city" value={formData.city} onChange={e => handleInputChange('city', e.target.value)} className="bg-white/10 border-blue-400/30 text-white" disabled={disabled} />
                </div>
                <div>
                  <Label htmlFor="state" className="text-blue-200">State</Label>
                  <Input id="state" value={formData.state} onChange={e => handleInputChange('state', e.target.value)} className="bg-white/10 border-blue-400/30 text-white" disabled={disabled} />
                </div>
                <div>
                  <Label htmlFor="zipCode" className="text-blue-200">Zip Code</Label>
                  <Input id="zipCode" value={formData.zipCode} onChange={e => handleInputChange('zipCode', e.target.value)} className="bg-white/10 border-blue-400/30 text-white" disabled={disabled} />
                </div>
              </div>
            </TabsContent>

            {/* Enhanced Building Specifications Tab */}
            <TabsContent value="building" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buildingHeight" className="text-blue-200">Building Height (ft)</Label>
                  <Input id="buildingHeight" type="number" value={formData.buildingHeight} onChange={e => handleInputChange('buildingHeight', e.target.value)} className="bg-white/10 border-blue-400/30 text-white" disabled={disabled} />
                  {validationErrors.buildingHeight && <p className="text-red-400 text-sm mt-1">{validationErrors.buildingHeight}</p>}
                </div>
                <div>
                  <Label htmlFor="deckType" className="text-blue-200">Deck Type</Label>
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
              </div>

              {/* Enhanced Membrane Type Selection */}
              <div className="space-y-3">
                <Label htmlFor="membraneType" className="text-blue-200 text-lg font-semibold">
                  Membrane Type *
                  <Badge className="ml-2 bg-yellow-600 text-white text-xs">
                    Affects Template Selection
                  </Badge>
                </Label>
                <Select value={formData.membraneType} onValueChange={value => handleInputChange('membraneType', value)} disabled={disabled}>
                  <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                    <SelectValue placeholder="Select membrane type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBRANE_TYPES.map(membrane => <SelectItem key={membrane.value} value={membrane.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{membrane.label}</span>
                          <span className="text-xs text-gray-500">{membrane.description}</span>
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedMembraneInfo && <Alert className="bg-blue-900/50 border-blue-400/30">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-200">
                      <strong>Selected:</strong> {selectedMembraneInfo}
                    </AlertDescription>
                  </Alert>}
              </div>

              {/* Enhanced Insulation Type Selection */}
              <div className="space-y-3">
                <Label htmlFor="insulationType" className="text-blue-200 text-lg font-semibold">
                  Insulation Type
                </Label>
                <Select value={formData.insulationType} onValueChange={value => handleInputChange('insulationType', value)} disabled={disabled}>
                  <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                    <SelectValue placeholder="Select insulation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSULATION_TYPES.map(insulation => <SelectItem key={insulation.value} value={insulation.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{insulation.label}</span>
                          <span className="text-xs text-gray-500">{insulation.description}</span>
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedInsulationInfo && <Alert className="bg-green-900/50 border-green-400/30">
                    <Info className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-200">
                      <strong>Selected:</strong> {selectedInsulationInfo}
                    </AlertDescription>
                  </Alert>}
              </div>

              {/* Template Selection Notice */}
              {formData.membraneType && <Alert className="bg-purple-900/50 border-purple-400/30">
                  <Info className="h-4 w-4 text-purple-400" />
                  <AlertDescription className="text-purple-200">
                    <strong>Template Logic:</strong> Your selection of "{MEMBRANE_TYPES.find(m => m.value === formData.membraneType)?.label}" will determine the appropriate SOW template for generation.
                  </AlertDescription>
                </Alert>}
            </TabsContent>

            {/* Wind Parameters Tab */}
            <TabsContent value="wind" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="windSpeed" className="text-blue-200">Design Wind Speed (mph)</Label>
                  <Input id="windSpeed" type="number" value={formData.windSpeed} onChange={e => handleInputChange('windSpeed', e.target.value)} className="bg-white/10 border-blue-400/30 text-white" disabled={disabled} />
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
                <Input id="takeoffFile" type="file" onChange={handleFileUpload} className="bg-white/10 border-blue-400/30 text-white file:bg-blue-600 file:text-white file:border-0 file:rounded" accept=".pdf,.xlsx,.xls,.csv" disabled={disabled} />
                {formData.takeoffFile && <p className="text-green-400 text-sm mt-2">
                    File selected: {formData.takeoffFile.name}
                  </p>}
              </div>
              <div>
                <Label htmlFor="notes" className="text-blue-200">Additional Notes</Label>
                <Textarea id="notes" value={formData.notes} onChange={e => handleInputChange('notes', e.target.value)} className="bg-white/10 border-blue-400/30 text-white" rows={4} placeholder="Any additional specifications or requirements..." disabled={disabled} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8 py-2" disabled={disabled || !isFormValid}>
              <FileText className="w-4 h-4 mr-2" />
              Generate SOW
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>;
};