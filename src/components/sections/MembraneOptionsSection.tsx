
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MembraneOptionsProps {
  data: {
    membraneThickness: string;
    membraneColor: string;
  };
  onChange: (updates: Partial<MembraneOptionsProps['data']>) => void;
}

export const MembraneOptionsSection: React.FC<MembraneOptionsProps> = ({ data, onChange }) => {
  // Ensure we have default values to prevent empty strings
  const membraneThickness = data.membraneThickness || '60';
  const membraneColor = data.membraneColor || 'White';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Membrane Thickness (mil)
          </Label>
          <Select 
            value={membraneThickness} 
            onValueChange={(value) => {
              if (value && value.trim() !== '') {
                onChange({ membraneThickness: value });
              }
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select thickness" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="45">45 mil</SelectItem>
              <SelectItem value="60">60 mil</SelectItem>
              <SelectItem value="80">80 mil</SelectItem>
              <SelectItem value="115">115 mil</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Membrane Color
          </Label>
          <Select 
            value={membraneColor} 
            onValueChange={(value) => {
              if (value && value.trim() !== '') {
                onChange({ membraneColor: value });
              }
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="White">White</SelectItem>
              <SelectItem value="Gray">Gray</SelectItem>
              <SelectItem value="Tan">Tan</SelectItem>
              <SelectItem value="Black">Black</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
