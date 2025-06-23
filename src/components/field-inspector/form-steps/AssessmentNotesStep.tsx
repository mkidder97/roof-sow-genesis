
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { FieldInspection } from '@/types/fieldInspection';

interface AssessmentNotesStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
}

const AssessmentNotesStep: React.FC<AssessmentNotesStepProps> = ({ data, onChange }) => {
  const getConditionLabel = (value: number) => {
    if (value <= 2) return 'Critical';
    if (value <= 4) return 'Poor';
    if (value <= 6) return 'Fair';
    if (value <= 8) return 'Good';
    return 'Excellent';
  };

  const getConditionColor = (value: number) => {
    if (value <= 2) return 'text-red-500';
    if (value <= 4) return 'text-red-400';
    if (value <= 6) return 'text-yellow-400';
    if (value <= 8) return 'text-blue-400';
    return 'text-green-400';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency': return 'border-red-500 bg-red-500/10';
      case 'Expedited': return 'border-orange-500 bg-orange-500/10';
      case 'Standard': return 'border-green-500 bg-green-500/10';
      default: return 'border-blue-500 bg-blue-500/10';
    }
  };

  const getPriorityDescription = (priority: string) => {
    switch (priority) {
      case 'Emergency': return 'Immediate action required - safety concerns or severe damage';
      case 'Expedited': return 'Priority scheduling - significant issues that need prompt attention';
      case 'Standard': return 'Normal processing - routine maintenance or replacement';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Condition Rating */}
      <div>
        <Label className="text-white mb-4 block">
          Overall Roof Condition: {' '}
          <span className={getConditionColor(data.overall_condition || 5)}>
            {data.overall_condition || 5}/10 - {getConditionLabel(data.overall_condition || 5)}
          </span>
        </Label>
        <Slider
          value={[data.overall_condition || 5]}
          onValueChange={(value) => onChange({ overall_condition: value[0] })}
          max={10}
          min={1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-blue-200 mt-2">
          <span>1 - Critical</span>
          <span>5 - Fair</span>
          <span>10 - Excellent</span>
        </div>
      </div>

      {/* Priority Level */}
      <div>
        <Label htmlFor="priority_level" className="text-white">Priority Level *</Label>
        <Select
          value={data.priority_level || 'Standard'}
          onValueChange={(value: 'Standard' | 'Expedited' | 'Emergency') => onChange({ priority_level: value })}
        >
          <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
            <SelectValue placeholder="Select priority level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Standard">Standard</SelectItem>
            <SelectItem value="Expedited">Expedited</SelectItem>
            <SelectItem value="Emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
        {data.priority_level && (
          <div className={`mt-2 p-3 rounded-lg border ${getPriorityColor(data.priority_level)}`}>
            <p className="text-sm text-white">
              <strong>{data.priority_level}:</strong> {getPriorityDescription(data.priority_level)}
            </p>
          </div>
        )}
      </div>

      {/* Weather Conditions */}
      <div>
        <Label htmlFor="weather_conditions" className="text-white">Weather Conditions *</Label>
        <Select
          value={data.weather_conditions || ''}
          onValueChange={(value) => onChange({ weather_conditions: value })}
        >
          <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
            <SelectValue placeholder="Select weather conditions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Clear">Clear</SelectItem>
            <SelectItem value="Partly Cloudy">Partly Cloudy</SelectItem>
            <SelectItem value="Cloudy">Cloudy</SelectItem>
            <SelectItem value="Light Rain">Light Rain</SelectItem>
            <SelectItem value="Heavy Rain">Heavy Rain</SelectItem>
            <SelectItem value="Windy">Windy</SelectItem>
            <SelectItem value="Snow">Snow</SelectItem>
            <SelectItem value="Extreme Weather">Extreme Weather</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Special Requirements */}
      <div>
        <Label htmlFor="special_requirements" className="text-white">Special Requirements</Label>
        <Textarea
          id="special_requirements"
          value={data.special_requirements || ''}
          onChange={(e) => onChange({ special_requirements: e.target.value })}
          className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
          placeholder="Any special requirements, unique conditions, or specific customer requests..."
          rows={4}
        />
      </div>

      {/* Additional Notes */}
      <div>
        <Label htmlFor="notes" className="text-white">Additional Notes</Label>
        <Textarea
          id="notes"
          value={data.notes || ''}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
          placeholder="Any additional observations, concerns, or recommendations..."
          rows={6}
        />
      </div>

      {/* Inspection Summary */}
      <div className="bg-blue-500/20 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-3">Inspection Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-200">Project:</span>
            <div className="text-white">{data.project_name || 'Not specified'}</div>
          </div>
          <div>
            <span className="text-blue-200">Square Footage:</span>
            <div className="text-white">{data.square_footage?.toLocaleString() || 'Not specified'} sq ft</div>
          </div>
          <div>
            <span className="text-blue-200">Roof Type:</span>
            <div className="text-white">{data.existing_membrane_type || 'Not specified'}</div>
          </div>
          <div>
            <span className="text-blue-200">Overall Condition:</span>
            <div className={getConditionColor(data.overall_condition || 5)}>
              {getConditionLabel(data.overall_condition || 5)} ({data.overall_condition || 5}/10)
            </div>
          </div>
          <div>
            <span className="text-blue-200">Priority:</span>
            <div className="text-white">{data.priority_level || 'Standard'}</div>
          </div>
          <div>
            <span className="text-blue-200">Photos:</span>
            <div className="text-white">{data.photos?.length || 0} uploaded</div>
          </div>
        </div>
      </div>

      {/* Final Instructions */}
      <div className="bg-green-500/20 rounded-lg p-4">
        <p className="text-green-200 text-sm">
          <strong>Ready to Complete:</strong><br />
          • Review all information for accuracy<br />
          • Ensure all required photos are uploaded<br />
          • Double-check priority level and special requirements<br />
          • Click "Complete Inspection" to finish and notify the engineering team
        </p>
      </div>
    </div>
  );
};

export default AssessmentNotesStep;
