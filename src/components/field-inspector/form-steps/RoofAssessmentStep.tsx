
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, AlertTriangle, Eye } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface RoofAssessmentStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const RoofAssessmentStep: React.FC<RoofAssessmentStepProps> = ({
  data,
  onChange,
  readOnly = false
}) => {
  const handleInputChange = (field: keyof FieldInspection, value: any) => {
    onChange({ [field]: value });
  };

  const getConditionColor = (condition: number) => {
    if (condition >= 8) return 'text-green-600';
    if (condition >= 6) return 'text-yellow-600';
    if (condition >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getConditionLabel = (condition: number) => {
    if (condition >= 8) return 'Excellent';
    if (condition >= 6) return 'Good';
    if (condition >= 4) return 'Fair';
    if (condition >= 2) return 'Poor';
    return 'Failed';
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-green-50 border-green-200">
        <Eye className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Inspection Focus:</strong> Document existing roof conditions, materials, and any visible issues. The engineering team will design the new roof system based on your findings.
        </AlertDescription>
      </Alert>

      {/* Existing Roof System Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            Existing Roof System Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deck-type">Existing Deck Type *</Label>
              <Select
                value={data.deck_type || ''}
                onValueChange={(value) => handleInputChange('deck_type', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select observed deck type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Steel">Steel Deck</SelectItem>
                  <SelectItem value="Concrete">Concrete Deck</SelectItem>
                  <SelectItem value="Wood">Wood Deck</SelectItem>
                  <SelectItem value="Gypsum">Gypsum Deck</SelectItem>
                  <SelectItem value="Loadmaster">Loadmaster Deck</SelectItem>
                  <SelectItem value="Composite">Composite Deck</SelectItem>
                  <SelectItem value="Unknown">Unable to Determine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="existing-membrane-type">Existing Membrane Type *</Label>
              <Select
                value={data.existing_membrane_type || ''}
                onValueChange={(value) => handleInputChange('existing_membrane_type', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select membrane type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TPO">TPO</SelectItem>
                  <SelectItem value="EPDM">EPDM</SelectItem>
                  <SelectItem value="PVC">PVC</SelectItem>
                  <SelectItem value="Modified Bitumen">Modified Bitumen</SelectItem>
                  <SelectItem value="Built-Up Roof (BUR)">Built-Up Roof (BUR)</SelectItem>
                  <SelectItem value="Metal">Metal</SelectItem>
                  <SelectItem value="Spray Foam">Spray Foam</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="insulation-type">Visible Insulation Type</Label>
              <Select
                value={data.insulation_type || ''}
                onValueChange={(value) => handleInputChange('insulation_type', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select if visible" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Polyisocyanurate">Polyisocyanurate (Polyiso)</SelectItem>
                  <SelectItem value="EPS">EPS (Expanded Polystyrene)</SelectItem>
                  <SelectItem value="XPS">XPS (Extruded Polystyrene)</SelectItem>
                  <SelectItem value="Mineral Wool">Mineral Wool</SelectItem>
                  <SelectItem value="Fiberglass">Fiberglass</SelectItem>
                  <SelectItem value="Unknown">Unable to Determine</SelectItem>
                  <SelectItem value="None Visible">None Visible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="roof-age">Estimated Roof Age (years)</Label>
              <Input
                id="roof-age"
                type="number"
                min="0"
                max="50"
                value={data.roof_age_years || ''}
                onChange={(e) => handleInputChange('roof_age_years', parseInt(e.target.value) || 0)}
                placeholder="Best estimate"
                readOnly={readOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Condition Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Condition Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Condition Rating */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Overall Roof Condition (1-10 Scale)</Label>
              <Badge 
                variant="outline" 
                className={getConditionColor(data.overall_condition || 5)}
              >
                {data.overall_condition || 5}/10 - {getConditionLabel(data.overall_condition || 5)}
              </Badge>
            </div>
            <Slider
              value={[data.overall_condition || 5]}
              onValueChange={(value) => handleInputChange('overall_condition', value[0])}
              min={1}
              max={10}
              step={1}
              disabled={readOnly}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 - Failed</span>
              <span>5 - Fair</span>
              <span>10 - Excellent</span>
            </div>
          </div>

          {/* Membrane Condition */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Membrane Condition (1-10 Scale)</Label>
              <Badge 
                variant="outline" 
                className={getConditionColor(data.existing_membrane_condition || 5)}
              >
                {data.existing_membrane_condition || 5}/10 - {getConditionLabel(data.existing_membrane_condition || 5)}
              </Badge>
            </div>
            <Slider
              value={[data.existing_membrane_condition || 5]}
              onValueChange={(value) => handleInputChange('existing_membrane_condition', value[0])}
              min={1}
              max={10}
              step={1}
              disabled={readOnly}
              className="w-full"
            />
          </div>

          {/* Insulation Condition */}
          <div className="space-y-2">
            <Label htmlFor="insulation-condition">Insulation Condition</Label>
            <Select
              value={data.insulation_condition || ''}
              onValueChange={(value) => handleInputChange('insulation_condition', value)}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Excellent">Excellent - No visible issues</SelectItem>
                <SelectItem value="Good">Good - Minor wear</SelectItem>
                <SelectItem value="Fair">Fair - Some damage visible</SelectItem>
                <SelectItem value="Poor">Poor - Significant damage</SelectItem>
                <SelectItem value="Wet/Damaged">Wet or Severely Damaged</SelectItem>
                <SelectItem value="Unknown">Unable to Assess</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Observations */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Observations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="observations">General Observations</Label>
            <Textarea
              id="observations"
              value={data.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Document overall roof condition, visible damage, wear patterns, etc."
              readOnly={readOnly}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="concerns">Specific Concerns & Issues</Label>
            <Textarea
              id="concerns"
              value={data.concerns || ''}
              onChange={(e) => handleInputChange('concerns', e.target.value)}
              placeholder="List any specific problems: leaks, membrane damage, ponding water, flashing issues, etc."
              readOnly={readOnly}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recommendations">Immediate Recommendations</Label>
            <Textarea
              id="recommendations"
              value={data.recommendations || ''}
              onChange={(e) => handleInputChange('recommendations', e.target.value)}
              placeholder="Any urgent repairs needed before new roof installation, safety concerns, etc."
              readOnly={readOnly}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Alert for critical issues */}
      {(data.overall_condition && data.overall_condition <= 3) && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Condition Detected:</strong> This roof shows signs of significant deterioration. Consider recommending immediate temporary repairs and expedited replacement timeline.
          </AlertDescription>
        </Alert>
      )}

      {/* Guidance note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Assessment Guidelines:</strong><br />
          • Focus on documenting what you can observe without destructive testing<br />
          • Take photos of any damage, wear patterns, or concerning areas<br />
          • Note any safety hazards or immediate repair needs<br />
          • The engineering team will use this data to design the appropriate replacement system
        </p>
      </div>
    </div>
  );
};

export default RoofAssessmentStep;
