
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, Clock, Upload, Camera, Save, FileText, Loader2, Ruler, Home, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { FieldInspection } from '@/types/fieldInspection';
import { FieldInspectionErrorBoundary } from './components/FieldInspectionErrorBoundary';

// Import the updated workflow components
import ProjectInfoStep from './form-steps/ProjectInfoStep';
import BuildingDimensionsStep from './form-steps/BuildingDimensionsStep';
import RoofAssessmentStep from './form-steps/RoofAssessmentStep';
import EquipmentInventoryStepV2 from './form-steps/EquipmentInventoryStepV2';
import PhotoDocumentationStep from './form-steps/PhotoDocumentationStep';
import AssessmentNotesStep from './form-steps/AssessmentNotesStep';
import HandoffPreparationPanel from './HandoffPreparationPanel';
import PhotoCaptureSystem from './PhotoCaptureSystem';

interface FieldInspectionFormProps {
  inspectionId?: string;
  onSave?: (data: FieldInspection) => void;
  onComplete?: (data: FieldInspection) => void;
  readOnly?: boolean;
}

export const FieldInspectionForm: React.FC<FieldInspectionFormProps> = ({
  inspectionId,
  onSave,
  onComplete,
  readOnly = false
}) => {
  
  const { toast } = useToast();
  const {
    saveInspection,
    getInspection,
    loading,
    error
  } = useFieldInspections();

  const [formData, setFormData] = useState<Partial<FieldInspection>>({
    project_name: '',
    project_address: '',
    inspector_name: '',
    status: 'Draft',
    priority_level: 'Standard',
    weather_conditions: 'Clear',
    access_method: 'internal_hatch',
    deck_type: '',
    existing_membrane_type: '',
    insulation_type: '',
    roof_slope: '',
    insulation_condition: '',
    existing_membrane_condition: 5,
    roof_age_years: 0,
    building_height: 0,
    building_length: 0,
    building_width: 0,
    square_footage: 0,
    number_of_stories: 1,
    hvac_units: [],
    roof_drains: [],
    penetrations: [],
    skylights: 0,
    roof_hatches: 0,
    overall_condition: 5,
    photos: [],
    completed: false,
    ready_for_handoff: false,
    // Location fields (set by engineer)
    city: '',
    state: '',
    zip_code: '',
    // Enhanced equipment inventory arrays
    equipment_skylights: [],
    equipment_access_points: [],
    equipment_hvac_units: [],
    // New takeoff fields - fix the drainage type to be optional
    drainage_primary_type: undefined, // Changed from empty string to undefined
    drainage_condition: '',
    penetrations_gas_lines: false,
    penetrations_conduit_attached: false,
    curbs_8_inch_or_above: false,
    side_discharge_units: false
  });

  const [activeTab, setActiveTab] = useState('project-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (inspectionId) {
      const fetchInspection = async () => {
        try {
          const inspectionData = await getInspection(inspectionId);
          if (inspectionData) {
            setFormData(inspectionData);
          }
        } catch (err) {
          console.error('Error fetching inspection:', err);
          toast({
            title: "Error Fetching Inspection",
            description: "Failed to retrieve inspection data. Please try again.",
            variant: "destructive",
          });
        }
      };
      fetchInspection();
    }
  }, [inspectionId, getInspection, toast]);

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    switch (activeTab) {
      case 'project-info':
        if (!formData.inspector_name?.trim()) errors.push('Inspector name is required');
        break;
      case 'building-dimensions':
        if (!formData.building_height || formData.building_height <= 0) errors.push('Building height must be greater than 0');
        break;
      case 'roof-assessment':
        if (!formData.deck_type?.trim()) errors.push('Deck type is required');
        if (!formData.existing_membrane_type?.trim()) errors.push('Existing membrane type is required');
        break;
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await saveInspection(formData);

      if (result && onSave) {
        onSave(formData as FieldInspection);
      }

      toast({
        title: "Inspection Saved",
        description: "Your inspection has been saved successfully.",
      });

    } catch (error) {
      console.error('Error saving inspection:', error);
      toast({
        title: "Save Error",
        description: "Failed to save inspection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields before marking as complete.",
        variant: "destructive",
      });
      return;
    }

    const completedData = {
      ...formData,
      completed: true,
      completed_at: new Date().toISOString(),
      status: 'Completed' as const
    };

    setIsSubmitting(true);
    try {
      const result = await saveInspection(completedData);

      if (result && onComplete) {
        onComplete(completedData as FieldInspection);
      }

      toast({
        title: "Inspection Completed",
        description: "Your inspection has been marked as complete and is ready for handoff.",
      });

    } catch (error) {
      console.error('Error completing inspection:', error);
      toast({
        title: "Completion Error",
        description: "Failed to complete inspection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (updates: Partial<FieldInspection>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Helper function for individual field updates
  const updateField = (field: keyof FieldInspection, value: any) => {
    handleInputChange({ [field]: value });
  };

  const tabs = [
    { id: 'project-info', label: 'Project Info', icon: FileText },
    { id: 'building-dimensions', label: 'Dimensions', icon: Ruler },
    { id: 'roof-assessment', label: 'Roof Assessment', icon: Home },
    { id: 'equipment-inventory', label: 'Equipment', icon: Wrench },
    { id: 'photo-documentation', label: 'Photos', icon: Camera },
    { id: 'assessment-notes', label: 'Notes', icon: FileText },
  ];

  const getTabStatus = (tabId: string) => {
    // Enhanced validation logic for tab status
    switch (tabId) {
      case 'project-info':
        return formData.inspector_name ? 'complete' : 'incomplete';
      case 'building-dimensions':
        return formData.building_height && formData.building_height > 0 ? 'complete' : 'incomplete';
      case 'roof-assessment':
        return formData.deck_type && formData.existing_membrane_type ? 'complete' : 'incomplete';
      case 'equipment-inventory':
        return 'optional'; // This is now comprehensive and optional
      default:
        return 'optional';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading inspection...</span>
      </div>
    );
  }

  return (
    <FieldInspectionErrorBoundary>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Field Inspection Form
                  {formData.completed && (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {formData.project_name || 'New Inspection'} - {formData.project_address || 'No address specified'}
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                {!readOnly && !formData.completed && (
                  <>
                    <Button onClick={handleSave} disabled={isSubmitting} variant="outline">
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Draft
                    </Button>
                    
                    <Button onClick={handleComplete} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Complete Inspection
                    </Button>
                  </>
                )}
                
                <Button 
                  onClick={() => setShowPhotoCapture(true)} 
                  variant="outline"
                  disabled={readOnly}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Quick Photo
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Tab Navigation */}
              <div className="border-b bg-gray-50/50 p-4">
                <TabsList className="grid w-full grid-cols-6 h-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const status = getTabStatus(tab.id);
                    
                    return (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-white"
                      >
                        <div className="flex items-center gap-1">
                          <Icon className="h-4 w-4" />
                          {status === 'complete' && (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          )}
                          {status === 'incomplete' && (
                            <AlertTriangle className="h-3 w-3 text-orange-500" />
                          )}
                        </div>
                        <span className="text-xs">{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <TabsContent value="project-info" className="mt-0">
                  <FieldInspectionErrorBoundary>
                    <ProjectInfoStep
                      data={formData}
                      onChange={handleInputChange}
                      readOnly={readOnly}
                    />
                  </FieldInspectionErrorBoundary>
                </TabsContent>

                <TabsContent value="building-dimensions" className="mt-0">
                  <FieldInspectionErrorBoundary>
                    <BuildingDimensionsStep
                      data={formData}
                      onChange={handleInputChange}
                      readOnly={readOnly}
                    />
                  </FieldInspectionErrorBoundary>
                </TabsContent>

                <TabsContent value="roof-assessment" className="mt-0">
                  <FieldInspectionErrorBoundary>
                    <RoofAssessmentStep
                      data={formData}
                      onChange={handleInputChange}
                      readOnly={readOnly}
                    />
                  </FieldInspectionErrorBoundary>
                </TabsContent>

                <TabsContent value="equipment-inventory" className="mt-0">
                  <FieldInspectionErrorBoundary>
                    <EquipmentInventoryStepV2
                      data={formData}
                      onChange={handleInputChange}
                      readOnly={readOnly}
                    />
                  </FieldInspectionErrorBoundary>
                </TabsContent>

                <TabsContent value="photo-documentation" className="mt-0">
                  <FieldInspectionErrorBoundary>
                    <PhotoDocumentationStep
                      data={formData}
                      onChange={handleInputChange}
                      readOnly={readOnly}
                    />
                  </FieldInspectionErrorBoundary>
                </TabsContent>

                <TabsContent value="assessment-notes" className="mt-0">
                  <FieldInspectionErrorBoundary>
                    <AssessmentNotesStep
                      data={formData}
                      onChange={handleInputChange}
                      readOnly={readOnly}
                    />
                  </FieldInspectionErrorBoundary>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Handoff Panel - Only show if inspection is completed */}
        {formData.completed && (
          <FieldInspectionErrorBoundary>
            <HandoffPreparationPanel
              inspectionData={formData as FieldInspection}
            />
          </FieldInspectionErrorBoundary>
        )}

        {/* Photo Capture Modal */}
        {showPhotoCapture && (
          <FieldInspectionErrorBoundary>
            <PhotoCaptureSystem
              onPhotoCapture={(photoUrl) => {
                const currentPhotos = formData.photos || [];
                updateField('photos', [...currentPhotos, photoUrl]);
                setShowPhotoCapture(false);
                toast({
                  title: "Photo Added",
                  description: "Photo has been added to the inspection.",
                });
              }}
              onClose={() => setShowPhotoCapture(false)}
            />
          </FieldInspectionErrorBoundary>
        )}
      </div>
    </FieldInspectionErrorBoundary>
  );
};
