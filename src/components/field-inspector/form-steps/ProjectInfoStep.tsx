
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

      {/* New Address Components */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city" className="text-white">City *</Label>
          <Input
            id="city"
            value={data.city || ''}
            onChange={(e) => onChange({ city: e.target.value })}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="City"
            disabled={readOnly}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="state" className="text-white">State *</Label>
          <Select 
            value={data.state || ''} 
            onValueChange={(value) => onChange({ state: value })}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-blue-400/30">
              <SelectItem value="FL" className="text-white hover:bg-blue-600/20">Florida</SelectItem>
              <SelectItem value="AL" className="text-white hover:bg-blue-600/20">Alabama</SelectItem>
              <SelectItem value="GA" className="text-white hover:bg-blue-600/20">Georgia</SelectItem>
              <SelectItem value="SC" className="text-white hover:bg-blue-600/20">South Carolina</SelectItem>
              <SelectItem value="NC" className="text-white hover:bg-blue-600/20">North Carolina</SelectItem>
              <SelectItem value="TX" className="text-white hover:bg-blue-600/20">Texas</SelectItem>
              <SelectItem value="LA" className="text-white hover:bg-blue-600/20">Louisiana</SelectItem>
              <SelectItem value="MS" className="text-white hover:bg-blue-600/20">Mississippi</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="zip_code" className="text-white">Zip Code *</Label>
          <Input
            id="zip_code"
            value={data.zip_code || ''}
            onChange={(e) => onChange({ zip_code: e.target.value })}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="00000"
            disabled={readOnly}
            required
          />
        </div>
      </div>

      {/* Wind and Building Classification */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="wind_speed" className="text-white">Design Wind Speed (mph) *</Label>
          <Input
            id="wind_speed"
            type="number"
            value={data.wind_speed || ''}
            onChange={(e) => onChange({ wind_speed: parseInt(e.target.value) || 0 })}
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
            placeholder="140"
            disabled={readOnly}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="exposure_category" className="text-white">Exposure Category *</Label>
          <Select 
            value={data.exposure_category || ''} 
            onValueChange={(value) => onChange({ exposure_category: value })}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select exposure" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-blue-400/30">
              <SelectItem value="B" className="text-white hover:bg-blue-600/20">B - Urban/Suburban</SelectItem>
              <SelectItem value="C" className="text-white hover:bg-blue-600/20">C - Open Terrain</SelectItem>
              <SelectItem value="D" className="text-white hover:bg-blue-600/20">D - Flat/Unobstructed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="building_classification" className="text-white">Building Classification *</Label>
          <Select 
            value={data.building_classification || ''} 
            onValueChange={(value) => onChange({ building_classification: value })}
            disabled={readOnly}
          >
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Select classification" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-blue-400/30">
              <SelectItem value="I" className="text-white hover:bg-blue-600/20">I - Low Hazard</SelectItem>
              <SelectItem value="II" className="text-white hover:bg-blue-600/20">II - Standard</SelectItem>
              <SelectItem value="III" className="text-white hover:bg-blue-600/20">III - Substantial Hazard</SelectItem>
              <SelectItem value="IV" className="text-white hover:bg-blue-600/20">IV - Essential Facilities</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-blue-500/20 rounded-lg p-4">
        <p className="text-blue-200 text-sm">
          <strong>Field Inspector Instructions:</strong><br />
          Complete all required fields including address components and wind data. This information is essential for SOW generation and must be accurate for proper engineering calculations.
        </p>
      </div>
    </div>
  );
};

export default ProjectInfoStep;
