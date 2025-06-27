
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldInspection } from '@/types/fieldInspection';

interface EquipmentInventoryStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const EquipmentInventoryStep: React.FC<EquipmentInventoryStepProps> = ({ data, onChange, readOnly = false }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/10 border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">HVAC Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-blue-200">Number of HVAC Units</Label>
                <Input
                  type="number"
                  value={data.hvac_units?.length || 0}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 0;
                    const units = Array.from({ length: count }, (_, i) => ({
                      type: 'Standard',
                      count: 1,
                      condition: 'Good'
                    }));
                    onChange({ hvac_units: units });
                  }}
                  className="bg-white/20 border-blue-400/30 text-white"
                  disabled={readOnly}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">Skylights</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-blue-200">Number of Skylights</Label>
              <Input
                type="number"
                value={data.skylights || 0}
                onChange={(e) => onChange({ skylights: parseInt(e.target.value) || 0 })}
                className="bg-white/20 border-blue-400/30 text-white"
                disabled={readOnly}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white/10 border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">Roof Drains</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-blue-200">Number of Roof Drains</Label>
              <Input
                type="number"
                value={data.roof_drains?.length || 0}
                onChange={(e) => {
                  const count = parseInt(e.target.value) || 0;
                  const drains = Array.from({ length: count }, (_, i) => ({
                    type: 'Standard',
                    count: 1,
                    condition: 'Good'
                  }));
                  onChange({ roof_drains: drains });
                }}
                className="bg-white/20 border-blue-400/30 text-white"
                disabled={readOnly}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">Roof Hatches</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-blue-200">Number of Roof Hatches</Label>
              <Input
                type="number"
                value={data.roof_hatches || 0}
                onChange={(e) => onChange({ roof_hatches: parseInt(e.target.value) || 0 })}
                className="bg-white/20 border-blue-400/30 text-white"
                disabled={readOnly}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/10 border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white">Penetrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label className="text-blue-200">Number of Penetrations</Label>
            <Input
              type="number"
              value={data.penetrations?.length || 0}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 0;
                const penetrations = Array.from({ length: count }, (_, i) => ({
                  type: 'Pipe',
                  count: 1
                }));
                onChange({ penetrations });
              }}
              className="bg-white/20 border-blue-400/30 text-white"
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-500/20 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>Equipment Documentation:</strong><br />
          • Count all visible equipment on the roof<br />
          • Note the condition of each item<br />
          • Include any special requirements or modifications needed<br />
          • This information helps determine SOW complexity and material requirements
        </p>
      </div>
    </div>
  );
};

export default EquipmentInventoryStep;
