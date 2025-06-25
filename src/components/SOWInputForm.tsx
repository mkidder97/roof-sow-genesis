
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
import { Upload, FileText, Building2, Wind, Settings, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { 
  SOWFormData, 
  FieldInspectionData, 
  SOWGenerationRequest,
  transformInspectionToSOWRequest,
  transformFormDataToSOWRequest,
  createSOWError,
  SOWGenerationRequestSchema 
} from '@/types/sowGeneration';
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
    }
  }, [initialData]);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, Excel, or CSV file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
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
        variant: "destructive",
      });
      return;
    }
    
    try {
      const sowRequest = transformFormDataToSOWRequest(formData);
      console.log('SOW generation requested with validated data:', sowRequest);
      onSubmit(sowRequest);
    } catch (error: any) {
      console.error('Form transformation error:', error);
      toast({
        title: "Form Error",
        description: "There was an error processing the form data.",
        variant: "destructive",
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
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-white/10 backdrop-blur-md">
              <TabsTrigger 
                value="project" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                disabled={disabled}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Project
              </TabsTrigger>
              <TabsTrigger 
                value="building" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                disabled={disabled}
              >
                <Settings className="w-4 h-4 mr-2" />
                Building
              </TabsTrigger>
              <TabsTrigger 
                value="wind" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                disabled={disabled}
              >
                <Wind className="w-4 h-4 mr-2" />
                Wind
              </TabsTrigger>
              <TabsTrigger 
                value="upload" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                disabled={disabled}
              >
                <Upload className="w-4 h-4 mr-2" />
                Files
              </TabsTrigger>
            </TabsList>

            {/* Project Information Tab */}
            <TabsContent value="project" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName" className="text-blue-200">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => handleInputChange('projectName', e.target.value)}
                    className="bg-white/10 border-blue-400/30 text-white"
                    disabled={disabled}
                    required
                  />
                  {validationErrors.projectName && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.projectName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="projectAddress" className="text-blue-200">Project Address *</Label>
                  <Input
                    id="projectAddress"
                    value={formData.projectAddress}
                    onChange={(e) => handleInputChange('projectAddress', e.target.value)}
                    className="bg-white/10 border-blue-400/30 text-white"
                    disabled={disabled}
                    required
                  />
                  {validationErrors.projectAddress && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.projectAddress}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="city" className="text-blue-200">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="bg-white/10 border-blue-400/30 text-white"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-blue-200">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="bg-white/10 border-blue-400/30 text-white"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode" className="text-blue-200">Zip Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="bg-white/10 border-blue-400/30 text-white"
                    disabled={disabled}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Building Specifications Tab */}
            <TabsContent value="building" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="buildingHeight" className="text-blue-200">Building Height (ft)</Label>
                  <Input
                    id="buildingHeight"
                    type="number"
                    value={formData.buildingHeight}
                    onChange={(e) => handleInputChange('buildingHeight', e.target.value)}
                    className="bg-white/10 border-blue-400/30 text-white"
                    disabled={disabled}
                  />
                  {validationErrors.buildingHeight && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.buildingHeight}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="deckType" className="text-blue-200">Deck Type</Label>
                  <Select 
                    value={formData.deckType} 
                    onValueChange={(value) => handleInputChange('deckType', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                      <SelectValue placeholder="Select deck type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concrete">Concrete</SelectItem>
                      <SelectItem value="metal">Metal</SelectItem>
                      <SelectItem value="wood">Wood</SelectItem>
                      <SelectItem value="gypsum">Gypsum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="membraneType" className="text-blue-200">Membrane Type</Label>
                  <Select 
                    value={formData.membraneType} 
                    onValueChange={(value) => handleInputChange('membraneType', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                      <SelectValue placeholder="Select membrane type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tpo">TPO</SelectItem>
                      <SelectItem value="epdm">EPDM</SelectItem>
                      <SelectItem value="pvc">PVC</SelectItem>
                      <SelectItem value="modified-bitumen">Modified Bitumen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="insulationType" className="text-blue-200">Insulation Type</Label>
                  <Select 
                    value={formData.insulationType} 
                    onValueChange={(value) => handleInputChange('insulationType', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                      <SelectValue placeholder="Select insulation type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="polyiso">Polyiso</SelectItem>
                      <SelectItem value="eps">EPS</SelectItem>
                      <SelectItem value="xps">XPS</SelectItem>
                      <SelectItem value="mineral-wool">Mineral Wool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                    onChange={(e) => handleInputChange('windSpeed', e.target.value)}
                    className="bg-white/10 border-blue-400/30 text-white"
                    disabled={disabled}
                  />
                  {validationErrors.windSpeed && (
                    <p className="text-red-400 text-sm mt-1">{validationErrors.windSpeed}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="exposureCategory" className="text-blue-200">Exposure Category</Label>
                  <Select 
                    value={formData.exposureCategory} 
                    onValueChange={(value) => handleInputChange('exposureCategory', value)}
                    disabled={disabled}
                  >
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
                  <Select 
                    value={formData.buildingClassification} 
                    onValueChange={(value) => handleInputChange('buildingClassification', value)}
                    disabled={disabled}
                  >
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
                  onChange={(e) => handleInputChange('notes', e.target.value)}
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
