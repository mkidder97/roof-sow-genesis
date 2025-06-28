
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface BuildingSpecsStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const BuildingSpecsStep: React.FC<BuildingSpecsStepProps> = ({
  data,
  onChange,
  readOnly = false
}) => {
  const handleInputChange = (field: keyof FieldInspection, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Building Specifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="building-height">Building Height (ft) *</Label>
            <Input
              id="building-height"
              type="number"
              value={data.building_height || ''}
              onChange={(e) => handleInputChange('building_height', parseFloat(e.target.value) || 0)}
              placeholder="Enter building height"
              readOnly={readOnly}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="square-footage">Square Footage *</Label>
            <Input
              id="square-footage"
              type="number"
              value={data.square_footage || ''}
              onChange={(e) => handleInputChange('square_footage', parseFloat(e.target.value) || 0)}
              placeholder="Enter square footage"
              readOnly={readOnly}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="building-length">Building Length (ft)</Label>
            <Input
              id="building-length"
              type="number"
              value={data.building_length || ''}
              onChange={(e) => handleInputChange('building_length', parseFloat(e.target.value) || 0)}
              placeholder="Enter length"
              readOnly={readOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="building-width">Building Width (ft)</Label>
            <Input
              id="building-width"
              type="number"
              value={data.building_width || ''}
              onChange={(e) => handleInputChange('building_width', parseFloat(e.target.value) || 0)}
              placeholder="Enter width"
              readOnly={readOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="number-of-stories">Number of Stories</Label>
            <Input
              id="number-of-stories"
              type="number"
              value={data.number_of_stories || ''}
              onChange={(e) => handleInputChange('number_of_stories', parseInt(e.target.value) || 1)}
              placeholder="Enter stories"
              readOnly={readOnly}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BuildingSpecsStep;
