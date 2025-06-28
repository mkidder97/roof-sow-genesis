
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, User, Building } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface ProjectInfoStepProps {
  data: Partial<FieldInspection>;
  onUpdate: (updates: Partial<FieldInspection>) => void;
  showLocationFields?: boolean;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export const ProjectInfoStep: React.FC<ProjectInfoStepProps> = ({
  data,
  onUpdate,
  showLocationFields = true
}) => {
  const handleInputChange = (field: keyof FieldInspection, value: string | number) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Basic Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
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
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priority-level">Priority Level</Label>
              <Select
                value={data.priority_level || 'Standard'}
                onValueChange={(value) => handleInputChange('priority_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority level" />
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
            <Label htmlFor="project-address">Project Address *</Label>
            <Input
              id="project-address"
              value={data.project_address || ''}
              onChange={(e) => handleInputChange('project_address', e.target.value)}
              placeholder="Enter complete project address"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Details for ASCE Suggestions */}
      {showLocationFields && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location Details
              <span className="text-sm font-normal text-gray-600">(for ASCE auto-suggestions)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={data.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select
                  value={data.state || ''}
                  onValueChange={(value) => handleInputChange('state', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zip-code">ZIP Code</Label>
                <Input
                  id="zip-code"
                  value={data.zip_code || ''}
                  onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  placeholder="Enter ZIP code"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="county">County (optional)</Label>
              <Input
                id="county"
                value={data.county || ''}
                onChange={(e) => handleInputChange('county', e.target.value)}
                placeholder="Enter county name (helps with precise ASCE suggestions)"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inspector Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Inspector Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inspector-name">Inspector Name *</Label>
              <Input
                id="inspector-name"
                value={data.inspector_name || ''}
                onChange={(e) => handleInputChange('inspector_name', e.target.value)}
                placeholder="Enter inspector name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inspection-date">Inspection Date</Label>
              <Input
                id="inspection-date"
                type="date"
                value={data.inspection_date ? new Date(data.inspection_date).toISOString().split('T')[0] : ''}
                onChange={(e) => handleInputChange('inspection_date', e.target.value)}
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
                placeholder="Enter customer name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Customer Phone</Label>
              <Input
                id="customer-phone"
                value={data.customer_phone || ''}
                onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                placeholder="Enter customer phone"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
