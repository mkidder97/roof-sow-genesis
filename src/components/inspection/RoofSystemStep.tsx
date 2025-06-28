
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface RoofSystemStepProps {
  data: Partial<FieldInspection>;
  onUpdate: (updates: Partial<FieldInspection>) => void;
}

export const RoofSystemStep: React.FC<RoofSystemStepProps> = ({
  data,
  onUpdate
}) => {
  const handleInputChange = (field: keyof FieldInspection, value: string | number) => {
    onUpdate({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="w-5 h-5" />
          Roof System Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="deck-type">Deck Type *</Label>
            <Select
              value={data.deck_type || ''}
              onValueChange={(value) => handleInputChange('deck_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select deck type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="steel">Steel</SelectItem>
                <SelectItem value="concrete">Concrete</SelectItem>
                <SelectItem value="wood">Wood</SelectItem>
                <SelectItem value="precast">Precast</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="existing-membrane-type">Existing Membrane Type *</Label>
            <Select
              value={data.existing_membrane_type || ''}
              onValueChange={(value) => handleInputChange('existing_membrane_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select membrane type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tpo">TPO</SelectItem>
                <SelectItem value="pvc">PVC</SelectItem>
                <SelectItem value="epdm">EPDM</SelectItem>
                <SelectItem value="modified_bitumen">Modified Bitumen</SelectItem>
                <SelectItem value="built_up">Built-Up</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="insulation-type">Insulation Type</Label>
            <Select
              value={data.insulation_type || ''}
              onValueChange={(value) => handleInputChange('insulation_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select insulation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="polyiso">Polyisocyanurate</SelectItem>
                <SelectItem value="eps">EPS</SelectItem>
                <SelectItem value="xps">XPS</SelectItem>
                <SelectItem value="mineral_wool">Mineral Wool</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="roof-age">Roof Age (years)</Label>
            <Input
              id="roof-age"
              type="number"
              value={data.roof_age_years || ''}
              onChange={(e) => handleInputChange('roof_age_years', parseInt(e.target.value) || 0)}
              placeholder="Enter roof age"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
