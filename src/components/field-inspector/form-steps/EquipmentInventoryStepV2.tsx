import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { FieldInspection, SkylightItem, AccessPoint, HVACUnit } from '@/types/fieldInspection';
import { FieldInspectionErrorBoundary } from './components/FieldInspectionErrorBoundary';
import { SkylightsInventory } from './components/SkylightsInventory';
import { AccessPointsInventory } from './components/AccessPointsInventory';
import { HVACInventory } from './components/HVACInventory';

interface EquipmentInventoryStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const DRAINAGE_TYPES = [
  'Interior Drains Only',
  'Scuppers Only', 
  'Gutters Only',
  'Combination System',
  'Overflow System'
];

const CONDITION_OPTIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Failed'];

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

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateData = (field: string, value: any) => {
    onChange({ [field]: value });
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
      className=\"flex items-center justify-between p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors\"
      onClick={() => toggleSection(section)}
    >
      <div className=\"flex items-center space-x-3\">
        <span className=\"text-lg\">{icon}</span>
        <h3 className=\"font-semibold text-gray-700\">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className=\"px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full\">{count} items</span>
        )}
      </div>
      {expandedSections[section] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </div>
  );

  // Initialize arrays with default items if empty
  const skylights = data.equipment_skylights || [{ id: '1', type: '', quantity: 0, size: '', condition: '' }];
  const accessPoints = data.equipment_access_points || [{ id: '1', type: '', quantity: 0, condition: '', location: '' }];
  const hvacUnits = data.equipment_hvac_units || [{ id: '1', type: '', quantity: 0, condition: '' }];

  return (
    <FieldInspectionErrorBoundary>
      <div className=\"space-y-6\">
        <div className=\"mb-6\">
          <h2 className=\"text-2xl font-bold text-gray-800 mb-2\">🔧 Equipment Inventory & Takeoff</h2>
          <p className=\"text-gray-600\">Document all roof equipment, penetrations, and accessories for accurate SOW generation</p>
        </div>

        {/* Equipment Inventory */}
        <Card className=\"border rounded-lg shadow-sm\">
          <SectionHeader 
            title=\"Equipment Inventory\" 
            section=\"equipment\" 
            icon=\"🏗️\" 
            count={(skylights.filter(s => s.type).length + accessPoints.filter(a => a.type).length + hvacUnits.filter(h => h.type).length)}
          />
          {expandedSections.equipment && (
            <CardContent className=\"p-6 space-y-8\">
              <SkylightsInventory
                skylights={skylights}
                onChange={(updatedSkylights) => updateData('equipment_skylights', updatedSkylights)}
                readOnly={readOnly}
              />
              
              <AccessPointsInventory
                accessPoints={accessPoints}
                onChange={(updatedAccessPoints) => updateData('equipment_access_points', updatedAccessPoints)}
                readOnly={readOnly}
              />
              
              <HVACInventory
                hvacUnits={hvacUnits}
                onChange={(updatedHVACUnits) => updateData('equipment_hvac_units', updatedHVACUnits)}
                readOnly={readOnly}
              />
            </CardContent>
          )}
        </Card>

        {/* Drainage System */}
        <Card className=\"border rounded-lg shadow-sm\">
          <SectionHeader title=\"Drainage System\" section=\"drainage\" icon=\"💧\" />
          {expandedSections.drainage && (
            <CardContent className=\"p-4 space-y-4\">
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                <div>
                  <Label className=\"block text-sm font-medium text-gray-700 mb-1\">Primary Drainage Type</Label>
                  <Select
                    value={data.drainage_primary_type || ''}
                    onValueChange={(value) => updateData('drainage_primary_type', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder=\"Select drainage type\" />
                    </SelectTrigger>
                    <SelectContent>
                      {DRAINAGE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className=\"block text-sm font-medium text-gray-700 mb-1\">Drainage Condition</Label>
                  <Select
                    value={data.drainage_condition || ''}
                    onValueChange={(value) => updateData('drainage_condition', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder=\"Overall condition\" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.map(condition => (
                        <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className=\"grid grid-cols-1 md:grid-cols-4 gap-4\">
                <div>
                  <Label className=\"block text-sm font-medium text-gray-700 mb-1\">Interior Drains</Label>
                  <Input
                    type=\"number\"
                    min=\"0\"
                    value={data.drainage_interior_drains || ''}
                    onChange={(e) => updateData('drainage_interior_drains', parseInt(e.target.value) || 0)}
                    placeholder=\"Count\"
                    readOnly={readOnly}
                  />
                </div>
                
                <div>
                  <Label className=\"block text-sm font-medium text-gray-700 mb-1\">Drain Size</Label>
                  <Input
                    value={data.drainage_drain_size || ''}
                    onChange={(e) => updateData('drainage_drain_size', e.target.value)}
                    placeholder=\"e.g., 4 inch\"
                    readOnly={readOnly}
                  />
                </div>
                
                <div>
                  <Label className=\"block text-sm font-medium text-gray-700 mb-1\">Scuppers</Label>
                  <Input
                    type=\"number\"
                    min=\"0\"
                    value={data.drainage_scuppers || ''}
                    onChange={(e) => updateData('drainage_scuppers', parseInt(e.target.value) || 0)}
                    placeholder=\"Count\"
                    readOnly={readOnly}
                  />
                </div>
                
                <div>
                  <Label className=\"block text-sm font-medium text-gray-700 mb-1\">Scupper Size</Label>
                  <Input
                    value={data.drainage_scupper_size || ''}
                    onChange={(e) => updateData('drainage_scupper_size', e.target.value)}
                    placeholder=\"e.g., 6 inch\"
                    readOnly={readOnly}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Roof Penetrations */}
        <Card className=\"border rounded-lg shadow-sm\">
          <SectionHeader title=\"Roof Penetrations\" section=\"penetrations\" icon=\"⚡\" />
          {expandedSections.penetrations && (
            <CardContent className=\"p-4 space-y-4\">
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
                <div className=\"space-y-4\">
                  <div className=\"flex items-center space-x-2\">
                    <Checkbox
                      id=\"gas-lines\"
                      checked={data.penetrations_gas_lines || false}
                      onCheckedChange={(checked) => updateData('penetrations_gas_lines', checked)}
                      disabled={readOnly}
                    />
                    <Label htmlFor=\"gas-lines\" className=\"text-sm font-medium\">Gas Lines Penetrating Deck</Label>
                  </div>
                  
                  {data.penetrations_gas_lines && (
                    <div className=\"ml-6\">
                      <Label className=\"block text-sm font-medium text-gray-700 mb-1\">Number of Gas Lines</Label>
                      <Input
                        type=\"number\"
                        min=\"0\"
                        value={data.penetrations_gas_line_count || ''}
                        onChange={(e) => updateData('penetrations_gas_line_count', parseInt(e.target.value) || 0)}
                        placeholder=\"Count\"
                        readOnly={readOnly}
                      />
                    </div>
                  )}
                </div>
                
                <div className=\"space-y-4\">
                  <div className=\"flex items-center space-x-2\">
                    <Checkbox
                      id=\"conduit-attached\"
                      checked={data.penetrations_conduit_attached || false}
                      onCheckedChange={(checked) => updateData('penetrations_conduit_attached', checked)}
                      disabled={readOnly}
                    />
                    <Label htmlFor=\"conduit-attached\" className=\"text-sm font-medium\">Conduit Attached to Underside of Deck</Label>
                  </div>
                  
                  {data.penetrations_conduit_attached && (
                    <div className=\"ml-6\">
                      <Label className=\"block text-sm font-medium text-gray-700 mb-1\">Conduit Description</Label>
                      <Textarea
                        value={data.penetrations_conduit_description || ''}
                        onChange={(e) => updateData('penetrations_conduit_description', e.target.value)}
                        placeholder=\"Describe conduit location, size, and configuration\"
                        readOnly={readOnly}
                        rows={2}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <Label className=\"block text-sm font-medium text-gray-700 mb-1\">Other Penetrations</Label>
                <Textarea
                  value={data.penetrations_other || ''}
                  onChange={(e) => updateData('penetrations_other', e.target.value)}
                  placeholder=\"Describe any other penetrations (vents, pipes, antennas, etc.)\"
                  readOnly={readOnly}
                  rows={3}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Additional sections with collapsible content */}
        {/* Curbs & Equipment Platforms */}
        <Card className=\"border rounded-lg shadow-sm\">
          <SectionHeader title=\"Curbs & Equipment Platforms\" section=\"curbs\" icon=\"🏗️\" />
          {expandedSections.curbs && (
            <CardContent className=\"p-4 space-y-4\">
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
                <div className=\"flex items-center space-x-2\">
                  <Checkbox
                    id=\"curbs-8-above\"
                    checked={data.curbs_8_inch_or_above || false}
                    onCheckedChange={(checked) => updateData('curbs_8_inch_or_above', checked)}
                    disabled={readOnly}
                  />
                  <Label htmlFor=\"curbs-8-above\" className=\"text-sm font-medium\">Curbs 8\" or Above</Label>
                </div>
                
                <div className=\"flex items-center space-x-2\">
                  <Checkbox
                    id=\"side-discharge\"
                    checked={data.side_discharge_units || false}
                    onCheckedChange={(checked) => updateData('side_discharge_units', checked)}
                    disabled={readOnly}
                  />
                  <Label htmlFor=\"side-discharge\" className=\"text-sm font-medium\">Side Discharge Units</Label>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Summary Alert */}
        <Alert className=\"bg-blue-50 border-blue-200\">
          <AlertTriangle className=\"w-5 h-5 text-blue-600\" />
          <AlertDescription className=\"text-blue-700\">
            <strong>Equipment Inventory Complete:</strong> This comprehensive inventory will be used to generate accurate SOW specifications and ensure all roof equipment and penetrations are properly addressed in the project scope.
          </AlertDescription>
        </Alert>
      </div>
    </FieldInspectionErrorBoundary>
  );
};

export default EquipmentInventoryStep;