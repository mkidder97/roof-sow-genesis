
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import { FieldInspection, DrainageOption } from '@/types/fieldInspection';

interface EquipmentInventoryStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
}

const EquipmentInventoryStep: React.FC<EquipmentInventoryStepProps> = ({ data, onChange }) => {
  const [drainageOptions, setDrainageOptions] = React.useState<DrainageOption[]>(() => {
    return data.drainage_options || [];
  });

  const handleDrainageOptionsChange = (options: DrainageOption[]) => {
    setDrainageOptions(options);
    onChange({ drainage_options: options });
  };

  const addDrainageOption = () => {
    const newOption: DrainageOption = {
      id: Date.now().toString(),
      type: 'internal_gutter',
      count: 1,
      condition: 'Good'
    };
    handleDrainageOptionsChange([...drainageOptions, newOption]);
  };

  const removeDrainageOption = (id: string) => {
    handleDrainageOptionsChange(drainageOptions.filter(option => option.id !== id));
  };

  const updateDrainageOption = (id: string, updates: Partial<DrainageOption>) => {
    handleDrainageOptionsChange(
      drainageOptions.map(option => 
        option.id === id ? { ...option, ...updates } : option
      )
    );
  };

  const getDrainageTypeLabel = (type: string) => {
    switch (type) {
      case 'internal_gutter': return 'Internal Gutter';
      case 'external_gutter': return 'External Gutter';
      case 'deck_drain': return 'Deck Drain';
      case 'overflow_drain': return 'Overflow Drain';
      case 'overflow_scuppers': return 'Overflow Scuppers';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Drainage Options */}
      <Card className="bg-white/10 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Drainage Options
            <Button
              type="button"
              onClick={addDrainageOption}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 h-auto"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Drainage
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {drainageOptions.length === 0 ? (
            <p className="text-blue-200 italic">No drainage options added yet</p>
          ) : (
            drainageOptions.map((option) => (
              <div key={option.id} className="bg-white/10 rounded p-4 border border-blue-400/30">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <Label className="text-white text-sm">Type</Label>
                    <Select
                      value={option.type}
                      onValueChange={(value) => updateDrainageOption(option.id, { type: value as any })}
                    >
                      <SelectTrigger className="bg-white/20 border-blue-400/30 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal_gutter">Internal Gutter</SelectItem>
                        <SelectItem value="external_gutter">External Gutter</SelectItem>
                        <SelectItem value="deck_drain">Deck Drain</SelectItem>
                        <SelectItem value="overflow_drain">Overflow Drain</SelectItem>
                        <SelectItem value="overflow_scuppers">Overflow Scuppers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-white text-sm">Count</Label>
                    <Input
                      type="number"
                      min="1"
                      value={option.count}
                      onChange={(e) => updateDrainageOption(option.id, { count: parseInt(e.target.value) || 1 })}
                      className="bg-white/20 border-blue-400/30 text-white text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-white text-sm">Condition</Label>
                    <Select
                      value={option.condition || 'Good'}
                      onValueChange={(value) => updateDrainageOption(option.id, { condition: value })}
                    >
                      <SelectTrigger className="bg-white/20 border-blue-400/30 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={() => removeDrainageOption(option.id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-2 h-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Interior Protection and Conditions */}
      <Card className="bg-white/10 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white">Interior Protection & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="interior_protection" className="text-white">Interior Protection Needed</Label>
            <Switch
              id="interior_protection"
              checked={data.interior_protection_needed || false}
              onCheckedChange={(checked) => onChange({ interior_protection_needed: checked })}
            />
          </div>

          {data.interior_protection_needed && (
            <div>
              <Label htmlFor="protection_sqft" className="text-white">Approximate Square Footage</Label>
              <Input
                id="protection_sqft"
                type="number"
                min="0"
                value={data.interior_protection_sqft || ''}
                onChange={(e) => onChange({ interior_protection_sqft: parseInt(e.target.value) || 0 })}
                className="bg-white/20 border-blue-400/30 text-white"
                placeholder="Enter square footage"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="conduit_attached" className="text-white">Conduit Attached to Underside of Deck</Label>
            <Switch
              id="conduit_attached"
              checked={data.conduit_attached || false}
              onCheckedChange={(checked) => onChange({ conduit_attached: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="upgraded_lighting" className="text-white">Upgraded Lighting</Label>
            <Switch
              id="upgraded_lighting"
              checked={data.upgraded_lighting || false}
              onCheckedChange={(checked) => onChange({ upgraded_lighting: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="fall_protection" className="text-white">Interior Fall Protection (if skylights)</Label>
            <Switch
              id="fall_protection"
              checked={data.interior_fall_protection || false}
              onCheckedChange={(checked) => onChange({ interior_fall_protection: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Access Method */}
      <Card className="bg-white/10 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white">Access Method *</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={data.access_method || 'internal_hatch'}
            onValueChange={(value) => onChange({ access_method: value as any })}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select access method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal_hatch">Internal Hatch</SelectItem>
              <SelectItem value="external_ladder">External Ladder</SelectItem>
              <SelectItem value="extension_ladder">Need Extension Ladder</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Basic Equipment Counts */}
      <Card className="bg-white/10 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white">Equipment Counts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="skylights" className="text-white">Skylights</Label>
              <Input
                id="skylights"
                type="number"
                min="0"
                value={data.skylights || 0}
                onChange={(e) => onChange({ skylights: parseInt(e.target.value) || 0 })}
                className="bg-white/20 border-blue-400/30 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="roof_hatches" className="text-white">Roof Hatches</Label>
              <Input
                id="roof_hatches"
                type="number"
                min="0"
                value={data.roof_hatches || 0}
                onChange={(e) => onChange({ roof_hatches: parseInt(e.target.value) || 0 })}
                className="bg-white/20 border-blue-400/30 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-500/20 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>Note:</strong> CAD drawing updates with penetrations will be automated in v2. 
          For now, focus on accurate field measurements and equipment counts.
        </p>
      </div>
    </div>
  );
};

export default EquipmentInventoryStep;
