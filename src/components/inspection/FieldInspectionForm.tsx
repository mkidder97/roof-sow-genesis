
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, FileText, MapPin, Wind, Calculator } from 'lucide-react';
import { ProjectInfoStep } from './ProjectInfoStep';
import { BuildingDetailsStep } from './BuildingDetailsStep';
import { RoofSystemStep } from './RoofSystemStep';
import { EquipmentStep } from './EquipmentStep';
import { ObservationsStep } from './ObservationsStep';
import { EnhancedASCESelectionPanel } from './EnhancedASCESelectionPanel';
import { useToast } from '@/hooks/use-toast';
import { FieldInspection, ASCERequirements } from '@/types/fieldInspection';

interface FieldInspectionFormProps {
  initialData?: Partial<FieldInspection>;
  onSave: (data: FieldInspection) => void;
  onCancel: () => void;
  isLoading?: boolean;
  currentUserRole?: 'inspector' | 'engineer' | 'admin';
}

export const FieldInspectionForm: React.FC<FieldInspectionFormProps> = ({
  initialData = {},
  onSave,
  onCancel,
  isLoading = false,
  currentUserRole = 'inspector'
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('project-info');
  const [formData, setFormData] = useState<Partial<FieldInspection>>({
    project_name: '',
    project_address: '',
    inspector_name: '',
    status: 'Draft',
    priority_level: 'Standard',
    ...initialData
  });

  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialData) {
      setFormData({ ...formData, ...initialData });
    }
  }, [initialData]);

  const updateFormData = (updates: Partial<FieldInspection>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleASCERequirementsChange = (requirements: ASCERequirements) => {
    updateFormData({ 
      asce_requirements: requirements,
      asce_version: requirements.version,
      wind_speed: requirements.wind_speed,
      exposure_category: requirements.exposure_category,
      building_classification: requirements.building_classification
    });
  };

  const validateStep = (step: string): boolean => {
    switch (step) {
      case 'project-info':
        return !!(formData.project_name && formData.project_address && formData.inspector_name);
      case 'building-details':
        return !!(formData.building_height && formData.square_footage);
      case 'roof-system':
        return !!(formData.deck_type && formData.existing_membrane_type);
      case 'equipment':
        return true; // Optional step
      case 'asce-requirements':
        return !!(formData.asce_requirements?.version && 
                 formData.asce_requirements?.exposure_category && 
                 formData.asce_requirements?.building_classification &&
                 (currentUserRole !== 'engineer' || formData.asce_requirements?.engineer_approved));
      case 'observations':
        return !!(formData.overall_condition && formData.recommendations);
      default:
        return false;
    }
  };

  const updateCompletedSteps = () => {
    const steps = ['project-info', 'building-details', 'roof-system', 'equipment', 'asce-requirements', 'observations'];
    const completed = new Set(steps.filter(validateStep));
    setCompletedSteps(completed);
  };

  useEffect(() => {
    updateCompletedSteps();
  }, [formData, currentUserRole]);

  const handleSave = () => {
    if (!validateStep('project-info')) {
      toast({
        title: 'Missing Required Information',
        description: 'Please complete the project information section.',
        variant: 'destructive'
      });
      setActiveTab('project-info');
      return;
    }

    if (!validateStep('asce-requirements')) {
      toast({
        title: 'ASCE Requirements Incomplete',
        description: currentUserRole === 'engineer' 
          ? 'Please review and approve the ASCE requirements.'
          : 'ASCE requirements need to be completed.',
        variant: 'destructive'
      });
      setActiveTab('asce-requirements');
      return;
    }

    const inspectionData: FieldInspection = {
      id: formData.id || undefined,
      project_name: formData.project_name || '',
      project_address: formData.project_address || '',
      inspector_name: formData.inspector_name || '',
      status: completedSteps.size >= 6 ? 'Completed' : 'Draft',
      priority_level: formData.priority_level || 'Standard',
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      county: formData.county,
      asce_requirements: formData.asce_requirements,
      asce_version: formData.asce_version,
      wind_speed: formData.wind_speed,
      exposure_category: formData.exposure_category,
      building_classification: formData.building_classification,
      ...formData,
      completed: completedSteps.size >= 6,
      updated_at: new Date().toISOString()
    } as FieldInspection;

    onSave(inspectionData);
  };

  const getStepIcon = (step: string) => {
    const isCompleted = completedSteps.has(step);
    
    switch (step) {
      case 'project-info':
        return isCompleted ? <CheckCircle className="w-4 h-4 text-green-500" /> : <MapPin className="w-4 h-4" />;
      case 'building-details':
        return isCompleted ? <CheckCircle className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4" />;
      case 'roof-system':
        return isCompleted ? <CheckCircle className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4" />;
      case 'equipment':
        return isCompleted ? <CheckCircle className="w-4 h-4 text-green-500" /> : <FileText className="w-4 h-4" />;
      case 'asce-requirements':
        return isCompleted ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Wind className="w-4 h-4" />;
      case 'observations':
        return isCompleted ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Calculator className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStepBadge = (step: string) => {
    if (step === 'asce-requirements' && formData.asce_requirements?.engineer_approved) {
      return <Badge variant="secondary" className="text-green-700 ml-2">Engineer Approved</Badge>;
    }
    
    if (step === 'asce-requirements' && currentUserRole === 'engineer' && !formData.asce_requirements?.engineer_approved) {
      return <Badge variant="destructive" className="ml-2">Approval Required</Badge>;
    }
    
    return null;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Field Inspection Form</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {completedSteps.size}/6 Steps Complete
            </Badge>
            {currentUserRole === 'engineer' && (
              <Badge variant="secondary">Engineer Mode</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="project-info" className="flex items-center gap-2">
              {getStepIcon('project-info')}
              <span className="hidden sm:inline">Project Info</span>
            </TabsTrigger>
            <TabsTrigger value="building-details" className="flex items-center gap-2">
              {getStepIcon('building-details')}
              <span className="hidden sm:inline">Building</span>
            </TabsTrigger>
            <TabsTrigger value="roof-system" className="flex items-center gap-2">
              {getStepIcon('roof-system')}
              <span className="hidden sm:inline">Roof System</span>
            </TabsTrigger>
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              {getStepIcon('equipment')}
              <span className="hidden sm:inline">Equipment</span>
            </TabsTrigger>
            <TabsTrigger value="asce-requirements" className="flex items-center gap-2">
              {getStepIcon('asce-requirements')}
              <span className="hidden sm:inline">ASCE</span>
              {getStepBadge('asce-requirements')}
            </TabsTrigger>
            <TabsTrigger value="observations" className="flex items-center gap-2">
              {getStepIcon('observations')}
              <span className="hidden sm:inline">Observations</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="project-info" className="mt-6">
            <ProjectInfoStep
              data={formData}
              onUpdate={updateFormData}
              showLocationFields={true}
            />
          </TabsContent>

          <TabsContent value="building-details" className="mt-6">
            <BuildingDetailsStep
              data={formData}
              onUpdate={updateFormData}
            />
          </TabsContent>

          <TabsContent value="roof-system" className="mt-6">
            <RoofSystemStep
              data={formData}
              onUpdate={updateFormData}
            />
          </TabsContent>

          <TabsContent value="equipment" className="mt-6">
            <EquipmentStep
              data={formData}
              onUpdate={updateFormData}
            />
          </TabsContent>

          <TabsContent value="asce-requirements" className="mt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">ASCE 7 Wind Load Requirements</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {currentUserRole === 'engineer' 
                    ? 'Review and approve the ASCE requirements for this project.'
                    : 'ASCE requirements will be auto-suggested based on project location and require engineer approval.'
                  }
                </p>
              </div>
              
              <EnhancedASCESelectionPanel
                projectLocation={{
                  city: formData.city,
                  state: formData.state,
                  county: formData.county,
                  address: formData.project_address
                }}
                requirements={formData.asce_requirements}
                onRequirementsChange={handleASCERequirementsChange}
                engineerMode={currentUserRole === 'engineer'}
                showAutoSuggest={true}
                readOnly={formData.asce_requirements?.engineer_approved && currentUserRole !== 'engineer'}
              />
            </div>
          </TabsContent>

          <TabsContent value="observations" className="mt-6">
            <ObservationsStep
              data={formData}
              onUpdate={updateFormData}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? 'Saving...' : completedSteps.size >= 6 ? 'Complete Inspection' : 'Save Draft'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
