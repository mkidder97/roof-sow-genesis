import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { FieldInspection } from '@/types/fieldInspection';

interface RoofAssessmentStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const RoofAssessmentStep: React.FC<RoofAssessmentStepProps> = ({ data, onChange, readOnly = false }) => {
  const getConditionLabel = (value: number) => {
    if (value <= 3) return 'Poor';
    if (value <= 6) return 'Fair';
    if (value <= 8) return 'Good';
    return 'Excellent';
  };

  const getConditionColor = (value: number) => {
    if (value <= 3) return 'text-red-400';
    if (value <= 6) return 'text-yellow-400';
    if (value <= 8) return 'text-blue-400';
    return 'text-green-400';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="deck_type" className="text-white">Deck Type *</Label>
          <Select
            value={data.deck_type || ''}
            onValueChange={(value) => onChange({ deck_type: value })}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select deck type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Steel">Steel</SelectItem>
              <SelectItem value="Concrete">Concrete</SelectItem>
              <SelectItem value="Wood">Wood</SelectItem>
              <SelectItem value="Composite">Composite</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="existing_membrane_type" className="text-white">Existing Membrane Type *</Label>
          <Select
            value={data.existing_membrane_type || ''}
            onValueChange={(value) => onChange({ existing_membrane_type: value })}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select membrane type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TPO">TPO</SelectItem>
              <SelectItem value="EPDM">EPDM</SelectItem>
              <SelectItem value="PVC">PVC</SelectItem>
              <SelectItem value="BUR">Built-Up Roof (BUR)</SelectItem>
              <SelectItem value="Modified Bitumen">Modified Bitumen</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-white mb-4 block">
          Existing Membrane Condition: {' '}
          <span className={getConditionColor(data.existing_membrane_condition || 5)}>
            {data.existing_membrane_condition || 5}/10 - {getConditionLabel(data.existing_membrane_condition || 5)}
          </span>
        </Label>
        <Slider
          value={[data.existing_membrane_condition || 5]}
          onValueChange={(value) => onChange({ existing_membrane_condition: value[0] })}
          max={10}
          min={1}
          step={1}
          className="w-full"
          disabled={readOnly}
        />
        <div className="flex justify-between text-sm text-blue-200 mt-2">
          <span>1 - Poor</span>
          <span>5 - Fair</span>
          <span>10 - Excellent</span>
        </div>
      </div>

      <div>
        <Label htmlFor="roof_age_years" className="text-white">Roof Age</Label>
        <Select
          value={data.roof_age_years?.toString() || ''}
          onValueChange={(value) => onChange({ roof_age_years: parseInt(value) })}
          disabled={readOnly}
        >
          <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
            <SelectValue placeholder="Select age range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">0-5 years</SelectItem>
            <SelectItem value="8">5-10 years</SelectItem>
            <SelectItem value="15">10-20 years</SelectItem>
            <SelectItem value="25">20+ years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="insulation_type" className="text-white">Insulation Type</Label>
          <Select
            value={data.insulation_type || ''}
            onValueChange={(value) => onChange({ insulation_type: value })}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select insulation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Polyisocyanurate">Polyisocyanurate (Polyiso)</SelectItem>
              <SelectItem value="EPS">Expanded Polystyrene (EPS)</SelectItem>
              <SelectItem value="XPS">Extruded Polystyrene (XPS)</SelectItem>
              <SelectItem value="Fiberglass">Fiberglass</SelectItem>
              <SelectItem value="None Visible">None Visible</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="insulation_condition" className="text-white">Insulation Condition</Label>
          <Select
            value={data.insulation_condition || ''}
            onValueChange={(value) => onChange({ insulation_condition: value })}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Good">Good</SelectItem>
              <SelectItem value="Fair">Fair</SelectItem>
              <SelectItem value="Poor">Poor</SelectItem>
              <SelectItem value="Unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-yellow-500/20 rounded-lg p-4">
        <p className="text-yellow-200 text-sm">
          <strong>Assessment Tips:</strong><br />
          • Look for signs of damage, wear, or aging<br />
          • Check for proper drainage and ponding water<br />
          • Note any repairs or patches<br />
          • Document membrane condition accurately for SOW generation
        </p>
      </div>
    </div>
  );
};

export default RoofAssessmentStep;
