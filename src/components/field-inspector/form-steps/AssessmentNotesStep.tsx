
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface AssessmentNotesStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const AssessmentNotesStep: React.FC<AssessmentNotesStepProps> = ({
  data,
  onChange,
  readOnly = false
}) => {
  const handleInputChange = (field: keyof FieldInspection, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Assessment Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">General Notes</Label>
          <Textarea
            id="notes"
            value={data.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Enter general observations and notes..."
            rows={3}
            readOnly={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recommendations">Recommendations</Label>
          <Textarea
            id="recommendations"
            value={data.recommendations || ''}
            onChange={(e) => handleInputChange('recommendations', e.target.value)}
            placeholder="Enter recommendations for repairs or improvements..."
            rows={3}
            readOnly={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="concerns">Concerns</Label>
          <Textarea
            id="concerns"
            value={data.concerns || ''}
            onChange={(e) => handleInputChange('concerns', e.target.value)}
            placeholder="Enter any concerns or issues found..."
            rows={3}
            readOnly={readOnly}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AssessmentNotesStep;
