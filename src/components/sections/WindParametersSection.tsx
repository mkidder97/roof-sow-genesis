
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wind } from 'lucide-react';
import type { WindParameters } from '@/types/sow';

interface WindParametersSectionProps {
  data: WindParameters;
  onChange: (data: Partial<WindParameters>) => void;
}

export const WindParametersSection: React.FC<WindParametersSectionProps> = ({ data, onChange }) => {
  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border-l-4 border-l-cyan-500">
      <CardHeader className="bg-gradient-to-r from-cyan-500/20 to-sky-500/20 border-b border-cyan-500/30">
        <CardTitle className="flex items-center gap-3 text-cyan-100 text-lg">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Wind className="h-5 w-5 text-cyan-400" />
          </div>
          Wind Parameters (Optional Override)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label htmlFor="basicWindSpeed" className="text-sm font-medium text-slate-700">
            Basic Wind Speed (mph)
          </Label>
          <Input
            id="basicWindSpeed"
            type="number"
            value={data.basicWindSpeed || ''}
            onChange={(e) => onChange({ basicWindSpeed: Number(e.target.value) })}
            placeholder="Leave blank for auto-calculation"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Design Pressures (Optional Override)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="zone1" className="text-sm text-slate-600">
                Zone 1 (psf)
              </Label>
              <Input
                id="zone1"
                type="number"
                value={data.designPressures.zone1 || ''}
                onChange={(e) => onChange({ 
                  designPressures: { 
                    ...data.designPressures, 
                    zone1: Number(e.target.value) 
                  } 
                })}
                placeholder="Auto-calculated"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="zone2" className="text-sm text-slate-600">
                Zone 2 (psf)
              </Label>
              <Input
                id="zone2"
                type="number"
                value={data.designPressures.zone2 || ''}
                onChange={(e) => onChange({ 
                  designPressures: { 
                    ...data.designPressures, 
                    zone2: Number(e.target.value) 
                  } 
                })}
                placeholder="Auto-calculated"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="zone3" className="text-sm text-slate-600">
                Zone 3 (psf)
              </Label>
              <Input
                id="zone3"
                type="number"
                value={data.designPressures.zone3 || ''}
                onChange={(e) => onChange({ 
                  designPressures: { 
                    ...data.designPressures, 
                    zone3: Number(e.target.value) 
                  } 
                })}
                placeholder="Auto-calculated"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
