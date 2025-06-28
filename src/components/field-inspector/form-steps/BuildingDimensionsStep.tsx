
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Ruler, Calculator, Info } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface BuildingDimensionsStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const BuildingDimensionsStep: React.FC<BuildingDimensionsStepProps> = ({
  data,
  onChange,
  readOnly = false
}) => {
  // Enhanced square footage calculation with validation
  const calculateSquareFootage = (length: number | undefined, width: number | undefined): number => {
    const validLength = Number(length) || 0;
    const validWidth = Number(width) || 0;
    
    if (validLength <= 0 || validWidth <= 0) {
      return 0;
    }
    
    return Math.round(validLength * validWidth);
  };

  // Get calculation display text
  const getCalculationDisplay = (): string | null => {
    const length = data.building_length;
    const width = data.building_width;
    
    if (!length || !width || length <= 0 || width <= 0) {
      return null;
    }
    
    const squareFootage = calculateSquareFootage(length, width);
    return `${length} × ${width} = ${squareFootage.toLocaleString()} sq ft`;
  };

  // Handle length input change with auto-calculation
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

  // Handle width input change with auto-calculation
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

  const handleInputChange = (field: keyof FieldInspection, value: any) => {
    onChange({ [field]: value });
  };

  // Validate dimension inputs
  const isLengthValid = data.building_length === undefined || data.building_length > 0;
  const isWidthValid = data.building_width === undefined || data.building_width > 0;
  const calculationDisplay = getCalculationDisplay();

  return (
    <div className="space-y-6">
      <Alert className="bg-amber-50 border-amber-200">
        <Ruler className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Field Measurements:</strong> Document the building dimensions as accurately as possible. These measurements will be used for material calculations and cost estimation.
        </AlertDescription>
      </Alert>

      {/* Building Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5" />
            Building Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="building_height">Building Height (ft) *</Label>
              <Input
                id="building_height"
                type="number"
                step="0.1"
                min="0"
                value={data.building_height || ''}
                onChange={(e) => handleInputChange('building_height', parseFloat(e.target.value) || 0)}
                placeholder="e.g., 24.5"
                required
                readOnly={readOnly}
              />
              <p className="text-xs text-gray-500 mt-1">Measure from ground to roof level</p>
            </div>
            
            <div>
              <Label htmlFor="building_length">Building Length (ft)</Label>
              <Input
                id="building_length"
                type="number"
                step="0.1"
                min="0"
                value={data.building_length || ''}
                onChange={(e) => handleLengthChange(e.target.value)}
                className={!isLengthValid ? 'border-red-400' : ''}
                placeholder="Enter length"
                readOnly={readOnly}
              />
              {!isLengthValid && (
                <p className="text-red-500 text-xs mt-1">Length must be greater than 0</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="building_width">Building Width (ft)</Label>
              <Input
                id="building_width"
                type="number"
                step="0.1"
                min="0"
                value={data.building_width || ''}
                onChange={(e) => handleWidthChange(e.target.value)}
                className={!isWidthValid ? 'border-red-400' : ''}
                placeholder="Enter width"
                readOnly={readOnly}
              />
              {!isWidthValid && (
                <p className="text-red-500 text-xs mt-1">Width must be greater than 0</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="square_footage">Square Footage</Label>
              <Input
                id="square_footage"
                type="number"
                min="0"
                value={data.square_footage || ''}
                onChange={(e) => handleInputChange('square_footage', parseFloat(e.target.value) || 0)}
                placeholder="Auto-calculated or enter manually"
                readOnly={readOnly}
              />
              
              {/* Calculation Display */}
              {calculationDisplay && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700 text-sm font-medium">{calculationDisplay}</span>
                </div>
              )}
              
              {/* Instruction Text */}
              {!calculationDisplay && (data.building_length || data.building_width) && (
                <p className="text-blue-600 text-xs mt-1">
                  Enter both length and width for auto-calculation
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="number_of_stories">Number of Stories</Label>
              <Select
                value={data.number_of_stories?.toString() || ''}
                onValueChange={(value) => handleInputChange('number_of_stories', parseInt(value))}
                disabled={readOnly}
              >
                <SelectTrigger>
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
        </CardContent>
      </Card>

      {/* Basic Building Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Building Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="roof_slope">Roof Slope</Label>
              <Select
                value={data.roof_slope || ''}
                onValueChange={(value) => handleInputChange('roof_slope', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select roof slope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flat (0-1/4/12)">Flat (0-1/4 per 12)</SelectItem>
                  <SelectItem value="Low Slope (1/4-2/12)">Low Slope (1/4-2 per 12)</SelectItem>
                  <SelectItem value="Steep Slope (>2/12)">Steep Slope (>2 per 12)</SelectItem>
                  <SelectItem value="Unknown">Unable to Determine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="project_type">Project Type</Label>
              <Select
                value={data.project_type || ''}
                onValueChange={(value) => handleInputChange('project_type', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recover">Recover (over existing)</SelectItem>
                  <SelectItem value="tearoff">Tear-off (complete replacement)</SelectItem>
                  <SelectItem value="new">New Construction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Measurement Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Measurement Guidelines</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Measure building dimensions at roof level when possible</li>
              <li>• For complex shapes, break into rectangular sections</li>
              <li>• Note any significant roof level changes or sections</li>
              <li>• Include overhangs and canopies in measurements</li>
              <li>• If exact measurements aren't possible, provide best estimates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildingDimensionsStep;
