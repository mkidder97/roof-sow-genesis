
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldInspection } from '@/types/fieldInspection';

interface AssessmentNotesStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
}

const AssessmentNotesStep: React.FC<AssessmentNotesStepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Overall Condition Rating */}
      <Card className="bg-white/10 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white">Overall Condition Rating *</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={data.overall_condition?.toString() || ''}
            onValueChange={(value) => onChange({ overall_condition: parseInt(value) })}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select overall condition (1-10)" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <SelectItem key={rating} value={rating.toString()}>
                  {rating} - {rating <= 3 ? 'Poor' : rating <= 6 ? 'Fair' : rating <= 8 ? 'Good' : 'Excellent'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Priority Level */}
      <Card className="bg-white/10 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white">Priority Level</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={data.priority_level || 'Standard'}
            onValueChange={(value) => onChange({ priority_level: value as any })}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Expedited">Expedited</SelectItem>
              <SelectItem value="Emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* General Notes */}
      <Card className="bg-white/10 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white">General Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.notes || ''}
            onChange={(e) => onChange({ notes: e.target.value })}
            className="bg-white/20 border-blue-400/30 text-white min-h-[120px]"
            placeholder="Add any additional observations, concerns, or recommendations..."
          />
        </CardContent>
      </Card>

      <div className="bg-green-500/20 rounded-lg p-4">
        <p className="text-green-200 text-sm">
          <strong>Final Step:</strong> Review all information and click "Complete Inspection" to finalize your field assessment.
        </p>
      </div>
    </div>
  );
};

export default AssessmentNotesStep;
