
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { FieldInspection, HVACUnit, RoofDrain, Penetration } from '@/types/fieldInspection';

interface EquipmentInventoryStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
}

const EquipmentInventoryStep: React.FC<EquipmentInventoryStepProps> = ({ data, onChange }) => {
  const addHVACUnit = () => {
    const newUnit: HVACUnit = { type: 'RTU', count: 1, condition: 'Good' };
    onChange({ hvac_units: [...(data.hvac_units || []), newUnit] });
  };

  const updateHVACUnit = (index: number, updates: Partial<HVACUnit>) => {
    const units = [...(data.hvac_units || [])];
    units[index] = { ...units[index], ...updates };
    onChange({ hvac_units: units });
  };

  const removeHVACUnit = (index: number) => {
    const units = data.hvac_units?.filter((_, i) => i !== index) || [];
    onChange({ hvac_units: units });
  };

  const addRoofDrain = () => {
    const newDrain: RoofDrain = { type: 'Interior', count: 1, condition: 'Good' };
    onChange({ roof_drains: [...(data.roof_drains || []), newDrain] });
  };

  const updateRoofDrain = (index: number, updates: Partial<RoofDrain>) => {
    const drains = [...(data.roof_drains || [])];
    drains[index] = { ...drains[index], ...updates };
    onChange({ roof_drains: drains });
  };

  const removeRoofDrain = (index: number) => {
    const drains = data.roof_drains?.filter((_, i) => i !== index) || [];
    onChange({ roof_drains: drains });
  };

  const addPenetration = () => {
    const newPenetration: Penetration = { type: 'Plumbing Vent', count: 1 };
    onChange({ penetrations: [...(data.penetrations || []), newPenetration] });
  };

  const updatePenetration = (index: number, updates: Partial<Penetration>) => {
    const penetrations = [...(data.penetrations || [])];
    penetrations[index] = { ...penetrations[index], ...updates };
    onChange({ penetrations: penetrations });
  };

  const removePenetration = (index: number) => {
    const penetrations = data.penetrations?.filter((_, i) => i !== index) || [];
    onChange({ penetrations: penetrations });
  };

  return (
    <div className="space-y-6">
      {/* HVAC Units */}
      <Card className="bg-white/5 border-blue-400/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">HVAC Units</CardTitle>
            <Button onClick={addHVACUnit} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Add Unit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.hvac_units?.map((unit, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-white text-sm">Type</Label>
                <Select
                  value={unit.type}
                  onValueChange={(value) => updateHVACUnit(index, { type: value })}
                >
                  <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RTU">Rooftop Unit (RTU)</SelectItem>
                    <SelectItem value="Air Handler">Air Handler</SelectItem>
                    <SelectItem value="Exhaust Fan">Exhaust Fan</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Label className="text-white text-sm">Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={unit.count}
                  onChange={(e) => updateHVACUnit(index, { count: parseInt(e.target.value) || 1 })}
                  className="bg-white/20 border-blue-400/30 text-white"
                />
              </div>
              <div className="flex-1">
                <Label className="text-white text-sm">Condition</Label>
                <Select
                  value={unit.condition}
                  onValueChange={(value) => updateHVACUnit(index, { condition: value })}
                >
                  <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
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
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeHVACUnit(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {!data.hvac_units?.length && (
            <p className="text-blue-200 text-sm italic">No HVAC units added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Roof Drains */}
      <Card className="bg-white/5 border-blue-400/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Roof Drains</CardTitle>
            <Button onClick={addRoofDrain} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Add Drain
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.roof_drains?.map((drain, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-white text-sm">Type</Label>
                <Select
                  value={drain.type}
                  onValueChange={(value) => updateRoofDrain(index, { type: value })}
                >
                  <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Interior">Interior Drain</SelectItem>
                    <SelectItem value="Scupper">Scupper</SelectItem>
                    <SelectItem value="Area">Area Drain</SelectItem>
                    <SelectItem value="Overflow">Overflow Drain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Label className="text-white text-sm">Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={drain.count}
                  onChange={(e) => updateRoofDrain(index, { count: parseInt(e.target.value) || 1 })}
                  className="bg-white/20 border-blue-400/30 text-white"
                />
              </div>
              <div className="flex-1">
                <Label className="text-white text-sm">Condition</Label>
                <Select
                  value={drain.condition}
                  onValueChange={(value) => updateRoofDrain(index, { condition: value })}
                >
                  <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
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
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeRoofDrain(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {!data.roof_drains?.length && (
            <p className="text-blue-200 text-sm italic">No roof drains added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Penetrations */}
      <Card className="bg-white/5 border-blue-400/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Penetrations</CardTitle>
            <Button onClick={addPenetration} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              Add Penetration
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.penetrations?.map((penetration, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-white text-sm">Type</Label>
                <Select
                  value={penetration.type}
                  onValueChange={(value) => updatePenetration(index, { type: value })}
                >
                  <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plumbing Vent">Plumbing Vent</SelectItem>
                    <SelectItem value="Electrical">Electrical Conduit</SelectItem>
                    <SelectItem value="HVAC">HVAC Penetration</SelectItem>
                    <SelectItem value="Gas Line">Gas Line</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-20">
                <Label className="text-white text-sm">Count</Label>
                <Input
                  type="number"
                  min="1"
                  value={penetration.count}
                  onChange={(e) => updatePenetration(index, { count: parseInt(e.target.value) || 1 })}
                  className="bg-white/20 border-blue-400/30 text-white"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removePenetration(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {!data.penetrations?.length && (
            <p className="text-blue-200 text-sm italic">No penetrations added yet</p>
          )}
        </CardContent>
      </Card>

      {/* Simple Counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="skylights" className="text-white">Skylights</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ skylights: Math.max(0, (data.skylights || 0) - 1) })}
              className="border-blue-400 text-blue-200 hover:bg-blue-800"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              min="0"
              value={data.skylights || 0}
              onChange={(e) => onChange({ skylights: parseInt(e.target.value) || 0 })}
              className="bg-white/20 border-blue-400/30 text-white text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ skylights: (data.skylights || 0) + 1 })}
              className="border-blue-400 text-blue-200 hover:bg-blue-800"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div>
          <Label htmlFor="roof_hatches" className="text-white">Roof Hatches</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ roof_hatches: Math.max(0, (data.roof_hatches || 0) - 1) })}
              className="border-blue-400 text-blue-200 hover:bg-blue-800"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <Input
              type="number"
              min="0"
              value={data.roof_hatches || 0}
              onChange={(e) => onChange({ roof_hatches: parseInt(e.target.value) || 0 })}
              className="bg-white/20 border-blue-400/30 text-white text-center"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange({ roof_hatches: (data.roof_hatches || 0) + 1 })}
              className="border-blue-400 text-blue-200 hover:bg-blue-800"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentInventoryStep;
