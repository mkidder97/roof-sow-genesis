
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator } from 'lucide-react';
import type { Takeoff } from '@/types/sow';

interface TakeoffSectionProps {
  data: Takeoff;
  onChange: (data: Partial<Takeoff>) => void;
}

export const TakeoffSection: React.FC<TakeoffSectionProps> = ({ data, onChange }) => {
  return (
    <Card className="border-l-4 border-l-teal-500">
      <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100">
        <CardTitle className="flex items-center gap-2 text-teal-800">
          <Calculator className="h-5 w-5" />
          Takeoff Checklist
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="drains" className="text-sm font-medium text-slate-700">
              Drains
            </Label>
            <Input
              id="drains"
              type="number"
              value={data.drains || ''}
              onChange={(e) => onChange({ drains: Number(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="pipePenetrations" className="text-sm font-medium text-slate-700">
              Pipe Penetrations
            </Label>
            <Input
              id="pipePenetrations"
              type="number"
              value={data.pipePenetrations || ''}
              onChange={(e) => onChange({ pipePenetrations: Number(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="curbs" className="text-sm font-medium text-slate-700">
              Curbs
            </Label>
            <Input
              id="curbs"
              type="number"
              value={data.curbs || ''}
              onChange={(e) => onChange({ curbs: Number(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="hvacUnits" className="text-sm font-medium text-slate-700">
              HVAC Units
            </Label>
            <Input
              id="hvacUnits"
              type="number"
              value={data.hvacUnits || ''}
              onChange={(e) => onChange({ hvacUnits: Number(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="skylights" className="text-sm font-medium text-slate-700">
              Skylights
            </Label>
            <Input
              id="skylights"
              type="number"
              value={data.skylights || ''}
              onChange={(e) => onChange({ skylights: Number(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="scuppers" className="text-sm font-medium text-slate-700">
              Scuppers
            </Label>
            <Input
              id="scuppers"
              type="number"
              value={data.scuppers || ''}
              onChange={(e) => onChange({ scuppers: Number(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="expansionJoints"
            checked={data.expansionJoints}
            onCheckedChange={(checked) => onChange({ expansionJoints: checked as boolean })}
          />
          <Label htmlFor="expansionJoints" className="text-sm font-medium text-slate-700">
            Expansion Joints Present
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};
