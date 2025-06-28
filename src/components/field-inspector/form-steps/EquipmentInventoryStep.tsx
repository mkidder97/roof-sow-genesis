import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
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
  const [expandedSections, setExpandedSections] = useState({
    equipment: true,
    drainage: true,
    penetrations: true,
    curbs: false,
    edge: false,
    safety: false
  });

  // Drainage state management
  const [primaryDrainage, setPrimaryDrainage] = useState(data.drainage_primary_type || '');
  const [overflowDrainage, setOverflowDrainage] = useState(data.drainage_overflow_type || '');
  const [showOverflowDropdown, setShowOverflowDropdown] = useState(
    data.drainage_primary_type === 'Deck Drains' || data.drainage_primary_type === 'Scuppers'
  );

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateData = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  // Define overflow options based on primary selection
  const getOverflowOptions = (primaryType: string) => {
    switch (primaryType) {
      case 'Deck Drains':
        return [
          'Overflow Scuppers',
          'Secondary Drains', 
          'Other'
        ];
      case 'Scuppers':
        return [
          'Overflow Scuppers',
          'Secondary Drains',
          'Other'
        ];
      default:
        return [];
    }
  };

  const handlePrimaryDrainageChange = (value: string) => {
    setPrimaryDrainage(value);
    setOverflowDrainage(''); // Reset overflow
    
    // Show overflow dropdown for deck drains and scuppers (gutters can still have other drainage)
    setShowOverflowDropdown(value === 'Deck Drains' || value === 'Scuppers' || value === 'Gutters');
    
    onChange({ 
      drainage_primary_type: value as 'Deck Drains' | 'Scuppers' | 'Gutters',
      drainage_overflow_type: undefined // Reset overflow
    });
  };

  const handleOverflowDrainageChange = (value: string) => {
    setOverflowDrainage(value);
    onChange({ drainage_overflow_type: value });
  };

  const SectionHeader = ({ 
    title, 
    section, 
    icon, 
    count 
  }: { 
    title: string; 
    section: keyof typeof expandedSections; 
    icon: string; 
    count?: number;
  }) => (
    <div 
      className="flex items-center justify-between p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center space-x-3">
        <span className="text-lg">{icon}</span>
        <h3 className="font-semibold text-gray-700">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">{count} items</span>
        )}
      </div>
      {expandedSections[section] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔧 Equipment Inventory & Takeoff</h2>
        <p className="text-gray-600">Document all roof equipment, penetrations, and drainage for accurate SOW generation</p>
      </div>

      {/* Enhanced Drainage System with SOW Integration */}
      <Card className="border rounded-lg shadow-sm">
        <SectionHeader title="Drainage System" section="drainage" icon="💧" />
        {expandedSections.drainage && (
          <CardContent className="p-4 space-y-6">
            {/* Primary Drainage Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Primary Drainage Type *</Label>
                <Select 
                  value={primaryDrainage} 
                  onValueChange={handlePrimaryDrainageChange}
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
              
              {/* Additional Drainage Dropdown */}
              {showOverflowDropdown && (
                <div>
                  <Label>Additional Drainage (if any)</Label>
                  <Select 
                    value={overflowDrainage} 
                    onValueChange={handleOverflowDrainageChange}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select additional drainage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="None">None</SelectItem>
                      {getOverflowOptions(primaryDrainage).map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Deck Drains Details */}
            {primaryDrainage === 'Deck Drains' && (
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
                      placeholder="0"
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Drain Diameter (inches)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={data.drainage_deck_drains_diameter || ''}
                      onChange={(e) => updateData('drainage_deck_drains_diameter', parseFloat(e.target.value) || 0)}
                      placeholder="4"
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Scuppers Details */}
            {primaryDrainage === 'Scuppers' && (
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
                      placeholder="0"
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Length (inches)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={data.drainage_scuppers_length || ''}
                      onChange={(e) => updateData('drainage_scuppers_length', parseFloat(e.target.value) || 0)}
                      placeholder="12"
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Width (inches)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={data.drainage_scuppers_width || ''}
                      onChange={(e) => updateData('drainage_scuppers_width', parseFloat(e.target.value) || 0)}
                      placeholder="4"
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Height Above Roof (inches)</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={data.drainage_scuppers_height || ''}
                      onChange={(e) => updateData('drainage_scuppers_height', parseFloat(e.target.value) || 0)}
                      placeholder="2"
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Gutters Details */}
            {primaryDrainage === 'Gutters' && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Gutters Specifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Linear Feet of Gutters</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.drainage_gutters_linear_feet || ''}
                      onChange={(e) => updateData('drainage_gutters_linear_feet', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Height (inches)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={data.drainage_gutters_height || ''}
                      onChange={(e) => updateData('drainage_gutters_height', parseFloat(e.target.value) || 0)}
                      placeholder="6"
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Width (inches)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={data.drainage_gutters_width || ''}
                      onChange={(e) => updateData('drainage_gutters_width', parseFloat(e.target.value) || 0)}
                      placeholder="8"
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Depth (inches)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={data.drainage_gutters_depth || ''}
                      onChange={(e) => updateData('drainage_gutters_depth', parseFloat(e.target.value) || 0)}
                      placeholder="4"
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional/Overflow Drainage Details */}
            {overflowDrainage && overflowDrainage !== 'None' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Additional Drainage: {overflowDrainage}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Count</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.drainage_additional_count || ''}
                      onChange={(e) => updateData('drainage_additional_count', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Size/Dimensions</Label>
                    <Input
                      value={data.drainage_additional_size || ''}
                      onChange={(e) => updateData('drainage_additional_size', e.target.value)}
                      placeholder="e.g., 4 inch diameter"
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Input
                      value={data.drainage_additional_notes || ''}
                      onChange={(e) => updateData('drainage_additional_notes', e.target.value)}
                      placeholder="Special requirements"
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Basic Equipment Inventory */}
      <Card className="border rounded-lg shadow-sm">
        <SectionHeader title="Roof Equipment" section="equipment" icon="🏗️" />
        {expandedSections.equipment && (
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Number of Skylights</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.skylights || ''}
                  onChange={(e) => updateData('skylights', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  readOnly={readOnly}
                />
              </div>
              
              <div>
                <Label>Number of Roof Hatches</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.roof_hatches || ''}
                  onChange={(e) => updateData('roof_hatches', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  readOnly={readOnly}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Roof Penetrations */}
      <Card className="border rounded-lg shadow-sm">
        <SectionHeader title="Roof Penetrations" section="penetrations" icon="⚡" />
        {expandedSections.penetrations && (
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gas-lines"
                    checked={data.penetrations_gas_lines || false}
                    onCheckedChange={(checked) => updateData('penetrations_gas_lines', checked)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="gas-lines" className="text-sm font-medium">Gas Lines Penetrating Deck</Label>
                </div>
                
                {data.penetrations_gas_lines && (
                  <div className="ml-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Number of Gas Lines</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.penetrations_gas_line_count || ''}
                      onChange={(e) => updateData('penetrations_gas_line_count', parseInt(e.target.value) || 0)}
                      placeholder="Count"
                      readOnly={readOnly}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="conduit-attached"
                    checked={data.penetrations_conduit_attached || false}
                    onCheckedChange={(checked) => updateData('penetrations_conduit_attached', checked)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="conduit-attached" className="text-sm font-medium">Conduit Attached to Underside of Deck</Label>
                </div>
                
                {data.penetrations_conduit_attached && (
                  <div className="ml-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Conduit Description</Label>
                    <Textarea
                      value={data.penetrations_conduit_description || ''}
                      onChange={(e) => updateData('penetrations_conduit_description', e.target.value)}
                      placeholder="Describe conduit location, size, and configuration"
                      readOnly={readOnly}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Other Penetrations</Label>
              <Textarea
                value={data.penetrations_other || ''}
                onChange={(e) => updateData('penetrations_other', e.target.value)}
                placeholder="Describe any other penetrations (vents, pipes, antennas, etc.)"
                readOnly={readOnly}
                rows={3}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Curbs & Equipment Platforms */}
      <Card className="border rounded-lg shadow-sm">
        <SectionHeader title="Curbs & Equipment Platforms" section="curbs" icon="🏗️" />
        {expandedSections.curbs && (
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="curbs-8-above"
                  checked={data.curbs_8_inch_or_above || false}
                  onCheckedChange={(checked) => updateData('curbs_8_inch_or_above', checked)}
                  disabled={readOnly}
                />
                <Label htmlFor="curbs-8-above" className="text-sm font-medium">Curbs 8" or Above</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="side-discharge"
                  checked={data.side_discharge_units || false}
                  onCheckedChange={(checked) => updateData('side_discharge_units', checked)}
                  disabled={readOnly}
                />
                <Label htmlFor="side-discharge" className="text-sm font-medium">Side Discharge Units</Label>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* SOW Integration Notice */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTriangle className="w-5 h-5 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>SOW Integration:</strong> All drainage specifications and equipment inventory will be used to automatically select the appropriate SOW template and generate detailed specifications for roof replacement.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default EquipmentInventoryStep;