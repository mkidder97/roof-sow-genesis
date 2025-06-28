import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HVACUnit } from '@/types/fieldInspection';
import { DynamicArraySection } from './DynamicArraySection';

interface HVACInventoryProps {
  hvacUnits: HVACUnit[];
  onChange: (hvacUnits: HVACUnit[]) => void;
  readOnly?: boolean;
}

const HVAC_TYPES = [
  'Package Unit - RTU',
  'Split System - Condenser',
  'Exhaust Fan',
  'Supply Fan',
  'Makeup Air Unit',
  'Cooling Tower',
  'Chiller',
  'Heat Pump',
  'Ductwork',
  'Other Equipment'
];

const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Failed'];

export const HVACInventory: React.FC<HVACInventoryProps> = ({
  hvacUnits,
  onChange,
  readOnly = false
}) => {
  const handleAdd = () => {
    const newItem: HVACUnit = {
      id: Date.now().toString(),
      type: '',
      quantity: 0,
      condition: ''
    };
    onChange([...hvacUnits, newItem]);
  };

  const handleRemove = (id: string) => {
    onChange(hvacUnits.filter(item => item.id !== id));
  };

  const handleUpdate = (id: string, field: keyof HVACUnit, value: any) => {
    onChange(hvacUnits.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const renderHVACItem = (hvacUnit: HVACUnit, index: number) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type</Label>
        <Select
          value={hvacUnit.type}
          onValueChange={(value) => handleUpdate(hvacUnit.id, 'type', value)}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {HVAC_TYPES.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Quantity</Label>
        <Input
          type="number"
          min="0"
          value={hvacUnit.quantity || ''}
          onChange={(e) => handleUpdate(hvacUnit.id, 'quantity', parseInt(e.target.value) || 0)}
          readOnly={readOnly}
        />
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Condition</Label>
        <Select
          value={hvacUnit.condition}
          onValueChange={(value) => handleUpdate(hvacUnit.id, 'condition', value)}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_OPTIONS.map(condition => (
              <SelectItem key={condition} value={condition}>{condition}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <DynamicArraySection
      title="❄️ HVAC Equipment"
      items={hvacUnits}
      onAdd={handleAdd}
      onRemove={handleRemove}
      renderItem={renderHVACItem}
      readOnly={readOnly}
      addButtonText="Add HVAC Unit"
      emptyMessage="No HVAC equipment documented yet"
    />
  );
};