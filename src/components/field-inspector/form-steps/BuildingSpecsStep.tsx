
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldInspection } from '@/types/fieldInspection';

interface BuildingSpecsStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
}

const BuildingSpecsStep: React.FC<BuildingSpecsStepProps> = ({ data, onChange }) => {
  const calculateSquareFootage = (length?: number, width?: number) => {
    if (length && width) {
      const sqft = length * width;
      onChange({ square_footage: sqft });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="building_height" className="text-white">Building Height *</Label>
          <Select
            value={data.building_height?.toString() || ''}
            onValueChange={(value) => onChange({ building_height: parseFloat(value) })}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select height range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">Under 30 ft</SelectItem>
              <SelectItem value="40">30-50 ft</SelectItem>
              <SelectItem value="75">50-100 ft</SelectItem>
              <SelectItem value="120">Over 100 ft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="number_of_stories" className="text-white">Number of Stories</Label>
          <Input
            id="number_of_stories"
            type="number"
            min="1"
            value={data.number_of_stories || 1}
            onChange={(e) => onChange({ number_of_stories: parseInt(e.target.value) || 1 })}
            className="bg-white/20 border-blue-400/30 text-white"
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
            onChange={(e) => {
              const length = parseFloat(e.target.value) || 0;
              onChange({ building_length: length });
              calculateSquareFootage(length, data.building_width);
            }}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="Enter length"
          />
        </div>
        
        <div>
          <Label htmlFor="building_width" className="text-white">Building Width (ft)</Label>
          <Input
            id="building_width"
            type="number"
            value={data.building_width || ''}
            onChange={(e) => {
              const width = parseFloat(e.target.value) || 0;
              onChange({ building_width: width });
              calculateSquareFootage(data.building_length, width);
            }}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="Enter width"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="square_footage" className="text-white">Square Footage *</Label>
        <Input
          id="square_footage"
          type="number"
          value={data.square_footage || ''}
          onChange={(e) => onChange({ square_footage: parseFloat(e.target.value) || 0 })}
          className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
          placeholder="Auto-calculated or enter manually"
          required
        />
        {data.building_length && data.building_width && (
          <p className="text-blue-200 text-sm mt-1">
            Auto-calculated: {(data.building_length * data.building_width).toLocaleString()} sq ft
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="roof_slope" className="text-white">Roof Slope</Label>
        <Select
          value={data.roof_slope || ''}
          onValueChange={(value) => onChange({ roof_slope: value })}
        >
          <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
            <SelectValue placeholder="Select roof slope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Flat">Flat (0-1/4:12)</SelectItem>
            <SelectItem value="Low Slope">Low Slope (1/4:12 - 3:12)</SelectItem>
            <SelectItem value="Medium Slope">Medium Slope (3:12 - 6:12)</SelectItem>
            <SelectItem value="Steep Slope">Steep Slope (Over 6:12)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-green-500/20 rounded-lg p-4">
        <p className="text-green-200 text-sm">
          <strong>Pro Tip:</strong><br />
          Enter building length and width to automatically calculate square footage. You can always override the calculation manually if needed.
        </p>
      </div>
    </div>
  );
};

export default BuildingSpecsStep;
