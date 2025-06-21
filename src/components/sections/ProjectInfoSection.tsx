
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProjectInfoProps {
  data: {
    projectName: string;
    address: string;
    companyName: string;
  };
  onChange: (updates: Partial<ProjectInfoProps['data']>) => void;
}

export const ProjectInfoSection: React.FC<ProjectInfoProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="projectName" className="text-sm font-medium text-slate-700">
            Project Name *
          </Label>
          <Input
            id="projectName"
            value={data.projectName}
            onChange={(e) => onChange({ projectName: e.target.value })}
            placeholder="Enter project name"
            className="mt-1"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
            Company Name
          </Label>
          <Input
            id="companyName"
            value={data.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            placeholder="Enter company name"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address" className="text-sm font-medium text-slate-700">
          Project Address *
        </Label>
        <Input
          id="address"
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Enter complete project address"
          className="mt-1"
          required
        />
      </div>
    </div>
  );
};
