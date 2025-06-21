
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BuildingSpecsProps {
  data: {
    squareFootage: number;
    buildingHeight: number;
    length: number;
    width: number;
    projectType: string;
  };
  onChange: (updates: Partial<BuildingSpecsProps['data']>) => void;
}

export const BuildingSpecsSection: React.FC<BuildingSpecsProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="squareFootage" className="text-sm font-medium text-slate-700">
            Square Footage
          </Label>
          <Input
            id="squareFootage"
            type="number"
            value={data.squareFootage || ''}
            onChange={(e) => onChange({ squareFootage: Number(e.target.value) })}
            placeholder="0"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="buildingHeight" className="text-sm font-medium text-slate-700">
            Building Height (ft)
          </Label>
          <Input
            id="buildingHeight"
            type="number"
            value={data.buildingHeight || ''}
            onChange={(e) => onChange({ buildingHeight: Number(e.target.value) })}
            placeholder="0"
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="length" className="text-sm font-medium text-slate-700">
            Length (ft)
          </Label>
          <Input
            id="length"
            type="number"
            value={data.length || ''}
            onChange={(e) => onChange({ length: Number(e.target.value) })}
            placeholder="0"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="width" className="text-sm font-medium text-slate-700">
            Width (ft)
          </Label>
          <Input
            id="width"
            type="number"
            value={data.width || ''}
            onChange={(e) => onChange({ width: Number(e.target.value) })}
            placeholder="0"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label className="text-sm font-medium text-slate-700">
            Project Type
          </Label>
          <Select value={data.projectType} onValueChange={(value) => onChange({ projectType: value })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recover">Recover</SelectItem>
              <SelectItem value="tearoff">Tear-Off</SelectItem>
              <SelectItem value="replacement">Replacement</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
