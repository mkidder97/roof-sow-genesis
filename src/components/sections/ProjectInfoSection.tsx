
import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Upload, X, ChevronDown, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectInfoProps {
  data: {
    projectName: string;
    address: string;
    companyName: string;
    elevation: number;
    deckType: string;
    exposureCategory: string;
    roofSlope: number;
    documentAttachment?: {
      filename: string;
      type: string;
      data: string;
    };
  };
  onChange: (updates: Partial<ProjectInfoProps['data']>) => void;
}

export const ProjectInfoSection: React.FC<ProjectInfoProps> = ({ data, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a PDF, JPG, or PNG file.');
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1]; // Remove data:mime;base64, prefix
      
      onChange({
        documentAttachment: {
          filename: file.name,
          type: file.type,
          data: base64Data,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    onChange({ documentAttachment: undefined });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Basic Project Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectName" className="text-sm font-medium text-slate-700">
                Project Name *
              </Label>
              <Input
                id="projectName"
                value={data.projectName}
                onChange={(e) => onChange({ projectName: e.target.value })}
                placeholder="Enter project name"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
                Company Name
              </Label>
              <Input
                id="companyName"
                value={data.companyName}
                onChange={(e) => onChange({ companyName: e.target.value })}
                placeholder="Enter company name"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="text-sm font-medium text-slate-700">
              Project Address *
            </Label>
            <Input
              id="address"
              value={data.address}
              onChange={(e) => onChange({ address: e.target.value })}
              placeholder="Enter complete project address"
              className="mt-1"
              required
            />
          </div>
        </div>

        {/* Site Specifications */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-200 pb-1">
            Site Specifications
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="elevation" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                Elevation (ft)
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-slate-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Auto-detected from address. Override if known.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="elevation"
                type="number"
                value={data.elevation || ''}
                onChange={(e) => onChange({ elevation: parseFloat(e.target.value) || 0 })}
                placeholder="Auto-detected"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="deckType" className="text-sm font-medium text-slate-700">
                Roof Deck Type
              </Label>
              <Select value={data.deckType} onValueChange={(value) => onChange({ deckType: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select deck type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Steel">Steel</SelectItem>
                  <SelectItem value="Wood">Wood</SelectItem>
                  <SelectItem value="Concrete">Concrete</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Upload Site Document or NOA
          </Label>
          
          {!data.documentAttachment ? (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
              <p className="text-sm text-slate-600 mb-2">
                Upload PDF, JPG, or PNG file
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
            </div>
          ) : (
            <div className="border border-slate-300 rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <Upload className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {data.documentAttachment.filename}
                    </p>
                    <p className="text-xs text-slate-500">
                      {data.documentAttachment.type}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-700 p-0"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              Advanced Options
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
              <div>
                <Label htmlFor="exposureCategory" className="text-sm font-medium text-slate-700">
                  Wind Exposure Category (Optional Override)
                </Label>
                <Select value={data.exposureCategory} onValueChange={(value) => onChange({ exposureCategory: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Auto-determined" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Auto-determined</SelectItem>
                    <SelectItem value="B">Category B</SelectItem>
                    <SelectItem value="C">Category C</SelectItem>
                    <SelectItem value="D">Category D</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="roofSlope" className="text-sm font-medium text-slate-700">
                  Roof Slope (%)
                </Label>
                <Input
                  id="roofSlope"
                  type="number"
                  step="0.1"
                  value={data.roofSlope || ''}
                  onChange={(e) => onChange({ roofSlope: parseFloat(e.target.value) || 0 })}
                  placeholder="Optional"
                  className="mt-1"
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </TooltipProvider>
  );
};
