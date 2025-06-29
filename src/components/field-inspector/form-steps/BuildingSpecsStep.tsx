import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Move, Calculator, Info, Shield } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

// Define membrane types locally since they're not in the imports
const MEMBRANE_TYPES = [
  { value: 'TPO', label: 'TPO', description: 'Thermoplastic Polyolefin - Single-ply membrane' },
  { value: 'EPDM', label: 'EPDM', description: 'Ethylene Propylene Diene Monomer - Rubber membrane' },
  { value: 'PVC', label: 'PVC', description: 'Polyvinyl Chloride - Single-ply membrane' },
  { value: 'Modified Bitumen', label: 'Modified Bitumen', description: 'Modified asphalt membrane' },
  { value: 'Built-Up', label: 'Built-Up', description: 'Traditional tar and gravel system' }
];

const INSULATION_TYPES = [
  { value: 'Polyisocyanurate', label: 'Polyisocyanurate (Polyiso)' },
  { value: 'EPS', label: 'Expanded Polystyrene (EPS)' },
  { value: 'XPS', label: 'Extruded Polystyrene (XPS)' },
  { value: 'Mineral Wool', label: 'Mineral Wool' },
  { value: 'Perlite', label: 'Perlite' }
];

interface BuildingSpecsStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

interface InsulationLayer {
  id: string;
  type: string;
  thickness: number;
  description?: string;
}

