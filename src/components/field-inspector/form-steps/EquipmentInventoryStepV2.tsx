
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Wrench, Plus, Trash2 } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface EquipmentInventoryStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const EquipmentInventoryStepV2: React.FC<EquipmentInventoryStepProps> = ({
  data,
  onChange,
  readOnly = false
}) => {
  const updateData = (field: keyof FieldInspection, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Equipment Inventory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Equipment Counts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="skylights">Number of Skylights</Label>
              <Input
                id="skylights"
                type="number"
                min="0"
                value={data.skylights || 0}
                onChange={(e) => updateData('skylights', parseInt(e.target.value) || 0)}
                readOnly={readOnly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="roof-hatches">Number of Roof Hatches</Label>
              <Input
                id="roof-hatches"
                type="number"
                min="0"
                value={data.roof_hatches || 0}
                onChange={(e) => updateData('roof_hatches', parseInt(e.target.value) || 0)}
                readOnly={readOnly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hvac-units-count">HVAC Units Count</Label>
              <Input
                id="hvac-units-count"
                type="number"
                min="0"
                value={data.hvac_units?.length || 0}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Drainage System */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Drainage System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Drainage Type</Label>
                  <Select
                    value={data.drainage_primary_type || ''}
                    onValueChange={(value) => updateData('drainage_primary_type', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select primary drainage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Deck Drains">Deck Drains</SelectItem>
                      <SelectItem value="Scuppers">Scuppers</SelectItem>
                      <SelectItem value="Gutters">Gutters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(data.drainage_primary_type === 'Deck Drains' || data.drainage_primary_type === 'Scuppers') && (
                  <div className="space-y-2">
                    <Label>Overflow/Additional Drainage</Label>
                    <Select
                      value={data.drainage_overflow_type || ''}
                      onValueChange={(value) => updateData('drainage_overflow_type', value)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select overflow type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Overflow Scuppers">Overflow Scuppers</SelectItem>
                        <SelectItem value="Secondary Drains">Secondary Drains</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Deck Drains Specifications */}
              {data.drainage_primary_type === 'Deck Drains' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Deck Drains Specifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Number of Deck Drains</Label>
                      <Input
                        type="number"
                        min="0"
                        value={data.drainage_deck_drains_count || ''}
                        onChange={(e) => updateData('drainage_deck_drains_count', parseInt(e.target.value) || 0)}
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <Label>Drain Diameter (inches)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={data.drainage_deck_drains_diameter || ''}
                        onChange={(e) => updateData('drainage_deck_drains_diameter', parseFloat(e.target.value) || 0)}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Scuppers Specifications */}
              {data.drainage_primary_type === 'Scuppers' && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Scuppers Specifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Number of Scuppers</Label>
                      <Input
                        type="number"
                        min="0"
                        value={data.drainage_scuppers_count || ''}
                        onChange={(e) => updateData('drainage_scuppers_count', parseInt(e.target.value) || 0)}
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <Label>Length (inches)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        value={data.drainage_scuppers_length || ''}
                        onChange={(e) => updateData('drainage_scuppers_length', parseFloat(e.target.value) || 0)}
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <Label>Width (inches)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        value={data.drainage_scuppers_width || ''}
                        onChange={(e) => updateData('drainage_scuppers_width', parseFloat(e.target.value) || 0)}
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <Label>Height Above Roof (inches)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        value={data.drainage_scuppers_height || ''}
                        onChange={(e) => updateData('drainage_scuppers_height', parseFloat(e.target.value) || 0)}
                        placeholder="2"
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Gutters Specifications */}
              {data.drainage_primary_type === 'Gutters' && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Gutters Specifications</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Linear Feet of Gutters</Label>
                      <Input
                        type="number"
                        min="0"
                        value={data.drainage_gutters_linear_feet || ''}
                        onChange={(e) => updateData('drainage_gutters_linear_feet', parseFloat(e.target.value) || 0)}
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <Label>Height (inches)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        value={data.drainage_gutters_height || ''}
                        onChange={(e) => updateData('drainage_gutters_height', parseFloat(e.target.value) || 0)}
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <Label>Width (inches)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        value={data.drainage_gutters_width || ''}
                        onChange={(e) => updateData('drainage_gutters_width', parseFloat(e.target.value) || 0)}
                        readOnly={readOnly}
                      />
                    </div>
                    <div>
                      <Label>Depth (inches)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        value={data.drainage_gutters_depth || ''}
                        onChange={(e) => updateData('drainage_gutters_depth', parseFloat(e.target.value) || 0)}
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-yellow-100 rounded border-l-4 border-yellow-400">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Note:</strong> For large roofs with deep corners, additional drains or scuppers may be needed in specific areas.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentInventoryStepV2;
