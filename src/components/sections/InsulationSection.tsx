import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Layers, Thermometer } from 'lucide-react';

interface InsulationSectionProps {
  data: {
    insulationType: string;
    insulationThickness: number;
    insulationRValue: number;
    coverBoardType: string;
    coverBoardThickness: number;
    hasExistingInsulation: boolean;
    existingInsulationCondition: string;
  };
  onChange: (updates: Partial<InsulationSectionProps['data']>) => void;
}

export const InsulationSection: React.FC<InsulationSectionProps> = ({ data, onChange }) => {
  const calculateRValue = (type: string, thickness: number) => {
    const rValuePerInch: { [key: string]: number } = {
      'Polyisocyanurate': 6.0,
      'EPS': 4.0,
      'XPS': 5.0,
      'Mineral Wool': 4.3,
      'Fiberglass': 3.8,
    };
    return Math.round((rValuePerInch[type] || 4.0) * thickness * 10) / 10;
  };

  const handleThicknessChange = (thickness: number) => {
    const rValue = calculateRValue(data.insulationType, thickness);
    onChange({ 
      insulationThickness: thickness,
      insulationRValue: rValue 
    });
  };

  const handleTypeChange = (type: string) => {
    const rValue = calculateRValue(type, data.insulationThickness);
    onChange({ 
      insulationType: type,
      insulationRValue: rValue 
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Existing Insulation Assessment */}
        <div className="tesla-glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-tesla-blue" />
            <h4 className="tesla-h3">Existing Insulation Assessment</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Existing Insulation Present
              </Label>
              <Select 
                value={data.hasExistingInsulation ? 'yes' : 'no'} 
                onValueChange={(value) => onChange({ hasExistingInsulation: value === 'yes' })}
              >
                <SelectTrigger className="tesla-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="tesla-dark">
                  <SelectItem value="yes">Yes - Keep existing</SelectItem>
                  <SelectItem value="no">No - New insulation only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {data.hasExistingInsulation && (
              <div>
                <Label className="tesla-body font-medium mb-2 block">
                  Existing Insulation Condition
                </Label>
                <Select 
                  value={data.existingInsulationCondition} 
                  onValueChange={(value) => onChange({ existingInsulationCondition: value })}
                >
                  <SelectTrigger className="tesla-input">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="tesla-dark">
                    <SelectItem value="good">Good - No damage</SelectItem>
                    <SelectItem value="fair">Fair - Minor damage</SelectItem>
                    <SelectItem value="poor">Poor - Requires replacement</SelectItem>
                    <SelectItem value="wet">Wet - Must be removed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* New Insulation Specifications */}
        <div className="tesla-glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Thermometer className="h-5 w-5 text-tesla-success" />
            <h4 className="tesla-h3">New Insulation Specifications</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Insulation Type
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-tesla-text-muted ml-1 inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose based on project requirements and budget</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Select value={data.insulationType} onValueChange={handleTypeChange}>
                <SelectTrigger className="tesla-input">
                  <SelectValue placeholder="Select insulation type" />
                </SelectTrigger>
                <SelectContent className="tesla-dark">
                  <SelectItem value="Polyisocyanurate">Polyisocyanurate (R-6.0/inch)</SelectItem>
                  <SelectItem value="EPS">EPS (R-4.0/inch)</SelectItem>
                  <SelectItem value="XPS">XPS (R-5.0/inch)</SelectItem>
                  <SelectItem value="Mineral Wool">Mineral Wool (R-4.3/inch)</SelectItem>
                  <SelectItem value="Fiberglass">Fiberglass (R-3.8/inch)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Thickness (inches)
              </Label>
              <Input
                type="number"
                step="0.25"
                min="0.5"
                max="12"
                value={data.insulationThickness || ''}
                onChange={(e) => handleThicknessChange(parseFloat(e.target.value) || 0)}
                placeholder="e.g., 2.5"
                className="tesla-input"
              />
            </div>

            <div>
              <Label className="tesla-body font-medium mb-2 block">
                R-Value (calculated)
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-tesla-text-muted ml-1 inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Automatically calculated based on type and thickness</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="tesla-input bg-tesla-surface-hover text-tesla-text-secondary cursor-not-allowed">
                R-{data.insulationRValue || 0}
              </div>
            </div>
          </div>

          {/* R-Value Indicator */}
          {data.insulationRValue > 0 && (
            <div className="mt-4 p-4 tesla-glass-card">
              <div className="flex items-center justify-between">
                <span className="tesla-body">Thermal Performance:</span>
                <div className="flex items-center gap-2">
                  <div className={`tesla-status ${
                    data.insulationRValue >= 20 ? 'success' : 
                    data.insulationRValue >= 10 ? 'warning' : 'error'
                  }`}>
                    {data.insulationRValue >= 20 ? 'Excellent' : 
                     data.insulationRValue >= 10 ? 'Good' : 'Minimum'}
                  </div>
                  <span className="tesla-small">R-{data.insulationRValue}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cover Board Specifications */}
        <div className="tesla-glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-5 w-5 text-tesla-warning" />
            <h4 className="tesla-h3">Cover Board Specifications</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="tesla-body font-medium mb-2 block">
                Cover Board Type
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-tesla-text-muted ml-1 inline" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cover board protects insulation and provides substrate</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Select value={data.coverBoardType} onValueChange={(value) => onChange({ coverBoardType: value })}>
                <SelectTrigger className="tesla-input">
                  <SelectValue placeholder="Select cover board type" />
                </SelectTrigger>
                <SelectContent className="tesla-dark">
                  <SelectItem value="None">None - Direct membrane attachment</SelectItem>
                  <SelectItem value="Gypsum">Gypsum (5/8" standard)</SelectItem>
                  <SelectItem value="DensDeck">DensDeck (1/4" - 1/2")</SelectItem>
                  <SelectItem value="Perlite">Perlite (1/2" standard)</SelectItem>
                  <SelectItem value="Wood Fiber">Wood Fiber (1/2" - 1")</SelectItem>
                  <SelectItem value="HD Foam">HD Polyiso (1/2" - 1")</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {data.coverBoardType !== 'None' && (
              <div>
                <Label className="tesla-body font-medium mb-2 block">
                  Cover Board Thickness (inches)
                </Label>
                <Select 
                  value={data.coverBoardThickness?.toString() || ''} 
                  onValueChange={(value) => onChange({ coverBoardThickness: parseFloat(value) })}
                >
                  <SelectTrigger className="tesla-input">
                    <SelectValue placeholder="Select thickness" />
                  </SelectTrigger>
                  <SelectContent className="tesla-dark">
                    <SelectItem value="0.25">1/4 inch</SelectItem>
                    <SelectItem value="0.5">1/2 inch</SelectItem>
                    <SelectItem value="0.625">5/8 inch</SelectItem>
                    <SelectItem value="0.75">3/4 inch</SelectItem>
                    <SelectItem value="1">1 inch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Cover Board Benefits */}
          {data.coverBoardType !== 'None' && (
            <div className="mt-4 p-4 tesla-glass-card">
              <h5 className="tesla-body font-semibold mb-2">Benefits of {data.coverBoardType}:</h5>
              <ul className="tesla-small space-y-1 text-tesla-text-secondary">
                {data.coverBoardType === 'Gypsum' && (
                  <>
                    <li>• Fire resistance and smooth substrate</li>
                    <li>• Cost-effective option</li>
                    <li>• Moisture sensitive - requires protection</li>
                  </>
                )}
                {data.coverBoardType === 'DensDeck' && (
                  <>
                    <li>• Moisture and fire resistant</li>
                    <li>• Lightweight and durable</li>
                    <li>• Premium option with excellent performance</li>
                  </>
                )}
                {data.coverBoardType === 'Perlite' && (
                  <>
                    <li>• Traditional proven performance</li>
                    <li>• Fire resistant</li>
                    <li>• Heavier than modern alternatives</li>
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