const BuildingSpecsStep: React.FC<BuildingSpecsStepProps> = ({ 
  data, 
  onChange, 
  readOnly = false 
}) => {
  // Initialize insulation layers from data or create default
  const [insulationLayers, setInsulationLayers] = React.useState<InsulationLayer[]>(() => {
    if (data.insulation_layers && Array.isArray(data.insulation_layers)) {
      return data.insulation_layers;
    }
    return [{ id: '1', type: '', thickness: 0 }];
  });

  const [selectedMembraneInfo, setSelectedMembraneInfo] = React.useState<string>('');

  const handleInsulationLayersChange = (layers: InsulationLayer[]) => {
    setInsulationLayers(layers);
    onChange({ insulation_layers: layers });
  };

  const handleMembraneTypeChange = (value: string) => {
    // Use existing_membrane_type instead of membrane_type
    onChange({ existing_membrane_type: value });
    const membraneInfo = MEMBRANE_TYPES.find(m => m.value === value)?.description || '';
    setSelectedMembraneInfo(membraneInfo);
  };

  // Set roof slope to fixed value
  React.useEffect(() => {
    if (!data.roof_slope) {
      onChange({ roof_slope: 'Low Slope (1-2/12)' });
    }
  }, []);

  // Enhanced square footage calculation with validation
  const calculateSquareFootage = (length: number | undefined, width: number | undefined): number => {
    const validLength = Number(length) || 0;
    const validWidth = Number(width) || 0;
    
    if (validLength <= 0 || validWidth <= 0) {
      return 0;
    }
    
    return Math.round(validLength * validWidth);
  };

  const getCalculationDisplay = (): string | null => {
    const length = data.building_length;
    const width = data.building_width;
    
    if (!length || !width || length <= 0 || width <= 0) {
      return null;
    }
    
    const squareFootage = calculateSquareFootage(length, width);
    return `${length} × ${width} = ${squareFootage.toLocaleString()} sq ft`;
  };

  const handleLengthChange = (value: string) => {
    const numericValue = parseFloat(value);
    const length = isNaN(numericValue) ? undefined : numericValue;
    
    const updates: Partial<FieldInspection> = { building_length: length };
    
    if (length && length > 0 && data.building_width && data.building_width > 0) {
      updates.square_footage = calculateSquareFootage(length, data.building_width);
    } else if (!length || length <= 0) {
      updates.square_footage = 0;
    }
    
    onChange(updates);
  };

  const handleWidthChange = (value: string) => {
    const numericValue = parseFloat(value);
    const width = isNaN(numericValue) ? undefined : numericValue;
    
    const updates: Partial<FieldInspection> = { building_width: width };
    
    if (width && width > 0 && data.building_length && data.building_length > 0) {
      updates.square_footage = calculateSquareFootage(data.building_length, width);
    } else if (!width || width <= 0) {
      updates.square_footage = 0;
    }
    
    onChange(updates);
  };

  const isLengthValid = data.building_length === undefined || data.building_length > 0;
  const isWidthValid = data.building_width === undefined || data.building_width > 0;
  const calculationDisplay = getCalculationDisplay();

  const addInsulationLayer = () => {
    const newLayer: InsulationLayer = {
      id: Date.now().toString(),
      type: '',
      thickness: 0
    };
    handleInsulationLayersChange([...insulationLayers, newLayer]);
  };

  const removeInsulationLayer = (id: string) => {
    if (insulationLayers.length > 1) {
      handleInsulationLayersChange(insulationLayers.filter(layer => layer.id !== id));
    }
  };

  const updateInsulationLayer = (id: string, updates: Partial<InsulationLayer>) => {
    handleInsulationLayersChange(
      insulationLayers.map(layer => 
        layer.id === id ? { ...layer, ...updates } : layer
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Building Dimensions */}
      <Card className="bg-white/10 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            Building Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="building_height" className="text-white">Building Height (ft) *</Label>
              <Input
                id="building_height"
                type="number"
                step="0.1"
                value={data.building_height || ''}
                onChange={(e) => onChange({ building_height: parseFloat(e.target.value) || 0 })}
                className="bg-white/20 border-blue-400/30 text-white"
                placeholder="e.g., 24.5"
                required
                readOnly={readOnly}
              />
            </div>
            
            <div>
              <Label htmlFor="building_length" className="text-white">Building Length (ft)</Label>
              <Input
                id="building_length"
                type="number"
                step="0.1"
                min="0"
                value={data.building_length || ''}
                onChange={(e) => handleLengthChange(e.target.value)}
                className={`bg-white/20 border-blue-400/30 text-white ${
                  !isLengthValid ? 'border-red-400 bg-red-500/20' : ''
                }`}
                placeholder="Enter length"
                readOnly={readOnly}
              />
              {!isLengthValid && (
                <p className="text-red-300 text-xs mt-1">Length must be greater than 0</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="building_width" className="text-white">Building Width (ft)</Label>
              <Input
                id="building_width"
                type="number"
                step="0.1"
                min="0"
                value={data.building_width || ''}
                onChange={(e) => handleWidthChange(e.target.value)}
                className={`bg-white/20 border-blue-400/30 text-white ${
                  !isWidthValid ? 'border-red-400 bg-red-500/20' : ''
                }`}
                placeholder="Enter width"
                readOnly={readOnly}
              />
              {!isWidthValid && (
                <p className="text-red-300 text-xs mt-1">Width must be greater than 0</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="square_footage" className="text-white">Square Footage</Label>
              <Input
                id="square_footage"
                type="number"
                min="0"
                value={data.square_footage || ''}
                onChange={(e) => onChange({ square_footage: parseFloat(e.target.value) || 0 })}
                className="bg-white/20 border-blue-400/30 text-white"
                placeholder="Auto-calculated or enter manually"
                readOnly={readOnly}
              />
              
              {/* Calculation Display */}
              {calculationDisplay && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-500/20 rounded border border-blue-400/30">
                  <Calculator className="w-4 h-4 text-blue-300" />
                  <span className="text-blue-200 text-sm font-medium">{calculationDisplay}</span>
                </div>
              )}
              
              {/* Instruction Text */}
              {!calculationDisplay && (data.building_length || data.building_width) && (
                <p className="text-blue-300 text-xs mt-1">
                  Enter both length and width for auto-calculation
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="number_of_stories" className="text-white">Number of Stories</Label>
              <Select
                value={data.number_of_stories?.toString() || ''}
                onValueChange={(value) => onChange({ number_of_stories: parseInt(value) })}
                disabled={readOnly}
              >
                <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
                  <SelectValue placeholder="Select stories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Story</SelectItem>
                  <SelectItem value="2">2 Stories</SelectItem>
                  <SelectItem value="3">3 Stories</SelectItem>
                  <SelectItem value="4">4+ Stories</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fixed Roof Slope */}
          <div>
            <Label className="text-white">Roof Slope</Label>
            <div className="bg-white/20 border border-blue-400/30 rounded-md px-3 py-2 text-white">
              Low Slope (1-2/12)
            </div>
            <p className="text-blue-200 text-sm mt-1">Fixed for commercial roofing applications</p>
          </div>
        </CardContent>
      </Card>

      {/* Roof Assembly - Visual Layer System */}
      <Card className="bg-white/10 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            Roof Assembly Layers
          </CardTitle>
          <p className="text-blue-200 text-sm">Configure layers from deck up to membrane</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Deck Layer */}
          <div className="bg-blue-500/20 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <Label className="text-white font-semibold">Deck Type *</Label>
            </div>
            <Select
              value={data.deck_type || ''}
              onValueChange={(value) => onChange({ deck_type: value })}
              disabled={readOnly}
            >
              <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
                <SelectValue placeholder="Select deck type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Steel">Steel Deck</SelectItem>
                <SelectItem value="Concrete">Concrete Deck</SelectItem>
                <SelectItem value="Wood">Wood Deck</SelectItem>
                <SelectItem value="Gypsum">Gypsum Deck</SelectItem>
                <SelectItem value="Loadmaster">Loadmaster Deck</SelectItem>
                <SelectItem value="Composite">Composite Deck</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Enhanced Membrane Type Selection */}
          <div className="bg-purple-500/20 rounded-lg p-4 border-l-4 border-purple-500 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <Label className="text-white font-semibold">Membrane Type *</Label>
              <Badge className="bg-yellow-600 text-white text-xs">
                Critical for Template Selection
              </Badge>
            </div>
            <Select
              value={data.existing_membrane_type || ''}
              onValueChange={handleMembraneTypeChange}
              disabled={readOnly}
            >
              <SelectTrigger className="bg-white/20 border-purple-400/30 text-white">
                <SelectValue placeholder="Select membrane type" />
              </SelectTrigger>
              <SelectContent>
                {MEMBRANE_TYPES.map((membrane) => (
                  <SelectItem key={membrane.value} value={membrane.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{membrane.label}</span>
                      <span className="text-xs text-gray-500">{membrane.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMembraneInfo && (
              <Alert className="bg-purple-900/50 border-purple-400/30">
                <Shield className="h-4 w-4 text-purple-400" />
                <AlertDescription className="text-purple-200">
                  <strong>Selected:</strong> {selectedMembraneInfo}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Enhanced Insulation Layers */}
          <div className="bg-green-500/20 rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <Label className="text-white font-semibold">Insulation Layers</Label>
              </div>
              {!readOnly && (
                <Button
                  type="button"
                  onClick={addInsulationLayer}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-auto"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Layer
                </Button>
              )}
            </div>
            
            {insulationLayers.map((layer, index) => (
              <div key={layer.id} className="bg-green-600/20 rounded p-3 mb-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-200 text-sm font-medium">Layer {index + 1}</span>
                  {!readOnly && insulationLayers.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeInsulationLayer(layer.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 h-auto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-green-200 text-xs">Insulation Type</Label>
                    <Select
                      value={layer.type}
                      onValueChange={(value) => updateInsulationLayer(layer.id, { type: value })}
                      disabled={readOnly}
                    >
                      <SelectTrigger className="bg-white/20 border-green-400/30 text-white h-8">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSULATION_TYPES.map((insulation) => (
                          <SelectItem key={insulation.value} value={insulation.value}>
                            {insulation.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-green-200 text-xs">Thickness (inches)</Label>
                    <Input
                      type="number"
                      step="0.25"
                      min="0"
                      value={layer.thickness || ''}
                      onChange={(e) => updateInsulationLayer(layer.id, { thickness: parseFloat(e.target.value) || 0 })}
                      className="bg-white/20 border-green-400/30 text-white h-8"
                      placeholder="2.0"
                      readOnly={readOnly}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildingSpecsStep;
