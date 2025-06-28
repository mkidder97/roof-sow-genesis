import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SkylightItem } from '@/types/fieldInspection';
import { DynamicArraySection } from './DynamicArraySection';

interface SkylightsInventoryProps {
  skylights: SkylightItem[];
  onChange: (skylights: SkylightItem[]) => void;
  readOnly?: boolean;
}

const SKYLIGHT_TYPES = [
  'Dome - Acrylic',
  'Dome - Polycarbonate', 
  'Flat - Acrylic',
  'Flat - Polycarbonate',
  'Curb-mounted',
  'Curb-less',
  'Tubular',
  'Pyramid',
  'Ridge',
  'Custom'
];

const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Failed'];

export const SkylightsInventory: React.FC<SkylightsInventoryProps> = ({
  skylights,
  onChange,
  readOnly = false
}) => {
  const handleAdd = () => {
    const newItem: SkylightItem = {
      id: Date.now().toString(),
      type: '',
      quantity: 0,
      size: '',
      condition: ''
    };
    onChange([...skylights, newItem]);
  };

  const handleRemove = (id: string) => {
    onChange(skylights.filter(item => item.id !== id));
  };

  const handleUpdate = (id: string, field: keyof SkylightItem, value: any) => {
    onChange(skylights.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const renderSkylightItem = (skylight: SkylightItem, index: number) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Type</Label>
        <Select
          value={skylight.type}
          onValueChange={(value) => handleUpdate(skylight.id, 'type', value)}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {SKYLIGHT_TYPES.map(type => (
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
          value={skylight.quantity || ''}
          onChange={(e) => handleUpdate(skylight.id, 'quantity', parseInt(e.target.value) || 0)}
          placeholder="0"
          readOnly={readOnly}
        />
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Size</Label>
        <Input
          value={skylight.size || ''}
          onChange={(e) => handleUpdate(skylight.id, 'size', e.target.value)}
          placeholder="e.g., 2x4 ft"
          readOnly={readOnly}
        />
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Condition</Label>
        <Select
          value={skylight.condition}
          onValueChange={(value) => handleUpdate(skylight.id, 'condition', value)}
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
      title="☀️ Skylights & Roof Openings"
      items={skylights}
      onAdd={handleAdd}
      onRemove={handleRemove}
      renderItem={renderSkylightItem}
      readOnly={readOnly}
      addButtonText="Add Skylight Type"
      emptyMessage="No skylights documented yet"
    />
  );
};