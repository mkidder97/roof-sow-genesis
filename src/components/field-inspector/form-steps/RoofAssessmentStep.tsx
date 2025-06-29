import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, AlertTriangle, Eye, Layers } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';
import RoofAssemblyEditor from '../components/RoofAssemblyEditor';

interface RoofLayer {
  id: string;
  type: 'membrane' | 'insulation' | 'deck' | 'barrier' | 'coverboard';
  description: string;
  attachment: 'mechanically_attached' | 'adhered' | 'ballasted' | 'welded';
  thickness: string;
  material?: string;
}

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
  // Initialize default layers based on existing data
  const [roofLayers, setRoofLayers] = useState<RoofLayer[]>(() => {
    // If we have roof_assembly_layers from the data, use those
    if (data.roof_assembly_layers && Array.isArray(data.roof_assembly_layers)) {
      return data.roof_assembly_layers;
    }

    // Otherwise, create default layers based on existing fields
    const defaultLayers: RoofLayer[] = [];
    
    if (data.existing_membrane_type) {
      defaultLayers.push({
        id: 'membrane_1',
        type: 'membrane',
        description: data.existing_membrane_type,
        attachment: 'mechanically_attached',
        thickness: '60 mil'
      });
    }

    if (data.insulation_type) {
      defaultLayers.push({
        id: 'insulation_1',
        type: 'insulation',
        description: data.insulation_type,
        attachment: 'mechanically_attached',
        thickness: '3.5"'
      });
    }

    if (data.deck_type) {
      defaultLayers.push({
        id: 'deck_1',
        type: 'deck',
        description: data.deck_type,
        attachment: 'mechanically_attached',
        thickness: '20 gauge'
      });
    }

    return defaultLayers.length > 0 ? defaultLayers : [
      {
        id: 'membrane_default',
        type: 'membrane',
        description: 'TPO',
        attachment: 'mechanically_attached',
        thickness: '60 mil'
      },
      {
        id: 'insulation_default',
        type: 'insulation',
        description: 'ENERGY 3 ISO',
        attachment: 'mechanically_attached',
        thickness: '3.5"'
      },
      {
        id: 'deck_default',
        type: 'deck',
        description: 'Steel',
        attachment: 'mechanically_attached',
        thickness: '20 gauge'
      }
    ];
  });

  const [isRecover, setIsRecover] = useState(data.project_type === 'recover' || false);

  useEffect(() => {
    // Update the main form data when roof layers change
    onChange({
      roof_assembly_layers: roofLayers,
      project_type: isRecover ? 'recover' : 'tearoff',
      // Update legacy fields for backward compatibility
      deck_type: roofLayers.find(layer => layer.type === 'deck')?.description || '',
      existing_membrane_type: roofLayers.find(layer => layer.type === 'membrane')?.description || '',
      insulation_type: roofLayers.find(layer => layer.type === 'insulation')?.description || ''
    });
  }, [roofLayers, isRecover, onChange]);

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
          <strong>Inspection Focus:</strong> Document existing roof conditions, materials, and any visible issues. Configure the roof assembly layers to match what you observe in the field.
        </AlertDescription>
      </Alert>

      {/* Dynamic Roof Assembly Editor */}
      <RoofAssemblyEditor
        layers={roofLayers}
        onLayersChange={setRoofLayers}
        isRecover={isRecover}
        onRecoverChange={setIsRecover}
        recoverType={data.recover_type}
        onRecoverTypeChange={(type) => handleInputChange('recover_type', type)}
        yearInstalled={data.roof_age_years}
        onYearInstalledChange={(year) => handleInputChange('roof_age_years', year)}
        originalType={data.original_membrane_type}
        onOriginalTypeChange={(type) => handleInputChange('original_membrane_type', type)}
        readOnly={readOnly}
      />

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
          <strong>Assembly Configuration Guidelines:</strong><br />
          • Drag and drop layers to reorder them from top to bottom<br />
          • Add multiple insulation layers as needed for accurate representation<br />
          • Document attachment methods for each layer<br />
          • Configure recover settings if applicable to the project<br />
          • The engineering team will use this detailed assembly data for design calculations
        </p>
      </div>
    </div>
  );
};

export default RoofAssessmentStep;
