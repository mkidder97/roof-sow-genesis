
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Layers } from 'lucide-react';
import type { Insulation } from '@/types/sow';

interface InsulationSectionProps {
  data: Insulation;
  onChange: (data: Partial<Insulation>) => void;
}

export const InsulationSection: React.FC<InsulationSectionProps> = ({ data, onChange }) => {
  return (
    <Card className="border-l-4 border-l-indigo-500">
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
        <CardTitle className="flex items-center gap-2 text-indigo-800">
          <Layers className="h-5 w-5" />
          Insulation & Coverboard
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Insulation Type
            </Label>
            <Select value={data.type} onValueChange={(value) => onChange({ type: value as any })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Polyiso">Polyiso</SelectItem>
                <SelectItem value="EPS">EPS</SelectItem>
                <SelectItem value="HD Composite">HD Composite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="rValue" className="text-sm font-medium text-slate-700">
              R-Value Target
            </Label>
            <Input
              id="rValue"
              type="number"
              step="0.1"
              value={data.rValue || ''}
              onChange={(e) => onChange({ rValue: Number(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="coverboardRequired"
            checked={data.coverboardRequired}
            onCheckedChange={(checked) => onChange({ coverboardRequired: checked as boolean })}
          />
          <Label htmlFor="coverboardRequired" className="text-sm font-medium text-slate-700">
            Coverboard Required
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};
