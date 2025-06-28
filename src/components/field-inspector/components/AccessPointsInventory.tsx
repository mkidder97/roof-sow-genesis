import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccessPoint } from '@/types/fieldInspection';
import { DynamicArraySection } from './DynamicArraySection';

interface AccessPointsInventoryProps {
  accessPoints: AccessPoint[];
  onChange: (accessPoints: AccessPoint[]) => void;
  readOnly?: boolean;
}

const ACCESS_TYPES = [
  'Roof Hatch - Single',
  'Roof Hatch - Double',
  'Ship Ladder',
  'Permanent Ladder',
  'Stairs',
  'Access Door',
  'Walkway',
  'Cat Ladder'
];

const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Failed'];

export const AccessPointsInventory: React.FC<AccessPointsInventoryProps> = ({
  accessPoints,
  onChange,
  readOnly = false
}) => {
  const handleAdd = () => {
    const newItem: AccessPoint = {
      id: Date.now().toString(),
      type: '',
      quantity: 0,
      condition: '',
      location: ''
    };
    onChange([...accessPoints, newItem]);
  };

  const handleRemove = (id: string) => {
    onChange(accessPoints.filter(item => item.id !== id));
  };

  const handleUpdate = (id: string, field: keyof AccessPoint, value: any) => {
    onChange(accessPoints.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const renderAccessPointItem = (accessPoint: AccessPoint, index: number) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Access Type</Label>
        <Select
          value={accessPoint.type}
          onValueChange={(value) => handleUpdate(accessPoint.id, 'type', value)}
          disabled={readOnly}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {ACCESS_TYPES.map(type => (
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
          value={accessPoint.quantity || ''}
          onChange={(e) => handleUpdate(accessPoint.id, 'quantity', parseInt(e.target.value) || 0)}
          readOnly={readOnly}
        />
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Location</Label>
        <Input
          value={accessPoint.location || ''}
          onChange={(e) => handleUpdate(accessPoint.id, 'location', e.target.value)}
          placeholder="Roof location"
          readOnly={readOnly}
        />
      </div>
      
      <div>
        <Label className="block text-sm font-medium text-gray-700 mb-1">Condition</Label>
        <Select
          value={accessPoint.condition}
          onValueChange={(value) => handleUpdate(accessPoint.id, 'condition', value)}
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
      title="🚪 Access Points & Hatches"
      items={accessPoints}
      onAdd={handleAdd}
      onRemove={handleRemove}
      renderItem={renderAccessPointItem}
      readOnly={readOnly}
      addButtonText="Add Access Point"
      emptyMessage="No access points documented yet"
    />
  );
};