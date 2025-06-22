import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Droplets, Zap, Wind, Plus, Minus, Settings } from 'lucide-react';

interface RoofFeaturesProps {
  data: {
    numberOfDrains: number;
    drainTypes: string[];
    numberOfPenetrations: number;
    penetrationTypes: string[];
    skylights: number;
    roofHatches: number;
    hvacUnits: number;
    walkwayPadRequested: boolean;
    gutterType: string;
    downspouts: number;
    expansionJoints: number;
    parapetHeight: number;
    roofConfiguration: string;
  };
  onChange: (updates: Partial<RoofFeaturesProps['data']>) => void;
}

export const RoofFeaturesSection: React.FC<RoofFeaturesProps> = ({ data, onChange }) => {
  const addPenetrationType = (type: string) => {
    if (!data.penetrationTypes.includes(type)) {
      onChange({ 
        penetrationTypes: [...data.penetrationTypes, type] 
      });
    }
  };

  const removePenetrationType = (type: string) => {
    onChange({ 
      penetrationTypes: data.penetrationTypes.filter(t => t !== type) 
    });
  };

  const addDrainType = (type: string) => {
    if (!data.drainTypes.includes(type)) {
      onChange({ 
        drainTypes: [...data.drainTypes, type] 
      });
    }
  };

  const removeDrainType = (type: string) => {
    onChange({ 
      drainTypes: data.drainTypes.filter(t => t !== type) 
    });
  };

  const calculateComplexity = () => {
    const totalFeatures = 
      data.numberOfDrains + 
      data.numberOfPenetrations + 
      data.skylights + 
      data.roofHatches + 
      data.hvacUnits +
      data.expansionJoints;
    
    if (totalFeatures <= 5) return { level: 'Simple', color: 'success' };
    if (totalFeatures <= 15) return { level: 'Moderate', color: 'warning' };
    return { level: 'Complex', color: 'error' };
  };

  const complexity = calculateComplexity();

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Roof Configuration Overview */}
        <div className="tesla-glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-tesla-blue" />
              <h4 className="tesla-h3">Roof Configuration</h4>
            </div>
            <div className={`tesla-status ${complexity.color}`}>
              {complexity.level}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Roof Configuration
              </Label>
              <Select value={data.roofConfiguration} onValueChange={(value) => onChange({ roofConfiguration: value })}>
                <SelectTrigger className="tesla-input">
                  <SelectValue placeholder="Select configuration" />
                </SelectTrigger>
                <SelectContent className="tesla-dark">
                  <SelectItem value="Single Level">Single Level</SelectItem>
                  <SelectItem value="Multi-Level">Multi-Level</SelectItem>
                  <SelectItem value="Split Level">Split Level</SelectItem>
                  <SelectItem value="Tiered">Tiered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Parapet Height (ft)
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-tesla-text-muted ml-1 inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Height of parapet walls above roof surface</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={data.parapetHeight || ''}
                onChange={(e) => onChange({ parapetHeight: parseFloat(e.target.value) || 0 })}
                placeholder="e.g., 3.0"
                className="tesla-input"
              />
            </div>

            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Expansion Joints
              </Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={data.expansionJoints || ''}
                onChange={(e) => onChange({ expansionJoints: parseInt(e.target.value) || 0 })}
                placeholder="Number of joints"
                className="tesla-input"
              />
            </div>
          </div>
        </div>

        {/* Drainage System */}
        <div className="tesla-glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="h-5 w-5 text-tesla-blue" />
            <h4 className="tesla-h3">Drainage System</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Number of Drains
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={data.numberOfDrains || ''}
                onChange={(e) => onChange({ numberOfDrains: parseInt(e.target.value) || 0 })}
                placeholder="Total drain count"
                className="tesla-input"
              />
            </div>

            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Drain Types
              </Label>
              <div className="space-y-2">
                {['Primary', 'Overflow', 'Scupper', 'Area Drain'].map((type) => (
                  <div key={type} className="flex items-center justify-between tesla-glass-card p-3">
                    <span className="tesla-body">{type}</span>
                    {data.drainTypes.includes(type) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeDrainType(type)}
                        className="tesla-btn bg-tesla-error text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addDrainType(type)}
                        className="tesla-btn"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gutter System */}
          <div className="mt-6 pt-6 border-t border-tesla-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="tesla-body font-medium mb-2 block">
                  Gutter Type
                </Label>
                <Select value={data.gutterType} onValueChange={(value) => onChange({ gutterType: value })}>
                  <SelectTrigger className="tesla-input">
                    <SelectValue placeholder="Select gutter type" />
                  </SelectTrigger>
                  <SelectContent className="tesla-dark">
                    <SelectItem value="None">No Gutters</SelectItem>
                    <SelectItem value="Internal">Internal Gutters</SelectItem>
                    <SelectItem value="External">External Gutters</SelectItem>
                    <SelectItem value="Box">Box Gutters</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {data.gutterType !== 'None' && (
                <div>
                  <Label className="tesla-body font-medium mb-2 block">
                    Number of Downspouts
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    value={data.downspouts || ''}
                    onChange={(e) => onChange({ downspouts: parseInt(e.target.value) || 0 })}
                    placeholder="Downspout count"
                    className="tesla-input"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Roof Penetrations */}
        <div className="tesla-glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-tesla-warning" />
            <h4 className="tesla-h3">Roof Penetrations</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Total Penetrations
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-tesla-text-muted ml-1 inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>All pipes, vents, and equipment penetrations</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                type="number"
                min="0"
                max="500"
                value={data.numberOfPenetrations || ''}
                onChange={(e) => onChange({ numberOfPenetrations: parseInt(e.target.value) || 0 })}
                placeholder="Total count"
                className="tesla-input"
              />
            </div>

            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Penetration Types
              </Label>
              <div className="space-y-2">
                {['HVAC', 'Plumbing', 'Electrical', 'Gas', 'Vent', 'Other'].map((type) => (
                  <div key={type} className="flex items-center justify-between tesla-glass-card p-3">
                    <span className="tesla-body">{type}</span>
                    {data.penetrationTypes.includes(type) ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePenetrationType(type)}
                        className="tesla-btn bg-tesla-error text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addPenetrationType(type)}
                        className="tesla-btn"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Roof Equipment & Features */}
        <div className="tesla-glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wind className="h-5 w-5 text-tesla-success" />
            <h4 className="tesla-h3">Roof Equipment & Features</h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Skylights
              </Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={data.skylights || ''}
                onChange={(e) => onChange({ skylights: parseInt(e.target.value) || 0 })}
                placeholder="Count"
                className="tesla-input"
              />
            </div>

            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Roof Hatches
              </Label>
              <Input
                type="number"
                min="0"
                max="20"
                value={data.roofHatches || ''}
                onChange={(e) => onChange({ roofHatches: parseInt(e.target.value) || 0 })}
                placeholder="Count"
                className="tesla-input"
              />
            </div>

            <div>
              <Label className="tesla-body font-medium mb-2 block">
                HVAC Units
              </Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={data.hvacUnits || ''}
                onChange={(e) => onChange({ hvacUnits: parseInt(e.target.value) || 0 })}
                placeholder="Count"
                className="tesla-input"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="walkway"
                checked={data.walkwayPadRequested}
                onChange={(e) => onChange({ walkwayPadRequested: e.target.checked })}
                className="tesla-checkbox"
              />
              <Label htmlFor="walkway" className="tesla-body font-medium">
                Walkway Pads
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-tesla-text-muted ml-1 inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Protective walkways for maintenance access</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
          </div>
        </div>

        {/* Complexity Summary */}
        <div className="tesla-glass-card p-6">
          <h4 className="tesla-h3 mb-4">Project Complexity Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="tesla-glass-card p-4">
              <div className="tesla-h2 text-tesla-blue">{data.numberOfDrains}</div>
              <div className="tesla-small text-tesla-text-secondary">Drains</div>
            </div>
            <div className="tesla-glass-card p-4">
              <div className="tesla-h2 text-tesla-warning">{data.numberOfPenetrations}</div>
              <div className="tesla-small text-tesla-text-secondary">Penetrations</div>
            </div>
            <div className="tesla-glass-card p-4">
              <div className="tesla-h2 text-tesla-success">{data.skylights + data.roofHatches}</div>
              <div className="tesla-small text-tesla-text-secondary">Openings</div>
            </div>
            <div className="tesla-glass-card p-4">
              <div className="tesla-h2 text-tesla-text-primary">{data.hvacUnits}</div>
              <div className="tesla-small text-tesla-text-secondary">Equipment</div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
