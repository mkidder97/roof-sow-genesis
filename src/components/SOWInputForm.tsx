
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, CheckCircle, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProjectData {
  projectName?: string;
  address?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  buildingHeight?: number;
  squareFootage?: number;
  membraneType?: string;
  selectedMembraneBrand?: string;
  windSpeed?: number;
  exposureCategory?: string;
  projectType?: string;
  numberOfDrains?: number;
  numberOfPenetrations?: number;
  _inspectionId?: string;
  _originalData?: any;
}

interface SOWInputFormProps {
  onSubmit: (data: ProjectData, file?: File) => void;
  initialData?: ProjectData | null;
}

export const SOWInputForm: React.FC<SOWInputFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState<ProjectData>({
    projectName: '',
    address: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    buildingHeight: undefined,
    squareFootage: undefined,
    membraneType: '',
    selectedMembraneBrand: '',
    windSpeed: undefined,
    exposureCategory: '',
    projectType: '',
    numberOfDrains: undefined,
    numberOfPenetrations: undefined,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileProcessingStatus, setFileProcessingStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [processingError, setProcessingError] = useState<string>('');
  const [showOriginalData, setShowOriginalData] = useState(false);

  useEffect(() => {
    if (initialData) {
      console.log('Received initial data:', initialData);
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  const handleInputChange = (field: keyof ProjectData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const processTakeoffFile = async (file: File) => {
    setIsProcessingFile(true);
    setFileProcessingStatus('idle');
    setProcessingError('');

    try {
      // Simulate processing for now - will be connected to backend later
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful processing
      setFileProcessingStatus('success');
      console.log('File processed successfully (mock)');
    } catch (error) {
      console.error('Error processing takeoff file:', error);
      setProcessingError(error instanceof Error ? error.message : 'Failed to process takeoff file');
      setFileProcessingStatus('error');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      await processTakeoffFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, uploadedFile || undefined);
  };

  const resetForm = () => {
    setFormData({
      projectName: '',
      address: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      buildingHeight: undefined,
      squareFootage: undefined,
      membraneType: '',
      selectedMembraneBrand: '',
      windSpeed: undefined,
      exposureCategory: '',
      projectType: '',
      numberOfDrains: undefined,
      numberOfPenetrations: undefined,
    });
    setUploadedFile(null);
    setFileProcessingStatus('idle');
    setProcessingError('');
  };

  const hasInspectionData = initialData && initialData._inspectionId;

  return (
    <div className="space-y-6">
      {/* Inspection Data Status */}
      {hasInspectionData && (
        <Card className="bg-green-900/50 border-green-400/30">
          <CardHeader>
            <CardTitle className="text-green-200 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Field Inspection Data Loaded
              <Badge className="bg-green-600 text-white ml-2">
                ID: {initialData._inspectionId}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{formData.numberOfDrains || 0}</div>
                <div className="text-green-200 text-sm">Drains Detected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{formData.numberOfPenetrations || 0}</div>
                <div className="text-green-200 text-sm">Penetrations Detected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{formData.squareFootage?.toLocaleString() || 'N/A'}</div>
                <div className="text-green-200 text-sm">Square Footage</div>
              </div>
            </div>
            
            {initialData._originalData && (
              <Collapsible open={showOriginalData} onOpenChange={setShowOriginalData}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="border-green-400 text-green-200 hover:bg-green-600">
                    <Eye className="w-4 h-4 mr-2" />
                    {showOriginalData ? 'Hide' : 'View'} Original Inspection Data
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="bg-green-950/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <pre className="text-green-200 text-xs">
                      {JSON.stringify(initialData._originalData, null, 2)}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Project Information */}
        <Card className="bg-white/5 border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              Customer & Project Information
              {hasInspectionData && (
                <Badge className="bg-blue-600 text-white">
                  Auto-filled from inspection
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName" className="text-blue-200">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName || ''}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-blue-300"
                  placeholder="Customer or company name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone" className="text-blue-200">Customer Phone *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone || ''}
                  onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-blue-300"
                  placeholder="(555) 123-4567"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerEmail" className="text-blue-200">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.customerEmail || ''}
                onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                className="bg-white/10 border-blue-400/30 text-white placeholder:text-blue-300"
                placeholder="customer@email.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectName" className="text-blue-200">Building/Project Name *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName || ''}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-blue-300"
                  placeholder="Enter building name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="address" className="text-blue-200">Project Address *</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-blue-300"
                  placeholder="Enter complete address"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Building Specifications */}
        <Card className="bg-white/5 border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">Building Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buildingHeight" className="text-blue-200">Building Height (ft)</Label>
                <Input
                  id="buildingHeight"
                  type="number"
                  value={formData.buildingHeight || ''}
                  onChange={(e) => handleInputChange('buildingHeight', parseFloat(e.target.value) || 0)}
                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-blue-300"
                  placeholder="Height in feet"
                />
              </div>
              <div>
                <Label htmlFor="squareFootage" className="text-blue-200">Square Footage</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  value={formData.squareFootage || ''}
                  onChange={(e) => handleInputChange('squareFootage', parseFloat(e.target.value) || 0)}
                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-blue-300"
                  placeholder="Total sq ft"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numberOfDrains" className="text-blue-200">Number of Drains</Label>
                <Input
                  id="numberOfDrains"
                  type="number"
                  value={formData.numberOfDrains || ''}
                  onChange={(e) => handleInputChange('numberOfDrains', parseInt(e.target.value) || 0)}
                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-blue-300"
                  placeholder="Total drains"
                />
              </div>
              <div>
                <Label htmlFor="numberOfPenetrations" className="text-blue-200">Number of Penetrations</Label>
                <Input
                  id="numberOfPenetrations"
                  type="number"
                  value={formData.numberOfPenetrations || ''}
                  onChange={(e) => handleInputChange('numberOfPenetrations', parseInt(e.target.value) || 0)}
                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-blue-300"
                  placeholder="Total penetrations"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="windSpeed" className="text-blue-200">Wind Speed (mph)</Label>
                <Input
                  id="windSpeed"
                  type="number"
                  value={formData.windSpeed || ''}
                  onChange={(e) => handleInputChange('windSpeed', parseFloat(e.target.value) || 0)}
                  className="bg-white/10 border-blue-400/30 text-white placeholder:text-blue-300"
                  placeholder="Design wind speed"
                />
              </div>
              <div>
                <Label htmlFor="membraneType" className="text-blue-200">Membrane Type</Label>
                <Select value={formData.membraneType || ''} onValueChange={(value) => handleInputChange('membraneType', value)}>
                  <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                    <SelectValue placeholder="Select membrane type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TPO">TPO</SelectItem>
                    <SelectItem value="PVC">PVC</SelectItem>
                    <SelectItem value="EPDM">EPDM</SelectItem>
                    <SelectItem value="Modified Bitumen">Modified Bitumen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="exposureCategory" className="text-blue-200">Exposure Category</Label>
                <Select value={formData.exposureCategory || ''} onValueChange={(value) => handleInputChange('exposureCategory', value)}>
                  <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                    <SelectValue placeholder="Select exposure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B">Category B</SelectItem>
                    <SelectItem value="C">Category C</SelectItem>
                    <SelectItem value="D">Category D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="projectType" className="text-blue-200">Project Type</Label>
              <Select value={formData.projectType || ''} onValueChange={(value) => handleInputChange('projectType', value)}>
                <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recover">Recover</SelectItem>
                  <SelectItem value="tearoff">Tear-Off</SelectItem>
                  <SelectItem value="replacement">Replacement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload & Auto-Fill */}
        <Card className="bg-white/5 border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">Document Upload & Auto-Fill</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-blue-400/30 rounded-lg p-6 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={isProcessingFile}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {isProcessingFile ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
                    <p className="text-white mb-1">Processing Takeoff File...</p>
                    <p className="text-blue-300 text-sm">Extracting project data</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-white mb-1">Upload Takeoff File for Auto-Fill</p>
                    <p className="text-blue-300 text-sm">PDF, Excel, or CSV files supported</p>
                  </div>
                )}
              </label>
              
              {uploadedFile && !isProcessingFile && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-white">{uploadedFile.name}</span>
                  {fileProcessingStatus === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  {fileProcessingStatus === 'error' && (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              )}
            </div>

            {/* Processing Status Messages */}
            {fileProcessingStatus === 'success' && (
              <Alert className="mt-4 bg-green-500/20 border-green-500/30">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-200">
                  Takeoff file processed successfully! Ready for SOW generation.
                </AlertDescription>
              </Alert>
            )}

            {fileProcessingStatus === 'error' && (
              <Alert className="mt-4 bg-red-500/20 border-red-500/30">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-200">
                  Error processing takeoff file: {processingError}. You can still fill the form manually.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-4 justify-center">
          <Button 
            type="button"
            onClick={resetForm}
            variant="outline"
            className="border-blue-400 text-blue-200 hover:bg-blue-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Form
          </Button>
          <Button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
            disabled={isProcessingFile}
          >
            {isProcessingFile ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5 mr-2" />
                Generate SOW Document
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
