
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FieldInspection } from '@/types/fieldInspection';

interface ProjectInfoStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
}

const ProjectInfoStep: React.FC<ProjectInfoStepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="inspector_name" className="text-white">Inspector Name *</Label>
          <Input
            id="inspector_name"
            value={data.inspector_name || ''}
            onChange={(e) => onChange({ inspector_name: e.target.value })}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="Your name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="inspection_date" className="text-white">Inspection Date *</Label>
          <Input
            id="inspection_date"
            type="date"
            value={data.inspection_date || ''}
            onChange={(e) => onChange({ inspection_date: e.target.value })}
            className="bg-white/20 border-blue-400/30 text-white"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="project_name" className="text-white">Project Name/ID *</Label>
        <Input
          id="project_name"
          value={data.project_name || ''}
          onChange={(e) => onChange({ project_name: e.target.value })}
          className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
          placeholder="Enter project name or ID"
          required
        />
      </div>

      <div>
        <Label htmlFor="project_address" className="text-white">Project Address *</Label>
        <Textarea
          id="project_address"
          value={data.project_address || ''}
          onChange={(e) => onChange({ project_address: e.target.value })}
          className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
          placeholder="Enter complete project address"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customer_name" className="text-white">Customer Name</Label>
          <Input
            id="customer_name"
            value={data.customer_name || ''}
            onChange={(e) => onChange({ customer_name: e.target.value })}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="Customer or contact name"
          />
        </div>
        
        <div>
          <Label htmlFor="customer_phone" className="text-white">Customer Phone</Label>
          <Input
            id="customer_phone"
            type="tel"
            value={data.customer_phone || ''}
            onChange={(e) => onChange({ customer_phone: e.target.value })}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      <div className="bg-blue-500/20 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>Required fields are marked with *</strong><br />
          Make sure to enter accurate project information as this will be used to generate the final SOW document.
        </p>
      </div>
    </div>
  );
};

export default ProjectInfoStep;
