
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Clock, Info } from 'lucide-react';
import { useASCEConfig, ASCERequirements, formatASCERequirements } from '@/hooks/useASCEConfig';

interface ASCESelectionPanelProps {
  requirements?: ASCERequirements | null;
  onRequirementsChange?: (requirements: ASCERequirements) => void;
  readOnly?: boolean;
  engineerMode?: boolean;
  projectLocation?: {
    city?: string;
    state?: string;
    county?: string;
  };
}

export const ASCESelectionPanel: React.FC<ASCESelectionPanelProps> = ({
  requirements: externalRequirements,
  onRequirementsChange,
  readOnly = false,
  engineerMode = false,
  projectLocation
}) => {
  const {
    config,
    selectedRequirements,
    updateRequirements,
    resetToDefaults,
    validateRequirements,
    getImportanceFactorForClass,
    isHVHZLocation,
    getRecommendedASCEVersion,
    requiresEngineerApproval
  } = useASCEConfig();

  // Use external requirements if provided, otherwise use internal state
  const currentRequirements = externalRequirements || selectedRequirements;
  
  const handleRequirementsChange = (updates: Partial<ASCERequirements>) => {
    const newRequirements = { ...currentRequirements, ...updates } as ASCERequirements;
    
    if (onRequirementsChange) {
      onRequirementsChange(newRequirements);
    } else {
      updateRequirements(updates);
    }
  };

  const handleEngineerApproval = () => {
    if (!currentRequirements || !engineerMode) return;

    const approval = {
      engineer_approved: true,
      approval_date: new Date().toISOString(),
      approval_engineer: 'Current Engineer' // In real app, get from auth context
    };

    handleRequirementsChange(approval);
  };

  const validation = currentRequirements ? validateRequirements(currentRequirements) : { isValid: false, errors: [] };
  const isHVHZ = projectLocation ? isHVHZLocation(projectLocation.state || '', projectLocation.county) : false;
  const recommendedVersion = getRecommendedASCEVersion(projectLocation);

  if (!currentRequirements) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ASCE 7 Requirements</CardTitle>
          <CardDescription>Loading configuration...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ASCE 7 Wind Load Requirements
            {currentRequirements.engineer_approved ? (
              <Badge variant="secondary" className="text-green-700">
                <CheckCircle className="w-3 h-3 mr-1" />
                Engineer Approved
              </Badge>
            ) : requiresEngineerApproval ? (
              <Badge variant="destructive">
                <Clock className="w-3 h-3 mr-1" />
                Approval Required
              </Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            Select appropriate ASCE 7 standards for wind load calculations.
            {config.manualOverride.enabled && (
              <span className="text-orange-600 ml-2">
                Manual selection required - API not available
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ASCE Version Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asce-version">ASCE 7 Version</Label>
              <Select
                value={currentRequirements.version}
                onValueChange={(value) => handleRequirementsChange({ version: value })}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ASCE version" />
                </SelectTrigger>
                <SelectContent>
                  {config.versions.filter(v => v.isActive).map((version) => (
                    <SelectItem key={version.version} value={version.version}>
                      <div className="flex items-center gap-2">
                        {version.version}
                        {version.isDefault && <Badge variant="outline">Default</Badge>}
                        {version.version === recommendedVersion && <Badge variant="secondary">Recommended</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exposure-category">Exposure Category</Label>
              <Select
                value={currentRequirements.exposure_category}
                onValueChange={(value) => handleRequirementsChange({ exposure_category: value })}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exposure category" />
                </SelectTrigger>
                <SelectContent>
                  {config.exposureCategories.map((category) => (
                    <SelectItem key={category.category} value={category.category}>
                      <div>
                        <div className="font-medium">Category {category.category}</div>
                        <div className="text-sm text-gray-500">{category.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Building Classification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="building-classification">Building Classification</Label>
              <Select
                value={currentRequirements.building_classification}
                onValueChange={(value) => handleRequirementsChange({ building_classification: value })}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select building class" />
                </SelectTrigger>
                <SelectContent>
                  {config.buildingClassifications.map((classification) => (
                    <SelectItem key={classification.class} value={classification.class}>
                      <div>
                        <div className="font-medium">
                          Class {classification.class}
                          {classification.isDefault && <Badge variant="outline" className="ml-2">Default</Badge>}
                        </div>
                        <div className="text-sm text-gray-500">I = {classification.importance_factor}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="importance-factor">Importance Factor (I)</Label>
              <Input
                value={currentRequirements.importance_factor}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* Wind Speed Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wind-speed">Design Wind Speed (mph)</Label>
              <Input
                type="number"
                value={currentRequirements.wind_speed || ''}
                onChange={(e) => handleRequirementsChange({ wind_speed: parseFloat(e.target.value) || undefined })}
                placeholder="Enter wind speed"
                disabled={readOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk-category">Risk Category</Label>
              <Input
                value={currentRequirements.risk_category}
                readOnly
                className="bg-gray-50"
              />
            </div>
          </div>

          {/* HVHZ Detection */}
          {isHVHZ && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Project location is in a High-Velocity Hurricane Zone (HVHZ). 
                Special requirements apply including enhanced testing and impact resistance.
              </AlertDescription>
            </Alert>
          )}

          {/* Engineer Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Engineer Notes</Label>
            <textarea
              className="w-full p-2 border rounded-md"
              rows={3}
              value={currentRequirements.notes || ''}
              onChange={(e) => handleRequirementsChange({ notes: e.target.value })}
              placeholder="Additional notes or justification for ASCE requirements..."
              disabled={readOnly}
            />
          </div>

          {/* Validation Errors */}
          {!validation.isValid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Validation Errors:</div>
                <ul className="list-disc list-inside mt-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {!readOnly && (
            <div className="flex gap-2 pt-4">
              {engineerMode && requiresEngineerApproval && !currentRequirements.engineer_approved && validation.isValid && (
                <Button onClick={handleEngineerApproval} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Requirements
                </Button>
              )}
              
              <Button variant="outline" onClick={resetToDefaults}>
                Reset to Defaults
              </Button>
            </div>
          )}

          {/* Requirements Summary */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm font-medium text-gray-700 mb-1">Requirements Summary:</div>
            <div className="text-sm text-gray-600">
              {formatASCERequirements(currentRequirements)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            ASCE 7 Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="font-medium">Current Selection:</div>
            <div className="text-gray-600">
              {config.versions.find(v => v.version === currentRequirements.version)?.description || 'No version selected'}
            </div>
          </div>
          
          <div>
            <div className="font-medium">Exposure Category {currentRequirements.exposure_category}:</div>
            <div className="text-gray-600">
              {config.exposureCategories.find(c => c.category === currentRequirements.exposure_category)?.description || 'No category selected'}
            </div>
          </div>
          
          <div>
            <div className="font-medium">Building Class {currentRequirements.building_classification}:</div>
            <div className="text-gray-600">
              {config.buildingClassifications.find(c => c.class === currentRequirements.building_classification)?.description || 'No classification selected'}
            </div>
          </div>

          {config.manualOverride.enabled && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Manual Override Active:</strong> {config.manualOverride.reason}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ASCESelectionPanel;
