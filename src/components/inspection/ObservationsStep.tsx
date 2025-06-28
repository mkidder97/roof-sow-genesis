
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FileText } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface ObservationsStepProps {
  data: Partial<FieldInspection>;
  onUpdate: (updates: Partial<FieldInspection>) => void;
}

export const ObservationsStep: React.FC<ObservationsStepProps> = ({
  data,
  onUpdate
}) => {
  const handleInputChange = (field: keyof FieldInspection, value: string | number) => {
    onUpdate({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Observations & Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="overall-condition">Overall Condition (1-10)</Label>
          <Input
            id="overall-condition"
            type="number"
            min="1"
            max="10"
            value={data.overall_condition || ''}
            onChange={(e) => handleInputChange('overall_condition', parseInt(e.target.value) || 5)}
            placeholder="Rate overall condition"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">General Notes</Label>
          <Textarea
            id="notes"
            value={data.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Enter general observations and notes..."
            rows={3}
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
          />
        </div>
      </CardContent>
    </Card>
  );
};
