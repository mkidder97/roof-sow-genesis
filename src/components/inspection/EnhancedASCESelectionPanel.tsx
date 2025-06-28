import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, Clock, Info, Lightbulb, RefreshCw, MapPin } from 'lucide-react';
import { useASCEConfig, ASCERequirements, formatASCERequirements } from '@/hooks/useASCEConfig';
import { useASCEAutoSuggest, ProjectLocation, formatSuggestionSummary, suggestionToRequirements } from '@/hooks/useASCEAutoSuggest';

interface EnhancedASCESelectionPanelProps {
  requirements?: ASCERequirements | null;
  onRequirementsChange?: (requirements: ASCERequirements) => void;
  projectLocation?: ProjectLocation;
  readOnly?: boolean;
  engineerMode?: boolean;
  showAutoSuggest?: boolean;
}

export const EnhancedASCESelectionPanel: React.FC<EnhancedASCESelectionPanelProps> = ({
  requirements: externalRequirements,
  onRequirementsChange,
  projectLocation,
  readOnly = false,
  engineerMode = false,
  showAutoSuggest = true
}) => {
  const {
    config,
    selectedRequirements,
    updateRequirements,
    resetToDefaults,
    validateRequirements,
    getImportanceFactorForClass,
    isHVHZLocation,
    requiresEngineerApproval
  } = useASCEConfig();

  const {
    suggestion,
    isLoading: isSuggestionLoading,
    error: suggestionError,
    refreshSuggestion
  } = useASCEAutoSuggest(projectLocation || {});

  // Track whether we're using suggested vs manual values
  const [usingSuggestion, setUsingSuggestion] = useState(false);
  const [suggestionApplied, setSuggestionApplied] = useState(false);

  // Use external requirements if provided, otherwise use internal state
  const currentRequirements = externalRequirements || selectedRequirements;
  
  const handleRequirementsChange = (updates: Partial<ASCERequirements>) => {
    const newRequirements = { ...currentRequirements, ...updates } as ASCERequirements;
    
    // Mark as manual override if changing from suggestion
    if (usingSuggestion && !updates.notes?.includes('Auto-suggested')) {
      newRequirements.notes = (newRequirements.notes || '').replace(/Auto-suggested.*?\)/, '').trim() + ' (Manual override)';
      setUsingSuggestion(false);
    }
    
    if (onRequirementsChange) {
      onRequirementsChange(newRequirements);
    } else {
      updateRequirements(updates);
    }
  };

  const applySuggestion = () => {
    if (!suggestion) return;

    const suggestedRequirements = suggestionToRequirements(suggestion.suggestion, {
      source: suggestion.source,
      confidence: suggestion.confidence,
      confidence_score: suggestion.confidence_score
    });

    handleRequirementsChange(suggestedRequirements);
    setUsingSuggestion(true);
    setSuggestionApplied(true);
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

  // Auto-apply suggestion on first load if none exists
  useEffect(() => {
    if (suggestion && !currentRequirements?.version && !suggestionApplied && showAutoSuggest) {
      applySuggestion();
    }
  }, [suggestion, currentRequirements, suggestionApplied, showAutoSuggest]);

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

  const confidenceColor = suggestion?.confidence === 'high' ? 'text-green-600' : 
                         suggestion?.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      {/* Auto-Suggestion Panel */}
      {showAutoSuggest && projectLocation?.state && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Lightbulb className="w-5 h-5" />
              Smart ASCE Suggestion
              {isSuggestionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            </CardTitle>
            <CardDescription className="text-blue-700">
              Based on project location: {projectLocation.city ? `${projectLocation.city}, ` : ''}{projectLocation.state}
              {projectLocation.county ? ` (${projectLocation.county} County)` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestionError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Error generating suggestion: {suggestionError}
                </AlertDescription>
              </Alert>
            ) : suggestion ? (
              <div className="space-y-3">
                {/* Suggestion Summary */}
                <div className="p-3 bg-white rounded-md border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-gray-900">Suggested Requirements:</div>
                    <Badge variant={suggestion.confidence === 'high' ? 'default' : 
                                  suggestion.confidence === 'medium' ? 'secondary' : 'destructive'}>
                      {suggestion.confidence} confidence ({suggestion.confidence_score}%)
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {formatSuggestionSummary(suggestion)}
                  </div>
                  
                  {/* Reasoning */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-700">Reasoning:</div>
                    {suggestion.reasoning.map((reason, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Notes */}
                {suggestion.special_notes && suggestion.special_notes.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Special Requirements:</div>
                      <ul className="list-disc list-inside mt-1 text-sm">
                        {suggestion.special_notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {!usingSuggestion && (
                    <Button onClick={applySuggestion} className="bg-blue-600 hover:bg-blue-700">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Apply Suggestion
                    </Button>
                  )}
                  <Button variant="outline" onClick={refreshSuggestion}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {usingSuggestion && (
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-4 h-4" />
                    Using suggested values - modify below to override
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                Enter project location to get ASCE suggestions
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Main ASCE Selection Panel */}
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
            {usingSuggestion && (
              <Badge variant="outline" className="text-blue-700">
                <Lightbulb className="w-3 h-3 mr-1" />
                Auto-Suggested
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {usingSuggestion 
              ? 'Review and confirm the auto-suggested requirements below, or modify as needed.'
              : 'Manual ASCE 7 requirements selection - engineer confirmation required.'
            }
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
                        {suggestion?.suggestion.version === version.version && (
                          <Badge variant="secondary" className="text-blue-700">Suggested</Badge>
                        )}
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
                        <div className="font-medium flex items-center gap-2">
                          Category {category.category}
                          {suggestion?.suggestion.exposure_category === category.category && (
                            <Badge variant="secondary" className="text-blue-700 text-xs">Suggested</Badge>
                          )}
                        </div>
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
                        <div className="font-medium flex items-center gap-2">
                          Class {classification.class}
                          {classification.isDefault && <Badge variant="outline">Default</Badge>}
                          {suggestion?.suggestion.building_classification === classification.class && (
                            <Badge variant="secondary" className="text-blue-700 text-xs">Suggested</Badge>
                          )}
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
              <Label htmlFor="wind-speed" className="flex items-center gap-2">
                Design Wind Speed (mph)
                {suggestion?.suggestion.wind_speed === currentRequirements.wind_speed && (
                  <Badge variant="secondary" className="text-blue-700 text-xs">Suggested</Badge>
                )}
              </Label>
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
            <div className="text-sm font-medium text-gray-700 mb-1">Current Requirements:</div>
            <div className="text-sm text-gray-600">
              {formatASCERequirements(currentRequirements)}
              {usingSuggestion && <span className="text-blue-600 ml-2">(Auto-suggested)</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Selection Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {suggestion && (
            <div>
              <div className="font-medium">Auto-Suggestion Confidence:</div>
              <div className={`${confidenceColor} flex items-center gap-2`}>
                {suggestion.confidence} ({suggestion.confidence_score}%)
                <Badge variant="outline">{suggestion.source}</Badge>
              </div>
            </div>
          )}
          
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

          {requiresEngineerApproval && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Engineer Approval Required:</strong> All ASCE requirements must be reviewed and approved by a licensed engineer.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedASCESelectionPanel;
