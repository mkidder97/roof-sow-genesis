
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Minus, X } from 'lucide-react';
import { FieldInspection, HVACUnit, RoofDrain, Penetration, DrainageOption } from '@/types/fieldInspection';

interface EquipmentInventoryStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
}

const EquipmentInventoryStep: React.FC<EquipmentInventoryStepProps> = ({ data, onChange }) => {
  const [newHVAC, setNewHVAC] = useState({ type: '', count: 1, condition: 'Good' });
  const [newDrain, setNewDrain] = useState({ type: '', count: 1, condition: 'Good' });
  const [newPenetration, setNewPenetration] = useState({ type: '', count: 1 });
  const [newDrainage, setNewDrainage] = useState({ 
    type: 'internal_gutter' as DrainageOption['type'], 
    count: 0, 
    linear_feet: 0, 
    condition: 'Good' 
  });

  const addHVACUnit = () => {
    if (!newHVAC.type) return;
    
    const hvacUnits = [...(data.hvac_units || []), newHVAC as HVACUnit];
    onChange({ hvac_units: hvacUnits });
    setNewHVAC({ type: '', count: 1, condition: 'Good' });
  };

  const removeHVACUnit = (index: number) => {
    const hvacUnits = (data.hvac_units || []).filter((_, i) => i !== index);
    onChange({ hvac_units: hvacUnits });
  };

  const addRoofDrain = () => {
    if (!newDrain.type) return;
    
    const roofDrains = [...(data.roof_drains || []), newDrain as RoofDrain];
    onChange({ roof_drains: roofDrains });
    setNewDrain({ type: '', count: 1, condition: 'Good' });
  };

  const removeRoofDrain = (index: number) => {
    const roofDrains = (data.roof_drains || []).filter((_, i) => i !== index);
    onChange({ roof_drains: roofDrains });
  };

  const addPenetration = () => {
    if (!newPenetration.type) return;
    
    const penetrations = [...(data.penetrations || []), newPenetration as Penetration];
    onChange({ penetrations });
    setNewPenetration({ type: '', count: 1 });
  };

  const removePenetration = (index: number) => {
    const penetrations = (data.penetrations || []).filter((_, i) => i !== index);
    onChange({ penetrations });
  };

  const addDrainageOption = () => {
    if (!newDrainage.type) return;
    
    const drainageOption = {
      id: Date.now().toString(),
      type: newDrainage.type,
      count: newDrainage.type.includes('gutter') ? undefined : newDrainage.count,
      linear_feet: newDrainage.type.includes('gutter') ? newDrainage.linear_feet : undefined,
      condition: newDrainage.condition
    };
    
    const drainageOptions = [...(data.drainage_options || []), drainageOption];
    onChange({ drainage_options: drainageOptions });
    setNewDrainage({ type: 'internal_gutter', count: 0, linear_feet: 0, condition: 'Good' });
  };

  const removeDrainageOption = (index: number) => {
    const drainageOptions = (data.drainage_options || []).filter((_, i) => i !== index);
    onChange({ drainage_options: drainageOptions });
  };

  const isGutterType = (type: string) => type.includes('gutter');

  return (
    <div className="space-y-6">
      {/* HVAC Units */}
      <Card className="bg-white/5 border-blue-400/20">
        <CardHeader>
          <CardTitle className="text-white">HVAC Units</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="hvac-type" className="text-blue-200">Type</Label>
              <Input
                id="hvac-type"
                value={newHVAC.type}
                onChange={(e) => setNewHVAC(prev => ({ ...prev, type: e.target.value }))}
                placeholder="e.g., RTU, AHU"
                className="bg-white/10 border-blue-400/30 text-white"
              />
            </div>
            <div>
              <Label htmlFor="hvac-count" className="text-blue-200">Count</Label>
              <Input
                id="hvac-count"
                type="number"
                min="1"
                value={newHVAC.count}
                onChange={(e) => setNewHVAC(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                className="bg-white/10 border-blue-400/30 text-white"
              />
            </div>
            <div>
              <Label htmlFor="hvac-condition" className="text-blue-200">Condition</Label>
              <Select 
                value={newHVAC.condition} 
                onValueChange={(value) => setNewHVAC(prev => ({ ...prev, condition: value }))}
              >
                <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addHVACUnit} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {data.hvac_units && data.hvac_units.length > 0 && (
            <div className="space-y-2">
              {data.hvac_units.map((unit, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 rounded p-3">
                  <span className="text-white">
                    {unit.type} (Count: {unit.count}) - Condition: {unit.condition}
                  </span>
                  <Button
                    onClick={() => removeHVACUnit(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roof Drains */}
      <Card className="bg-white/5 border-blue-400/20">
        <CardHeader>
          <CardTitle className="text-white">Roof Drains</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="drain-type" className="text-blue-200">Type</Label>
              <Input
                id="drain-type"
                value={newDrain.type}
                onChange={(e) => setNewDrain(prev => ({ ...prev, type: e.target.value }))}
                placeholder="e.g., Interior, Scupper"
                className="bg-white/10 border-blue-400/30 text-white"
              />
            </div>
            <div>
              <Label htmlFor="drain-count" className="text-blue-200">Count</Label>
              <Input
                id="drain-count"
                type="number"
                min="1"
                value={newDrain.count}
                onChange={(e) => setNewDrain(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                className="bg-white/10 border-blue-400/30 text-white"
              />
            </div>
            <div>
              <Label htmlFor="drain-condition" className="text-blue-200">Condition</Label>
              <Select 
                value={newDrain.condition} 
                onValueChange={(value) => setNewDrain(prev => ({ ...prev, condition: value }))}
              >
                <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addRoofDrain} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {data.roof_drains && data.roof_drains.length > 0 && (
            <div className="space-y-2">
              {data.roof_drains.map((drain, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 rounded p-3">
                  <span className="text-white">
                    {drain.type} (Count: {drain.count}) - Condition: {drain.condition}
                  </span>
                  <Button
                    onClick={() => removeRoofDrain(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drainage Options */}
      <Card className="bg-white/5 border-blue-400/20">
        <CardHeader>
          <CardTitle className="text-white">Drainage Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="drainage-type" className="text-blue-200">Type</Label>
              <Select 
                value={newDrainage.type} 
                onValueChange={(value: DrainageOption['type']) => setNewDrainage(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
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
            {isGutterType(newDrainage.type) ? (
              <div>
                <Label htmlFor="drainage-linear-feet" className="text-blue-200">Linear Feet</Label>
                <Input
                  id="drainage-linear-feet"
                  type="number"
                  min="0"
                  value={newDrainage.linear_feet}
                  onChange={(e) => setNewDrainage(prev => ({ ...prev, linear_feet: parseInt(e.target.value) || 0 }))}
                  className="bg-white/10 border-blue-400/30 text-white"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="drainage-count" className="text-blue-200">Count</Label>
                <Input
                  id="drainage-count"
                  type="number"
                  min="1"
                  value={newDrainage.count}
                  onChange={(e) => setNewDrainage(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                  className="bg-white/10 border-blue-400/30 text-white"
                />
              </div>
            )}
            <div>
              <Label htmlFor="drainage-condition" className="text-blue-200">Condition</Label>
              <Select 
                value={newDrainage.condition} 
                onValueChange={(value) => setNewDrainage(prev => ({ ...prev, condition: value }))}
              >
                <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addDrainageOption} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {data.drainage_options && data.drainage_options.length > 0 && (
            <div className="space-y-2">
              {data.drainage_options.map((option, index) => (
                <div key={option.id || index} className="flex items-center justify-between bg-white/5 rounded p-3">
                  <span className="text-white">
                    {option.type.replace('_', ' ')} - 
                    {option.count && ` Count: ${option.count}`}
                    {option.linear_feet && ` Linear Feet: ${option.linear_feet}`}
                    {option.condition && ` - Condition: ${option.condition}`}
                  </span>
                  <Button
                    onClick={() => removeDrainageOption(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Penetrations */}
      <Card className="bg-white/5 border-blue-400/20">
        <CardHeader>
          <CardTitle className="text-white">Penetrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="penetration-type" className="text-blue-200">Type</Label>
              <Input
                id="penetration-type"
                value={newPenetration.type}
                onChange={(e) => setNewPenetration(prev => ({ ...prev, type: e.target.value }))}
                placeholder="e.g., Pipe, Conduit, Vent"
                className="bg-white/10 border-blue-400/30 text-white"
              />
            </div>
            <div>
              <Label htmlFor="penetration-count" className="text-blue-200">Count</Label>
              <Input
                id="penetration-count"
                type="number"
                min="1"
                value={newPenetration.count}
                onChange={(e) => setNewPenetration(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                className="bg-white/10 border-blue-400/30 text-white"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addPenetration} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {data.penetrations && data.penetrations.length > 0 && (
            <div className="space-y-2">
              {data.penetrations.map((penetration, index) => (
                <div key={index} className="flex items-center justify-between bg-white/5 rounded p-3">
                  <span className="text-white">
                    {penetration.type} (Count: {penetration.count})
                  </span>
                  <Button
                    onClick={() => removePenetration(index)}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interior Protection & Conditions */}
      <Card className="bg-white/5 border-blue-400/20">
        <CardHeader>
          <CardTitle className="text-white">Interior Protection & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="interior-protection" className="text-blue-200">Interior Protection Needed</Label>
            <Switch
              id="interior-protection"
              checked={data.interior_protection_needed || false}
              onCheckedChange={(checked) => onChange({ interior_protection_needed: checked })}
            />
          </div>

          {data.interior_protection_needed && (
            <div>
              <Label htmlFor="protection-sqft" className="text-blue-200">Interior Protection Sq Ft</Label>
              <Input
                id="protection-sqft"
                type="number"
                min="0"
                value={data.interior_protection_sqft || 0}
                onChange={(e) => onChange({ interior_protection_sqft: parseInt(e.target.value) || 0 })}
                className="bg-white/10 border-blue-400/30 text-white"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="conduit-attached" className="text-blue-200">Conduit Attached to Underside of Deck</Label>
            <Switch
              id="conduit-attached"
              checked={data.conduit_attached || false}
              onCheckedChange={(checked) => onChange({ conduit_attached: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="upgraded-lighting" className="text-blue-200">Upgraded Lighting</Label>
            <Switch
              id="upgraded-lighting"
              checked={data.upgraded_lighting || false}
              onCheckedChange={(checked) => onChange({ upgraded_lighting: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="interior-fall-protection" className="text-blue-200">Interior Fall Protection (if skylights)</Label>
            <Switch
              id="interior-fall-protection"
              checked={data.interior_fall_protection || false}
              onCheckedChange={(checked) => onChange({ interior_fall_protection: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Access Method */}
      <Card className="bg-white/5 border-blue-400/20">
        <CardHeader>
          <CardTitle className="text-white">Access Method *</CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={data.access_method || 'internal_hatch'} 
            onValueChange={(value: 'internal_hatch' | 'external_ladder' | 'extension_ladder') => onChange({ access_method: value })}
          >
            <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal_hatch">Internal Hatch</SelectItem>
              <SelectItem value="external_ladder">External Ladder</SelectItem>
              <SelectItem value="extension_ladder">Extension Ladder</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Equipment Counts */}
      <Card className="bg-white/5 border-blue-400/20">
        <CardHeader>
          <CardTitle className="text-white">Equipment Counts</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="skylights" className="text-blue-200">Number of Skylights</Label>
            <Input
              id="skylights"
              type="number"
              min="0"
              value={data.skylights || 0}
              onChange={(e) => onChange({ skylights: parseInt(e.target.value) || 0 })}
              className="bg-white/10 border-blue-400/30 text-white"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentInventoryStep;
