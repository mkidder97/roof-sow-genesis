import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Move } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface BuildingSpecsStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
}

interface InsulationLayer {
  id: string;
  type: string;
  thickness: number;
  description?: string;
}

const BuildingSpecsStep: React.FC<BuildingSpecsStepProps> = ({ data, onChange }) => {
  // Initialize insulation layers from data or create default
  const [insulationLayers, setInsulationLayers] = React.useState<InsulationLayer[]>(() => {
    if (data.insulation_layers && Array.isArray(data.insulation_layers)) {
      return data.insulation_layers;
    }
    return [{ id: '1', type: '', thickness: 0 }];
  });

  const handleInsulationLayersChange = (layers: InsulationLayer[]) => {
    setInsulationLayers(layers);
    onChange({ insulation_layers: layers });
  };

  // Set roof slope to fixed value
  React.useEffect(() => {
    if (!data.roof_slope) {
      onChange({ roof_slope: 'Low Slope (1-2/12)' });
    }
  }, []);

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

  const calculateSquareFootage = () => {
    const length = data.building_length || 0;
    const width = data.building_width || 0;
    if (length > 0 && width > 0) {
      onChange({ square_footage: length * width });
    }
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
              />
            </div>
            
            <div>
              <Label htmlFor="building_length" className="text-white">Building Length (ft)</Label>
              <Input
                id="building_length"
                type="number"
                step="0.1"
                value={data.building_length || ''}
                onChange={(e) => {
                  const length = parseFloat(e.target.value) || 0;
                  onChange({ building_length: length });
                  if (data.building_width) calculateSquareFootage();
                }}
                className="bg-white/20 border-blue-400/30 text-white"
                placeholder="Enter length"
              />
            </div>
            
            <div>
              <Label htmlFor="building_width" className="text-white">Building Width (ft)</Label>
              <Input
                id="building_width"
                type="number"
                step="0.1"
                value={data.building_width || ''}
                onChange={(e) => {
                  const width = parseFloat(e.target.value) || 0;
                  onChange({ building_width: width });
                  if (data.building_length) calculateSquareFootage();
                }}
                className="bg-white/20 border-blue-400/30 text-white"
                placeholder="Enter width"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="square_footage" className="text-white">Square Footage</Label>
              <Input
                id="square_footage"
                type="number"
                value={data.square_footage || ''}
                onChange={(e) => onChange({ square_footage: parseFloat(e.target.value) || 0 })}
                className="bg-white/20 border-blue-400/30 text-white"
                placeholder="Auto-calculated or enter manually"
              />
            </div>
            
            <div>
              <Label htmlFor="number_of_stories" className="text-white">Number of Stories</Label>
              <Select
                value={data.number_of_stories?.toString() || ''}
                onValueChange={(value) => onChange({ number_of_stories: parseInt(value) })}
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

          {/* Insulation Layers */}
          <div className="bg-green-500/20 rounded-lg p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <Label className="text-white font-semibold">Insulation Layers</Label>
              </div>
              <Button
                type="button"
                onClick={addInsulationLayer}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 h-auto"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Layer
              </Button>
            </div>

            <div className="space-y-3">
              {insulationLayers.map((layer, index) => (
                <div key={layer.id} className="bg-white/10 rounded p-3 border border-green-400/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Move className="w-4 h-4 text-green-400" />
                    <span className="text-white text-sm font-medium">Layer {index + 1}</span>
                    {insulationLayers.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeInsulationLayer(layer.id)}
                        className="ml-auto bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 h-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white text-xs">Insulation Type</Label>
                      <Select
                        value={layer.type}
                        onValueChange={(value) => updateInsulationLayer(layer.id, { type: value })}
                      >
                        <SelectTrigger className="bg-white/20 border-green-400/30 text-white text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Polyisocyanurate">Polyisocyanurate (Polyiso)</SelectItem>
                          <SelectItem value="EPS">Expanded Polystyrene (EPS)</SelectItem>
                          <SelectItem value="XPS">Extruded Polystyrene (XPS)</SelectItem>
                          <SelectItem value="Fiberglass">Fiberglass</SelectItem>
                          <SelectItem value="Wood Fiber Board">Wood Fiber Board</SelectItem>
                          <SelectItem value="Lightweight Concrete">Lightweight Concrete</SelectItem>
                          <SelectItem value="Perlite">Perlite</SelectItem>
                          <SelectItem value="Mineral Wool">Mineral Wool</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-white text-xs">Thickness (inches)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        value={layer.thickness || ''}
                        onChange={(e) => updateInsulationLayer(layer.id, { thickness: parseFloat(e.target.value) || 0 })}
                        className="bg-white/20 border-green-400/30 text-white text-sm"
                        placeholder="e.g., 2.5"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cover Board/Membrane Layer */}
          <div className="bg-purple-500/20 rounded-lg p-4 border-l-4 border-purple-500">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <Label className="text-white font-semibold">Cover Board (Optional)</Label>
            </div>
            <Select
              value={data.cover_board_type || 'None'}
              onValueChange={(value) => onChange({ cover_board_type: value })}
            >
              <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
                <SelectValue placeholder="Select cover board" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">None - Direct to membrane</SelectItem>
                <SelectItem value="Gypsum">Gypsum Cover Board</SelectItem>
                <SelectItem value="DensDeck">DensDeck</SelectItem>
                <SelectItem value="Perlite">Perlite Board</SelectItem>
                <SelectItem value="Wood Fiber">Wood Fiber Board</SelectItem>
                <SelectItem value="HD Polyiso">HD Polyiso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-500/20 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>Pro Tip:</strong><br />
          Enter building length and width to automatically calculate square footage. You can also override the calculation manually if needed.
        </p>
      </div>
    </div>
  );
};

export default BuildingSpecsStep;
