
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldInspection } from '@/types/fieldInspection';

interface BuildingSpecsStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const BuildingSpecsStep: React.FC<BuildingSpecsStepProps> = ({ data, onChange, readOnly = false }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="building_height" className="text-white">Building Height (ft) *</Label>
          <Input
            id="building_height"
            type="number"
            value={data.building_height || ''}
            onChange={(e) => onChange({ building_height: Number(e.target.value) })}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="Enter height in feet"
            disabled={readOnly}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="square_footage" className="text-white">Square Footage *</Label>
          <Input
            id="square_footage"
            type="number"
            value={data.square_footage || ''}
            onChange={(e) => onChange({ square_footage: Number(e.target.value) })}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="Enter square footage"
            disabled={readOnly}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="building_length" className="text-white">Building Length (ft)</Label>
          <Input
            id="building_length"
            type="number"
            value={data.building_length || ''}
            onChange={(e) => onChange({ building_length: Number(e.target.value) })}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="Enter length in feet"
            disabled={readOnly}
          />
        </div>
        
        <div>
          <Label htmlFor="building_width" className="text-white">Building Width (ft)</Label>
          <Input
            id="building_width"
            type="number"
            value={data.building_width || ''}
            onChange={(e) => onChange({ building_width: Number(e.target.value) })}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="Enter width in feet"
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="number_of_stories" className="text-white">Number of Stories</Label>
          <Select
            value={data.number_of_stories?.toString() || ''}
            onValueChange={(value) => onChange({ number_of_stories: parseInt(value) })}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select number of stories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Story</SelectItem>
              <SelectItem value="2">2 Stories</SelectItem>
              <SelectItem value="3">3+ Stories</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="roof_slope" className="text-white">Roof Slope</Label>
          <Select
            value={data.roof_slope || ''}
            onValueChange={(value) => onChange({ roof_slope: value })}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select roof slope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flat">Flat (0-2%)</SelectItem>
              <SelectItem value="low">Low Slope (2-10%)</SelectItem>
              <SelectItem value="steep">Steep Slope (&gt;10%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-green-500/20 rounded-lg p-4">
        <p className="text-green-200 text-sm">
          <strong>Measurement Tips:</strong><br />
          • Use measuring tape for accurate dimensions<br />
          • Count building stories from exterior view<br />
          • Record roof slope observations for membrane selection
        </p>
      </div>
    </div>
  );
};

export default BuildingSpecsStep;
