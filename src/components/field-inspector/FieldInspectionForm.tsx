
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, Save, Check, Loader2, AlertTriangle } from 'lucide-react';
import { FieldInspection, InspectionFormStep } from '@/types/fieldInspection';
import { toast } from 'sonner';

// Import step components
import ProjectInfoStep from './form-steps/ProjectInfoStep';
import BuildingSpecsStep from './form-steps/BuildingSpecsStep';
import EquipmentInventoryStep from './form-steps/EquipmentInventoryStep';
import PhotoDocumentationStep from './form-steps/PhotoDocumentationStep';
import AssessmentNotesStep from './form-steps/AssessmentNotesStep';

const FieldInspectionForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { createInspection, updateInspection } = useFieldInspections();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveLoading, setAutoSaveLoading] = useState(false);
  
  const [formData, setFormData] = useState<Partial<FieldInsp ction>>({
    inspector_name: user?.user_metadata?.full_name || user?.email || '',
    inspection_date: new Date().toISOString().split('T')[0],
    priority_level: 'Standard',
    status: 'Draft',
    number_of_stories: 1,
    skylights: 0,
    hvac_units: [],
    roof_drains: [],
    penetrations: [],
    photos: [],
    drainage_options: [],
    interior_protection_needed: false,
    interior_protection_sqft: 0,
    conduit_attached: false,
    upgraded_lighting: false,
    interior_fall_protection: false,
    access_method: 'internal_hatch',
  });

  const steps: InspectionFormStep[] = [
    { id: 0, title: 'Project Info', description: 'Basic project details', completed: false },
    { id: 1, title: 'Building Specs', description: 'Building dimensions and roof assembly', completed: false },
    { id: 2, title: 'Equipment', description: 'Inventory and features', completed: false },
    { id: 3, title: 'Photos', description: 'Visual documentation', completed: false },
    { id: 4, title: 'Assessment', description: 'Final notes and rating', completed: false },
  ];

  // Auto-save functionality
  useEffect(() => {
    if (!id || !formData.project_name) return;
    
    const autoSave = async () => {
      try {
        setAutoSaveLoading(true);
        await updateInspection(id, formData);
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setAutoSaveLoading(false);
      }
    };

    const timer = setTimeout(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearTimeout(timer);
  }, [formData, id, updateInspection]);

  const updateFormData = (updates: Partial<FieldInspection>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0: // Project Info
        return !!(formData.project_name && formData.project_address);
      case 1: // Building Specs
        return !!(formData.building_height && formData.square_footage && formData.deck_type);
      case 2: // Equipment
        return true; // Optional step
      case 3: // Photos
        return true; // Optional step
      case 4: // Assessment
        return !!(formData.overall_condition && formData.access_method);
      default:
        return true;
    }
  };

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.project_name) errors.push('Project name is required');
    if (!formData.project_address) errors.push('Project address is required');
    if (!formData.building_height) errors.push('Building height is required');
    if (!formData.square_footage) errors.push('Square footage is required');
    if (!formData.deck_type) errors.push('Deck type is required');
    if (!formData.overall_condition) errors.push('Overall condition rating is required');
    if (!formData.access_method) errors.push('Access method is required');
    
    return errors;
  };

  const isReadyToComplete = (): boolean => {
    return getValidationErrors().length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast.error('Please fill in all required fields before continuing');
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsLoading(true);
      if (id) {
        await updateInspection(id, formData);
        toast.success('Draft saved successfully');
      } else {
        const newInspection = await createInspection(formData);
        navigate(`/field-inspection/${newInspection.id}/edit`);
        toast.success('Draft saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save draft');
      console.error('Save draft error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    console.log('Complete inspection clicked');
    console.log('Validation errors:', getValidationErrors());
    console.log('Form data:', formData);
    
    if (!isReadyToComplete()) {
      toast.error('Please complete all required fields before finishing');
      return;
    }

    try {
      setIsLoading(true);
      const completedData = {
        ...formData,
        status: 'Completed' as const,
        completed_at: new Date().toISOString(),
      };

      console.log('Attempting to save completed inspection:', completedData);

      if (id) {
        await updateInspection(id, completedData);
      } else {
        await createInspection(completedData);
      }
      
      toast.success('Inspection completed successfully');
      navigate('/field-inspector');
    } catch (error) {
      toast.error('Failed to complete inspection');
      console.error('Complete inspection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <ProjectInfoStep data={formData} onChange={updateFormData} />;
      case 1:
        return <BuildingSpecsStep data={formData} onChange={updateFormData} />;
      case 2:
        return <EquipmentInventoryStep data={formData} onChange={updateFormData} />;
      case 3:
        return <PhotoDocumentationStep data={formData} onChange={updateFormData} />;
      case 4:
        return <AssessmentNotesStep data={formData} onChange={updateFormData} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const validationErrors = getValidationErrors();
  const readyToComplete = isReadyToComplete();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/field-inspector')}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          {autoSaveLoading && (
            <div className="flex items-center text-blue-200 text-sm">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Auto-saving...
            </div>
          )}
        </div>

        {/* Progress */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">
                {steps[currentStep].title}
              </h2>
              <span className="text-blue-200">
                {currentStep + 1} of {steps.length}
              </span>
            </div>
            <Progress value={progress} className="mb-2" />
            <p className="text-blue-200 text-sm">{steps[currentStep].description}</p>
          </CardContent>
        </Card>

        {/* Validation Warnings */}
        {currentStep === steps.length - 1 && !readyToComplete && (
          <Alert className="mb-6 bg-orange-500/20 border-orange-400/30">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <AlertDescription className="text-orange-200">
              <strong>Missing Required Information:</strong>
              <ul className="mt-2 list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Ready to Complete Alert */}
        {currentStep === steps.length - 1 && readyToComplete && (
          <Alert className="mb-6 bg-green-500/20 border-green-400/30">
            <Check className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-200">
              <strong>Ready to Complete:</strong> All required information has been provided. You can now complete the inspection.
            </AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 mb-6">
          <CardContent className="p-6">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="border-blue-400 text-blue-200 hover:bg-blue-800"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < steps.length - 1 && (
              <Button
                onClick={handleNext}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isLoading}
              className="border-yellow-400 text-yellow-200 hover:bg-yellow-800/20"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Draft
            </Button>
            
            <Button
              onClick={handleComplete}
              disabled={isLoading || !readyToComplete}
              className={readyToComplete 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-gray-600 cursor-not-allowed opacity-50"
              }
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Complete Inspection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldInspectionForm;
