
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Wrench, Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface EquipmentInventoryStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

interface SkylightItem {
  id: string;
  type: string;
  quantity: number;
  size: string;
  condition: string;
  notes?: string;
}

interface AccessPoint {
  id: string;
  type: string;
  quantity: number;
  condition: string;
  location: string;
  notes?: string;
}

interface HVACUnit {
  id: string;
  type: string;
  quantity: number;
  condition: string;
  notes?: string;
}

const EquipmentInventoryStep: React.FC<EquipmentInventoryStepProps> = ({
  data,
  onChange,
  readOnly = false
}) => {
  const [expandedSections, setExpandedSections] = useState({
    skylights: true,
    access: true,
    hvac: true,
    drainage: true,
    penetrations: true,
    curbs: true,
    edge: false,
    safety: false
  });

  // Initialize equipment arrays
  const [skylights, setSkylights] = useState<SkylightItem[]>(() => 
    data.equipment_skylights || [{ id: '1', type: '', quantity: 0, size: '', condition: '' }]
  );

  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>(() => 
    data.equipment_access_points || [{ id: '1', type: '', quantity: 0, condition: '', location: '' }]
  );

  const [hvacUnits, setHVACUnits] = useState<HVACUnit[]>(() => 
    data.equipment_hvac_units || [{ id: '1', type: '', quantity: 0, condition: '' }]
  );

  // Dropdown options
  const skylightTypes = [
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

  const accessTypes = [
    'Roof Hatch - Single',
    'Roof Hatch - Double',
    'Ship Ladder',
    'Permanent Ladder',
    'Stairs',
    'Access Door',
    'Walkway',
    'Cat Ladder'
  ];

  const hvacTypes = [
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

  const drainageTypes = [
    'Interior Drains Only',
    'Scuppers Only', 
    'Gutters Only',
    'Combination System',
    'Overflow System'
  ];

  const conditionOptions = ['Excellent', 'Good', 'Fair', 'Poor', 'Failed'];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateData = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  // Skylight management
  const addSkylightItem = () => {
    const newItem: SkylightItem = {
      id: Date.now().toString(),
      type: '',
      quantity: 0,
      size: '',
      condition: ''
    };
    const newSkylights = [...skylights, newItem];
    setSkylights(newSkylights);
    updateData('equipment_skylights', newSkylights);
  };

  const removeSkylightItem = (id: string) => {
    if (skylights.length > 1) {
      const newSkylights = skylights.filter(item => item.id !== id);
      setSkylights(newSkylights);
      updateData('equipment_skylights', newSkylights);
    }
  };

  const updateSkylightItem = (id: string, field: keyof SkylightItem, value: any) => {
    const newSkylights = skylights.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setSkylights(newSkylights);
    updateData('equipment_skylights', newSkylights);
  };

  // Access point management
  const addAccessPoint = () => {
    const newItem: AccessPoint = {
      id: Date.now().toString(),
      type: '',
      quantity: 0,
      condition: '',
      location: ''
    };
    const newAccessPoints = [...accessPoints, newItem];
    setAccessPoints(newAccessPoints);
    updateData('equipment_access_points', newAccessPoints);
  };

  const removeAccessPoint = (id: string) => {
    if (accessPoints.length > 1) {
      const newAccessPoints = accessPoints.filter(item => item.id !== id);
      setAccessPoints(newAccessPoints);
      updateData('equipment_access_points', newAccessPoints);
    }
  };

  const updateAccessPoint = (id: string, field: keyof AccessPoint, value: any) => {
    const newAccessPoints = accessPoints.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setAccessPoints(newAccessPoints);
    updateData('equipment_access_points', newAccessPoints);
  };

  // HVAC unit management
  const addHVACUnit = () => {
    const newItem: HVACUnit = {
      id: Date.now().toString(),
      type: '',
      quantity: 0,
      condition: ''
    };
    const newHVACUnits = [...hvacUnits, newItem];
    setHVACUnits(newHVACUnits);
    updateData('equipment_hvac_units', newHVACUnits);
  };

  const removeHVACUnit = (id: string) => {
    if (hvacUnits.length > 1) {
      const newHVACUnits = hvacUnits.filter(item => item.id !== id);
      setHVACUnits(newHVACUnits);
      updateData('equipment_hvac_units', newHVACUnits);
    }
  };

  const updateHVACUnit = (id: string, field: keyof HVACUnit, value: any) => {
    const newHVACUnits = hvacUnits.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setHVACUnits(newHVACUnits);
    updateData('equipment_hvac_units', newHVACUnits);
  };

  const SectionHeader = ({ title, section, icon, count }: { 
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
          <Badge variant="secondary" className="ml-2">{count} items</Badge>
        )}
      </div>
      {expandedSections[section] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🔧 Equipment Inventory & Takeoff</h2>
        <p className="text-gray-600">Document all roof equipment, penetrations, and accessories for accurate SOW generation</p>
      </div>

      {/* Skylights & Roof Openings */}
      <Card className="border rounded-lg shadow-sm">
        <SectionHeader title="Skylights & Roof Openings" section="skylights" icon="☀️" count={skylights.filter(s => s.type).length} />
        {expandedSections.skylights && (
          <CardContent className="p-4">
            {skylights.map((skylight, index) => (
              <div key={skylight.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border rounded bg-gray-50">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Type</Label>
                  <Select
                    value={skylight.type}
                    onValueChange={(value) => updateSkylightItem(skylight.id, 'type', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {skylightTypes.map(type => (
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
                    onChange={(e) => updateSkylightItem(skylight.id, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    readOnly={readOnly}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Size</Label>
                  <Input
                    value={skylight.size || ''}
                    onChange={(e) => updateSkylightItem(skylight.id, 'size', e.target.value)}
                    placeholder="e.g., 2x4 ft"
                    readOnly={readOnly}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Condition</Label>
                  <Select
                    value={skylight.condition}
                    onValueChange={(value) => updateSkylightItem(skylight.id, 'condition', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map(condition => (
                        <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  {!readOnly && skylights.length > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeSkylightItem(skylight.id)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {!readOnly && (
              <Button onClick={addSkylightItem} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Skylight Type
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Access Points & Hatches */}
      <Card className="border rounded-lg shadow-sm">
        <SectionHeader title="Access Points & Hatches" section="access" icon="🚪" count={accessPoints.filter(a => a.type).length} />
        {expandedSections.access && (
          <CardContent className="p-4">
            {accessPoints.map((access) => (
              <div key={access.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 border rounded bg-gray-50">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Access Type</Label>
                  <Select
                    value={access.type}
                    onValueChange={(value) => updateAccessPoint(access.id, 'type', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {accessTypes.map(type => (
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
                    value={access.quantity || ''}
                    onChange={(e) => updateAccessPoint(access.id, 'quantity', parseInt(e.target.value) || 0)}
                    readOnly={readOnly}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Location</Label>
                  <Input
                    value={access.location || ''}
                    onChange={(e) => updateAccessPoint(access.id, 'location', e.target.value)}
                    placeholder="Roof location"
                    readOnly={readOnly}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Condition</Label>
                  <Select
                    value={access.condition}
                    onValueChange={(value) => updateAccessPoint(access.id, 'condition', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map(condition => (
                        <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  {!readOnly && accessPoints.length > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeAccessPoint(access.id)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {!readOnly && (
              <Button onClick={addAccessPoint} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Access Point
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* HVAC Equipment */}
      <Card className="border rounded-lg shadow-sm">
        <SectionHeader title="HVAC Equipment" section="hvac" icon="❄️" count={hvacUnits.filter(h => h.type).length} />
        {expandedSections.hvac && (
          <CardContent className="p-4">
            {hvacUnits.map((hvac) => (
              <div key={hvac.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border rounded bg-gray-50">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type</Label>
                  <Select
                    value={hvac.type}
                    onValueChange={(value) => updateHVACUnit(hvac.id, 'type', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {hvacTypes.map(type => (
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
                    value={hvac.quantity || ''}
                    onChange={(e) => updateHVACUnit(hvac.id, 'quantity', parseInt(e.target.value) || 0)}
                    readOnly={readOnly}
                  />
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Condition</Label>
                  <Select
                    value={hvac.condition}
                    onValueChange={(value) => updateHVACUnit(hvac.id, 'condition', value)}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditionOptions.map(condition => (
                        <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  {!readOnly && hvacUnits.length > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeHVACUnit(hvac.id)}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            {!readOnly && (
              <Button onClick={addHVACUnit} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add HVAC Unit
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      {/* Drainage System */}
      <Card className="border rounded-lg shadow-sm">
        <SectionHeader title="Drainage System" section="drainage" icon="💧" />
        {expandedSections.drainage && (
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Primary Drainage Type</Label>
                <Select
                  value={data.drainage_primary_type || ''}
                  onValueChange={(value) => updateData('drainage_primary_type', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select drainage type" />
                  </SelectTrigger>
                  <SelectContent>
                    {drainageTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Drainage Condition</Label>
                <Select
                  value={data.drainage_condition || ''}
                  onValueChange={(value) => updateData('drainage_condition', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Overall condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map(condition => (
                      <SelectItem key={condition} value={condition}>{condition}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Interior Drains</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.drainage_interior_drains || ''}
                  onChange={(e) => updateData('drainage_interior_drains', parseInt(e.target.value) || 0)}
                  placeholder="Count"
                  readOnly={readOnly}
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Drain Size</Label>
                <Input
                  value={data.drainage_drain_size || ''}
                  onChange={(e) => updateData('drainage_drain_size', e.target.value)}
                  placeholder="e.g., 4 inch"
                  readOnly={readOnly}
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Scuppers</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.drainage_scuppers || ''}
                  onChange={(e) => updateData('drainage_scuppers', parseInt(e.target.value) || 0)}
                  placeholder="Count"
                  readOnly={readOnly}
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Scupper Size</Label>
                <Input
                  value={data.drainage_scupper_size || ''}
                  onChange={(e) => updateData('drainage_scupper_size', e.target.value)}
                  placeholder="e.g., 6 inch"
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
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="curbs-8-above"
                    checked={data.curbs_8_inch_or_above || false}
                    onCheckedChange={(checked) => updateData('curbs_8_inch_or_above', checked)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="curbs-8-above" className="text-sm font-medium">Curbs 8" or Above</Label>
                </div>
                
                {data.curbs_8_inch_or_above && (
                  <div className="ml-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Number of Curbs</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.curbs_count || ''}
                      onChange={(e) => updateData('curbs_count', parseInt(e.target.value) || 0)}
                      placeholder="Count"
                      readOnly={readOnly}
                    />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="side-discharge"
                    checked={data.side_discharge_units || false}
                    onCheckedChange={(checked) => updateData('side_discharge_units', checked)}
                    disabled={readOnly}
                  />
                  <Label htmlFor="side-discharge" className="text-sm font-medium">Side Discharge Units</Label>
                </div>
                
                {data.side_discharge_units && (
                  <div className="ml-6">
                    <Label className="block text-sm font-medium text-gray-700 mb-1">Number of Units</Label>
                    <Input
                      type="number"
                      min="0"
                      value={data.side_discharge_count || ''}
                      onChange={(e) => updateData('side_discharge_count', parseInt(e.target.value) || 0)}
                      placeholder="Count"
                      readOnly={readOnly}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Equipment Platforms</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.equipment_platforms || ''}
                  onChange={(e) => updateData('equipment_platforms', parseInt(e.target.value) || 0)}
                  placeholder="Number of platforms"
                  readOnly={readOnly}
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Walkway Pads</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.walkway_pads || ''}
                  onChange={(e) => updateData('walkway_pads', parseInt(e.target.value) || 0)}
                  placeholder="Number of pads"
                  readOnly={readOnly}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Edge Details & Accessories */}
      <Card className="border rounded-lg shadow-sm">
        <SectionHeader title="Edge Details & Accessories" section="edge" icon="📐" />
        {expandedSections.edge && (
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Edge Detail Type</Label>
                <Select
                  value={data.edge_detail_type || ''}
                  onValueChange={(value) => updateData('edge_detail_type', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select edge type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Metal Edge">Metal Edge</SelectItem>
                    <SelectItem value="Gravel Stop">Gravel Stop</SelectItem>
                    <SelectItem value="Fascia">Fascia</SelectItem>
                    <SelectItem value="Parapet Wall">Parapet Wall</SelectItem>
                    <SelectItem value="Coping">Coping</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Expansion Joints</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.expansion_joints || ''}
                  onChange={(e) => updateData('expansion_joints', parseInt(e.target.value) || 0)}
                  placeholder="Number of joints"
                  readOnly={readOnly}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Safety Equipment */}
      <Card className="border rounded-lg shadow-sm">
        <SectionHeader title="Safety Equipment" section="safety" icon="🛡️" />
        {expandedSections.safety && (
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Tie-Off Points</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.safety_tie_off_points || ''}
                  onChange={(e) => updateData('safety_tie_off_points', parseInt(e.target.value) || 0)}
                  placeholder="Count"
                  readOnly={readOnly}
                />
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Fall Protection Type</Label>
                <Select
                  value={data.safety_fall_protection_type || ''}
                  onValueChange={(value) => updateData('safety_fall_protection_type', value)}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Guardrails">Guardrails</SelectItem>
                    <SelectItem value="Safety Lines">Safety Lines</SelectItem>
                    <SelectItem value="Warning Lines">Warning Lines</SelectItem>
                    <SelectItem value="Combination">Combination</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">Warning Lines (ft)</Label>
                <Input
                  type="number"
                  min="0"
                  value={data.safety_warning_lines || ''}
                  onChange={(e) => updateData('safety_warning_lines', parseInt(e.target.value) || 0)}
                  placeholder="Linear feet"
                  readOnly={readOnly}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Summary Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Equipment Inventory Complete</h4>
            <p className="text-sm text-blue-700 mt-1">
              This comprehensive inventory will be used to generate accurate SOW specifications and ensure all roof equipment and penetrations are properly addressed in the project scope.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentInventoryStep;
