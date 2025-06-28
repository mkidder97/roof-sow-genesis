
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
import { FieldInspection } from '@/types/fieldInspection';

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
  inspectionData: FieldInspection;
  onHandoffComplete?: () => void;
  isValid?: boolean;
}

const HandoffPreparationPanel: React.FC<HandoffPreparationPanelProps> = ({
  inspectionData,
  onHandoffComplete,
  isValid = true
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
      name: 'John Smith',
      email: 'john@company.com',
      specialties: ['TPO', 'EPDM'],
      workload: 'light'
    },
    {
      id: 'consultant-2',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      specialties: ['PVC', 'Metal'],
      workload: 'moderate'
    }
  ];

  useEffect(() => {
    // Calculate handoff readiness
    const photos = inspectionData.photos?.length || 0;
    const hasRequiredFields = !!(inspectionData.project_name && inspectionData.project_address);
    const hasMeasurements = !!(inspectionData.square_footage && inspectionData.building_height);
    
    setHandoffData({
      photos,
      checklist_completion: hasRequiredFields ? 100 : 50,
      required_items_complete: hasRequiredFields,
      measurements_complete: hasMeasurements,
      safety_assessment_complete: !!inspectionData.overall_condition,
      customer_requirements_documented: !!inspectionData.notes
    });
  }, [inspectionData]);

  const handleHandoff = async () => {
    if (!selectedConsultant) {
      toast.error('Please select a consultant for handoff');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate handoff process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Inspection handed off successfully!');
      onHandoffComplete?.();
    } catch (error) {
      toast.error('Handoff failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!handoffData) {
    return <div>Loading handoff data...</div>;
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-green-400/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          Handoff Preparation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Readiness Checklist */}
        <div className="space-y-3">
          <h3 className="text-white font-medium">Inspection Readiness</h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-blue-200">Photos Captured</span>
              <div className="flex items-center gap-2">
                <span className="text-white">{handoffData.photos}</span>
                {handoffData.photos >= 4 ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-blue-200">Required Fields</span>
              {handoffData.required_items_complete ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <X className="w-4 h-4 text-red-400" />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-blue-200">Measurements</span>
              {handoffData.measurements_complete ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <X className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Consultant Selection */}
        <div>
          <label className="text-white font-medium mb-2 block">
            Select Consultant for Handoff
          </label>
          <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
            <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
              <SelectValue placeholder="Choose consultant..." />
            </SelectTrigger>
            <SelectContent>
              {consultants.map((consultant) => (
                <SelectItem key={consultant.id} value={consultant.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{consultant.name}</span>
                    <Badge variant={consultant.workload === 'light' ? 'default' : 'secondary'}>
                      {consultant.workload}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Handoff Notes */}
        <div>
          <label className="text-white font-medium mb-2 block">
            Handoff Notes
          </label>
          <Textarea
            value={handoffNotes}
            onChange={(e) => setHandoffNotes(e.target.value)}
            placeholder="Add any special instructions or notes for the consultant..."
            className="bg-white/20 border-blue-400/30 text-white"
            rows={3}
          />
        </div>

        {/* Handoff Button */}
        <Button
          onClick={handleHandoff}
          disabled={isSubmitting || !selectedConsultant || !isValid}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Processing Handoff...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Complete Handoff
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default HandoffPreparationPanel;
