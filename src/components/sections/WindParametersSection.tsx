import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wind, AlertTriangle, Info, Zap } from 'lucide-react';

interface WindParametersData {
  designWindSpeed: number;
  exposureCategory: 'B' | 'C' | 'D';
  buildingHeight: number;
  meanRoofHeight: number;
  windDirectionality: number;
  importanceFactor: number;
  enclosureClassification: 'Enclosed' | 'Partially Enclosed' | 'Open';
  gustFactor: number;
}

interface WindParametersSectionProps {
  data: Partial<WindParametersData>;
  onChange: (updates: Partial<WindParametersData>) => void;
}

export const WindParametersSection: React.FC<WindParametersSectionProps> = ({
  data,
  onChange
}) => {
  const updateField = (field: keyof WindParametersData, value: any) => {
    onChange({ [field]: value });
  };

  const getExposureDescription = (category: string) => {
    const descriptions = {
      'B': 'Urban/suburban areas with numerous closely spaced obstructions',
      'C': 'Open terrain with scattered obstructions (most common)',
      'D': 'Flat, unobstructed areas exposed to wind flowing over open water'
    };
    return descriptions[category as keyof typeof descriptions] || '';
  };

  const getWindSpeedSeverity = (speed: number) => {
    if (speed >= 150) return { color: 'text-tesla-error', label: 'High Wind Zone' };
    if (speed >= 130) return { color: 'text-tesla-warning', label: 'Moderate Wind Zone' };
    return { color: 'text-tesla-success', label: 'Standard Wind Zone' };
  };

  const windSeverity = getWindSpeedSeverity(data.designWindSpeed || 115);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 tesla-glass-card rounded-lg flex items-center justify-center">
          <Wind className="h-5 w-5 text-tesla-warning" />
        </div>
        <div>
          <h3 className="tesla-h3">Wind Load Parameters</h3>
          <p className="tesla-small text-tesla-text-muted">ASCE 7 wind analysis and exposure conditions</p>
        </div>
      </div>

      {/* Wind Speed and Classification */}
      <div className="tesla-glass-card p-6">
        <h4 className="tesla-h4 mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-tesla-warning" />
          Basic Wind Parameters
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="tesla-label">Design Wind Speed (mph)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={data.designWindSpeed || ''}
                  onChange={(e) => updateField('designWindSpeed', parseInt(e.target.value) || 0)}
                  placeholder="115"
                  className="tesla-input"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Badge className={`${windSeverity.color} border-current bg-current/10`}>
                    {windSeverity.label}
                  </Badge>
                </div>
              </div>
              <p className="tesla-small text-tesla-text-muted mt-1">
                Ultimate design wind speed per ASCE 7
              </p>
            </div>

            <div>
              <Label className="tesla-label">Exposure Category</Label>
              <Select
                value={data.exposureCategory || ''}
                onValueChange={(value) => updateField('exposureCategory', value)}
              >
                <SelectTrigger className="tesla-input">
                  <SelectValue placeholder="Select exposure category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B">Exposure B - Urban/Suburban</SelectItem>
                  <SelectItem value="C">Exposure C - Open Terrain</SelectItem>
                  <SelectItem value="D">Exposure D - Flat/Unobstructed</SelectItem>
                </SelectContent>
              </Select>
              {data.exposureCategory && (
                <p className="tesla-small text-tesla-text-muted mt-1">
                  {getExposureDescription(data.exposureCategory)}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="tesla-label">Mean Roof Height (ft)</Label>
              <Input
                type="number"
                value={data.meanRoofHeight || ''}
                onChange={(e) => updateField('meanRoofHeight', parseInt(e.target.value) || 0)}
                placeholder="30"
                className="tesla-input"
              />
              <p className="tesla-small text-tesla-text-muted mt-1">
                Average height of roof above grade
              </p>
            </div>

            <div>
              <Label className="tesla-label">Enclosure Classification</Label>
              <Select
                value={data.enclosureClassification || ''}
                onValueChange={(value) => updateField('enclosureClassification', value)}
              >
                <SelectTrigger className="tesla-input">
                  <SelectValue placeholder="Select enclosure type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enclosed">Enclosed Building</SelectItem>
                  <SelectItem value="Partially Enclosed">Partially Enclosed</SelectItem>
                  <SelectItem value="Open">Open Building</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Parameters */}
      <div className="tesla-glass-card p-6">
        <h4 className="tesla-h4 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-tesla-warning" />
          Advanced Factors
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="tesla-label">Wind Directionality Factor (Kd)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.windDirectionality || ''}
              onChange={(e) => updateField('windDirectionality', parseFloat(e.target.value) || 0)}
              placeholder="0.85"
              className="tesla-input"
            />
            <p className="tesla-small text-tesla-text-muted mt-1">
              Typically 0.85 for buildings
            </p>
          </div>

          <div>
            <Label className="tesla-label">Importance Factor (I)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.importanceFactor || ''}
              onChange={(e) => updateField('importanceFactor', parseFloat(e.target.value) || 0)}
              placeholder="1.0"
              className="tesla-input"
            />
            <p className="tesla-small text-tesla-text-muted mt-1">
              1.0 for standard occupancy
            </p>
          </div>

          <div>
            <Label className="tesla-label">Gust Factor (G)</Label>
            <Input
              type="number"
              step="0.01"
              value={data.gustFactor || ''}
              onChange={(e) => updateField('gustFactor', parseFloat(e.target.value) || 0)}
              placeholder="0.85"
              className="tesla-input"
            />
            <p className="tesla-small text-tesla-text-muted mt-1">
              0.85 for rigid structures
            </p>
          </div>
        </div>
      </div>

      {/* Wind Zone Calculation Preview */}
      {data.designWindSpeed && data.exposureCategory && (
        <div className="tesla-glass-card p-6 bg-tesla-blue/5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-tesla-blue mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="tesla-h4 text-tesla-blue mb-2">Preliminary Wind Zone Analysis</h4>
              <p className="tesla-body text-tesla-text-secondary mb-4">
                Based on {data.designWindSpeed} mph wind speed and Exposure {data.exposureCategory}, 
                estimated uplift pressures will be calculated using ASCE 7 procedures. Final calculations 
                will account for building geometry and attachment requirements.
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="tesla-glass-card p-3">
                  <div className="tesla-small text-tesla-text-muted">Zone 1 (Field)</div>
                  <div className="tesla-body font-semibold text-tesla-success">~{Math.round(data.designWindSpeed * 0.15)} psf</div>
                </div>
                <div className="tesla-glass-card p-3">
                  <div className="tesla-small text-tesla-text-muted">Zone 1 (Perimeter)</div>
                  <div className="tesla-body font-semibold text-tesla-warning">~{Math.round(data.designWindSpeed * 0.25)} psf</div>
                </div>
                <div className="tesla-glass-card p-3">
                  <div className="tesla-small text-tesla-text-muted">Zone 2</div>
                  <div className="tesla-body font-semibold text-tesla-warning">~{Math.round(data.designWindSpeed * 0.35)} psf</div>
                </div>
                <div className="tesla-glass-card p-3">
                  <div className="tesla-small text-tesla-text-muted">Zone 3 (Corner)</div>
                  <div className="tesla-body font-semibold text-tesla-error">~{Math.round(data.designWindSpeed * 0.50)} psf</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};