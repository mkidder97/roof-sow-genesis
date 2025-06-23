
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Users, 
  Send, 
  FileText,
  Clock,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ConsultantOption {
  id: string;
  name: string;
  email: string;
  specialties: string[];
  workload: 'light' | 'moderate' | 'heavy';
}

interface HandoffData {
  photos: number;
  checklist_completion: number;
  required_items_complete: boolean;
  measurements_complete: boolean;
  safety_assessment_complete: boolean;
  customer_requirements_documented: boolean;
}

interface HandoffPreparationPanelProps {
  inspectionData: any;
  onHandoffComplete: (consultantId: string, notes: string) => Promise<void>;
  isValid: boolean;
}

const HandoffPreparationPanel: React.FC<HandoffPreparationPanelProps> = ({
  inspectionData,
  onHandoffComplete,
  isValid
}) => {
  const [selectedConsultant, setSelectedConsultant] = useState('');
  const [handoffNotes, setHandoffNotes] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handoffData, setHandoffData] = useState<HandoffData | null>(null);

  // Mock consultant data - in real app, this would come from API
  const consultants: ConsultantOption[] = [
    {
      id: 'consultant-1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      specialties: ['Commercial Roofing', 'TPO Systems', 'Warranty Review'],
      workload: 'light'
    },
    {
      id: 'consultant-2',
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      specialties: ['EPDM Systems', 'Modified Bitumen', 'Green Roofs'],
      workload: 'moderate'
    },
    {
      id: 'consultant-3',
      name: 'Lisa Rodriguez',
      email: 'lisa.rodriguez@company.com',
      specialties: ['Metal Roofing', 'Steep Slope', 'Historic Buildings'],
      workload: 'heavy'
    }
  ];

  // Validate inspection data for handoff readiness
  useEffect(() => {
    const validateData = () => {
      const errors: ValidationError[] = [];
      
      // Check required fields
      if (!inspectionData.project_name) {
        errors.push({
          field: 'project_name',
          message: 'Project name is required',
          severity: 'error'
        });
      }
      
      if (!inspectionData.project_address) {
        errors.push({
          field: 'project_address',
          message: 'Project address is required',
          severity: 'error'
        });
      }
      
      if (!inspectionData.building_height || !inspectionData.square_footage) {
        errors.push({
          field: 'measurements',
          message: 'Building measurements are incomplete',
          severity: 'error'
        });
      }
      
      if (!inspectionData.deck_type) {
        errors.push({
          field: 'deck_type',
          message: 'Deck type must be identified',
          severity: 'error'
        });
      }
      
      if (!inspectionData.overall_condition) {
        errors.push({
          field: 'overall_condition',
          message: 'Overall condition rating is required',
          severity: 'error'
        });
      }
      
      // Check photo documentation
      const photoCount = inspectionData.photos?.length || 0;
      if (photoCount < 3) {
        errors.push({
          field: 'photos',
          message: `At least 3 photos required (${photoCount} provided)`,
          severity: 'error'
        });
      } else if (photoCount < 5) {
        errors.push({
          field: 'photos',
          message: `Recommend 5+ photos for thorough documentation (${photoCount} provided)`,
          severity: 'warning'
        });
      }
      
      // Check safety assessment
      if (!inspectionData.access_method) {
        errors.push({
          field: 'access_method',
          message: 'Access method must be documented for safety',
          severity: 'error'
        });
      }
      
      // Check equipment inventory
      if (!inspectionData.hvac_units || inspectionData.hvac_units.length === 0) {
        errors.push({
          field: 'hvac_units',
          message: 'HVAC equipment inventory appears incomplete',
          severity: 'warning'
        });
      }
      
      setValidationErrors(errors);
      
      // Generate handoff data summary
      setHandoffData({
        photos: photoCount,
        checklist_completion: 85, // This would be calculated from actual checklist
        required_items_complete: errors.filter(e => e.severity === 'error').length === 0,
        measurements_complete: !!(inspectionData.building_height && inspectionData.square_footage),
        safety_assessment_complete: !!inspectionData.access_method,
        customer_requirements_documented: !!inspectionData.customer_name
      });
    };
    
    validateData();
  }, [inspectionData]);

  const getWorkloadColor = (workload: string) => {
    switch (workload) {
      case 'light': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'heavy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleHandoffSubmit = async () => {
    if (!selectedConsultant) {
      toast.error('Please select a consultant for handoff');
      return;
    }
    
    const criticalErrors = validationErrors.filter(e => e.severity === 'error');
    if (criticalErrors.length > 0) {
      toast.error('Cannot handoff with critical validation errors');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onHandoffComplete(selectedConsultant, handoffNotes);
      toast.success('Inspection handed off to consultant successfully');
    } catch (error) {
      toast.error('Failed to complete handoff');
      console.error('Handoff error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAutoNotes = () => {
    const notes = [];
    
    if (inspectionData.project_type) {
      notes.push(`Project Type: ${inspectionData.project_type}`);
    }
    
    if (inspectionData.priority_level && inspectionData.priority_level !== 'Standard') {
      notes.push(`Priority: ${inspectionData.priority_level}`);
    }
    
    if (inspectionData.special_requirements) {
      notes.push(`Special Requirements: ${inspectionData.special_requirements}`);
    }
    
    if (inspectionData.concerns) {
      notes.push(`Inspector Concerns: ${inspectionData.concerns}`);
    }
    
    setHandoffNotes(notes.join('\n\n'));
  };

  return (
    <div className="space-y-6">
      {/* Data Validation Dashboard */}
      <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Data Completeness Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {handoffData && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${handoffData.photos >= 3 ? 'text-green-400' : 'text-red-400'}`}>
                  {handoffData.photos}
                </div>
                <div className="text-blue-200 text-sm">Photos</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${handoffData.checklist_completion >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {handoffData.checklist_completion}%
                </div>
                <div className="text-blue-200 text-sm">Checklist</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${handoffData.required_items_complete ? 'text-green-400' : 'text-red-400'}`}>
                  {handoffData.required_items_complete ? 'Complete' : 'Missing'}
                </div>
                <div className="text-blue-200 text-sm">Required Items</div>
              </div>
            </div>
          )}
          
          {/* Validation Status Indicators */}
          <div className="space-y-2">
            {[
              { key: 'measurements_complete', label: 'Building Measurements', icon: MapPin },
              { key: 'safety_assessment_complete', label: 'Safety Assessment', icon: AlertTriangle },
              { key: 'customer_requirements_documented', label: 'Customer Information', icon: Users }
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center gap-3 p-2 bg-white/5 rounded">
                <Icon className="w-4 h-4 text-blue-400" />
                <span className="text-white flex-1">{label}</span>
                {handoffData?.[key as keyof HandoffData] ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <X className="w-5 h-5 text-red-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Validation Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <Alert 
                  key={index}
                  className={`${
                    error.severity === 'error' 
                      ? 'bg-red-500/20 border-red-400/50' 
                      : 'bg-yellow-500/20 border-yellow-400/50'
                  }`}
                >
                  <AlertTriangle className={`h-4 w-4 ${
                    error.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                  }`} />
                  <AlertDescription className={`${
                    error.severity === 'error' ? 'text-red-200' : 'text-yellow-200'
                  }`}>
                    <strong>{error.field}:</strong> {error.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consultant Assignment */}
      <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Consultant Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-blue-200 text-sm font-medium mb-2 block">
              Select Consultant
            </label>
            <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
              <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
                <SelectValue placeholder="Choose consultant for this project" />
              </SelectTrigger>
              <SelectContent>
                {consultants.map((consultant) => (
                  <SelectItem key={consultant.id} value={consultant.id}>
                    <div className="flex items-center gap-2">
                      <span>{consultant.name}</span>
                      <Badge className={`${getWorkloadColor(consultant.workload)} text-white text-xs`}>
                        {consultant.workload}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedConsultant && (
            <div className="bg-white/5 rounded-lg p-3">
              {(() => {
                const consultant = consultants.find(c => c.id === selectedConsultant);
                return consultant ? (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium">{consultant.name}</span>
                      <Badge className={`${getWorkloadColor(consultant.workload)} text-white text-xs`}>
                        {consultant.workload} workload
                      </Badge>
                    </div>
                    <div className="text-blue-200 text-sm mb-2">{consultant.email}</div>
                    <div className="flex flex-wrap gap-1">
                      {consultant.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline" className="border-blue-400 text-blue-200 text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Handoff Notes */}
      <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white">Handoff Notes & Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={generateAutoNotes}
              variant="outline"
              className="border-blue-400 text-blue-200 hover:bg-blue-600"
              size="sm"
            >
              Auto-Generate Notes
            </Button>
          </div>
          
          <Textarea
            value={handoffNotes}
            onChange={(e) => setHandoffNotes(e.target.value)}
            placeholder="Add specific instructions, concerns, or priorities for the consultant..."
            className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200 min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Handoff Action */}
      <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {validationErrors.filter(e => e.severity === 'error').length > 0 ? (
              <Alert className="bg-red-500/20 border-red-400/50">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  Cannot complete handoff with critical validation errors. Please resolve all error-level issues first.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-green-500/20 border-green-400/50">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200">
                  Inspection data is ready for handoff to consultant.
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={handleHandoffSubmit}
              disabled={
                isSubmitting || 
                !selectedConsultant || 
                validationErrors.filter(e => e.severity === 'error').length > 0
              }
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg h-auto"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Completing Handoff...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Complete Handoff to Consultant
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HandoffPreparationPanel;
