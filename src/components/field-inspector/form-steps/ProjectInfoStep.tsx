
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FieldInspection } from '@/types/fieldInspection';

interface ProjectInfoStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const ProjectInfoStep: React.FC<ProjectInfoStepProps> = ({ data, onChange, readOnly = false }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="inspector_name" className="text-white">Field Inspector *</Label>
          <Select 
            value={data.inspector_name || 'Michael Kidder'} 
            onValueChange={(value) => onChange({ inspector_name: value })}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select inspector" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-blue-400/30">
              <SelectItem value="Michael Kidder" className="text-white hover:bg-blue-600/20">Michael Kidder</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="inspection_date" className="text-white">Inspection Date *</Label>
          <Input
            id="inspection_date"
            type="date"
            value={data.inspection_date || ''}
            onChange={(e) => onChange({ inspection_date: e.target.value })}
            className="bg-white/20 border-blue-400/30 text-white"
            disabled={readOnly}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="project_name" className="text-white">Building Name *</Label>
        <Input
          id="project_name"
          value={data.project_name || ''}
          onChange={(e) => onChange({ project_name: e.target.value })}
          className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
          placeholder="Enter building name (e.g., Main Street Office Building)"
          disabled={readOnly}
          required
        />
      </div>

      <div>
        <Label htmlFor="project_address" className="text-white">Building Address *</Label>
        <Textarea
          id="project_address"
          value={data.project_address || ''}
          onChange={(e) => onChange({ project_address: e.target.value })}
          className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
          placeholder="Enter complete building address including city, state, zip"
          rows={3}
          disabled={readOnly}
          required
        />
      </div>

      <div className="bg-blue-500/20 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>Field Inspector Instructions:</strong><br />
          Focus on building details and roof conditions. Customer information will be added later by office staff when preparing the SOW.
        </p>
      </div>
    </div>
  );
};

export default ProjectInfoStep;
