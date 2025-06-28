
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wrench } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface EquipmentInventoryStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const EquipmentInventoryStep: React.FC<EquipmentInventoryStepProps> = ({
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
          <Wrench className="w-5 h-5" />
          Equipment Inventory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="skylights">Skylights</Label>
            <Input
              id="skylights"
              type="number"
              value={data.skylights || ''}
              onChange={(e) => handleInputChange('skylights', parseInt(e.target.value) || 0)}
              placeholder="Number of skylights"
              readOnly={readOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="roof-hatches">Roof Hatches</Label>
            <Input
              id="roof-hatches"
              type="number"
              value={data.roof_hatches || ''}
              onChange={(e) => handleInputChange('roof_hatches', parseInt(e.target.value) || 0)}
              placeholder="Number of hatches"
              readOnly={readOnly}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hvac-units">HVAC Units</Label>
            <Input
              id="hvac-units"
              type="number"
              value={data.hvac_units?.length || ''}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 0;
                const units = Array(count).fill({}).map((_, i) => ({ id: i + 1, type: 'hvac' }));
                handleInputChange('hvac_units', units);
              }}
              placeholder="Number of HVAC units"
              readOnly={readOnly}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentInventoryStep;
