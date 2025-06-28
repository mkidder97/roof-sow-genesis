
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FieldInspection } from '@/types/fieldInspection';

interface ProjectInfoStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const ProjectInfoStep: React.FC<ProjectInfoStepProps> = ({
  data,
  onChange,
  readOnly = false
}) => {
  const handleInputChange = (field: keyof FieldInspection, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Notice about pre-filled information */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Inspector Workflow:</strong> Project details, customer information, and technical requirements are configured by the engineering team. You'll focus on documenting existing roof conditions and equipment.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Project Information (Read-Only)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={data.project_name || ''}
                placeholder="Set by engineer"
                readOnly={true}
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inspector-name">Inspector Name *</Label>
              <Input
                id="inspector-name"
                value={data.inspector_name || ''}
                onChange={(e) => handleInputChange('inspector_name', e.target.value)}
                placeholder="Enter your name"
                readOnly={readOnly}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-address">Project Address</Label>
            <Input
              id="project-address"
              value={data.project_address || ''}
              placeholder="Set by engineer"
              readOnly={true}
              className="bg-gray-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={data.city || ''}
                placeholder="Set by engineer"
                readOnly={true}
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={data.state || ''}
                placeholder="Set by engineer"
                readOnly={true}
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zip-code">Zip Code</Label>
              <Input
                id="zip-code"
                value={data.zip_code || ''}
                placeholder="Set by engineer"
                readOnly={true}
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspection-specific information */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspection-date">Inspection Date</Label>
              <Input
                id="inspection-date"
                type="date"
                value={data.inspection_date || ''}
                onChange={(e) => handleInputChange('inspection_date', e.target.value)}
                readOnly={readOnly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weather-conditions">Weather Conditions</Label>
              <Select
                value={data.weather_conditions || ''}
                onValueChange={(value) => handleInputChange('weather_conditions', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select conditions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clear">Clear</SelectItem>
                  <SelectItem value="Partly Cloudy">Partly Cloudy</SelectItem>
                  <SelectItem value="Overcast">Overcast</SelectItem>
                  <SelectItem value="Light Rain">Light Rain</SelectItem>
                  <SelectItem value="Heavy Rain">Heavy Rain</SelectItem>
                  <SelectItem value="Snow">Snow</SelectItem>
                  <SelectItem value="High Winds">High Winds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="access-method">Access Method</Label>
              <Select
                value={data.access_method || ''}
                onValueChange={(value) => handleInputChange('access_method', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal_hatch">Internal Hatch</SelectItem>
                  <SelectItem value="external_ladder">External Ladder</SelectItem>
                  <SelectItem value="extension_ladder">Extension Ladder</SelectItem>
                  <SelectItem value="scissor_lift">Scissor Lift</SelectItem>
                  <SelectItem value="boom_lift">Boom Lift</SelectItem>
                  <SelectItem value="stairs">Stairs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority-level">Priority Level</Label>
              <Select
                value={data.priority_level || 'Standard'}
                onValueChange={(value) => handleInputChange('priority_level', value as 'Standard' | 'Expedited' | 'Emergency')}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Expedited">Expedited</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special-requirements">Special Requirements / Notes</Label>
            <Input
              id="special-requirements"
              value={data.special_requirements || ''}
              onChange={(e) => handleInputChange('special_requirements', e.target.value)}
              placeholder="Any special requirements for this inspection"
              readOnly={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Information note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Customer information, ASCE 7 requirements, and county details are managed by the engineering team in their workflow. Your focus is on documenting the existing roof conditions, equipment, and preparing accurate field data for SOW generation.
        </p>
      </div>
    </div>
  );
};

export default ProjectInfoStep;
