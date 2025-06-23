
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText } from 'lucide-react';

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
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleInputChange = (field: keyof ProjectData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, uploadedFile || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-white/5 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white">Customer & Project Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName" className="text-blue-200">Customer Name</Label>
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
              <Label htmlFor="customerPhone" className="text-blue-200">Customer Phone</Label>
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
              <Label htmlFor="projectName" className="text-blue-200">Building/Project Name</Label>
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
              <Label htmlFor="address" className="text-blue-200">Project Address</Label>
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

      <Card className="bg-white/5 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white">Building Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <SelectItem value="Recover">Recover</SelectItem>
                <SelectItem value="Tear-Off">Tear-Off</SelectItem>
                <SelectItem value="Replacement">Replacement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white">Document Upload (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-blue-400/30 rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.xlsx,.xls,.csv"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-white mb-1">Upload Field Inspection Report or Specification Document</p>
              <p className="text-blue-300 text-sm">PDF, Excel, or CSV files supported</p>
            </label>
            {uploadedFile && (
              <div className="mt-4 flex items-center justify-center gap-2 text-green-400">
                <FileText className="w-4 h-4" />
                <span>{uploadedFile.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
        >
          Generate SOW Document
        </Button>
      </div>
    </form>
  );
};
