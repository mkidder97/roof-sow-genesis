
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Project Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Project Name *</Label>
              <Input
                id="project-name"
                value={data.project_name || ''}
                onChange={(e) => handleInputChange('project_name', e.target.value)}
                placeholder="Enter project name"
                readOnly={readOnly}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inspector-name">Inspector Name *</Label>
              <Input
                id="inspector-name"
                value={data.inspector_name || ''}
                onChange={(e) => handleInputChange('inspector_name', e.target.value)}
                placeholder="Enter inspector name"
                readOnly={readOnly}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-address">Project Address *</Label>
            <Input
              id="project-address"
              value={data.project_address || ''}
              onChange={(e) => handleInputChange('project_address', e.target.value)}
              placeholder="Enter full project address"
              readOnly={readOnly}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={data.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="City"
                readOnly={readOnly}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Select
                value={data.state || ''}
                onValueChange={(value) => handleInputChange('state', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FL">Florida</SelectItem>
                  <SelectItem value="TX">Texas</SelectItem>
                  <SelectItem value="CA">California</SelectItem>
                  <SelectItem value="NY">New York</SelectItem>
                  <SelectItem value="GA">Georgia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zip-code">Zip Code *</Label>
              <Input
                id="zip-code"
                value={data.zip_code || ''}
                onChange={(e) => handleInputChange('zip_code', e.target.value)}
                placeholder="Zip code"
                readOnly={readOnly}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                value={data.county || ''}
                onChange={(e) => handleInputChange('county', e.target.value)}
                placeholder="County"
                readOnly={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input
                id="customer-name"
                value={data.customer_name || ''}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                placeholder="Customer name"
                readOnly={readOnly}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Customer Phone</Label>
              <Input
                id="customer-phone"
                value={data.customer_phone || ''}
                onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                placeholder="Customer phone"
                readOnly={readOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ASCE Requirements Card */}
      <Card>
        <CardHeader>
          <CardTitle>ASCE 7 Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wind-speed">Wind Speed (mph) *</Label>
              <Input
                id="wind-speed"
                type="number"
                value={data.wind_speed || ''}
                onChange={(e) => handleInputChange('wind_speed', parseFloat(e.target.value) || 0)}
                placeholder="Wind speed"
                readOnly={readOnly}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="exposure-category">Exposure Category *</Label>
              <Select
                value={data.exposure_category || ''}
                onValueChange={(value) => handleInputChange('exposure_category', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exposure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B">Exposure B</SelectItem>
                  <SelectItem value="C">Exposure C</SelectItem>
                  <SelectItem value="D">Exposure D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="building-classification">Building Classification *</Label>
              <Select
                value={data.building_classification || ''}
                onValueChange={(value) => handleInputChange('building_classification', value)}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="I">Class I</SelectItem>
                  <SelectItem value="II">Class II</SelectItem>
                  <SelectItem value="III">Class III</SelectItem>
                  <SelectItem value="IV">Class IV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectInfoStep;
