
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, MapPin, Calendar, User, AlertTriangle, CheckCircle, Wind } from 'lucide-react';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { useSOWGeneration } from '@/hooks/useSOWGeneration';
import { FieldInspection, convertRowToInspection } from '@/types/fieldInspection';
import { SOWGenerationRequest, transformInspectionToSOWRequest } from '@/types/sow';
import { generateASCERequirementsSummary } from '@/hooks/useASCEConfig';
import { LoadingState } from '../ui/loading-state';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface AvailableInspectionsProps {
  onViewDetails?: (inspection: FieldInspection) => void;
  onEdit?: (inspection: FieldInspection) => void;
  limit?: number;
}

export const AvailableInspections: React.FC<AvailableInspectionsProps> = ({
  onViewDetails,
  onEdit,
  limit = 10
}) => {
  const { data: inspections, isLoading, error, refetch } = useFieldInspections();
  const { generateSOW, isGenerating, generationError } = useSOWGeneration();
  const [generatingSOWForId, setGeneratingSOWForId] = useState<string | null>(null);

  const handleGenerateSOW = async (inspection: FieldInspection) => {
    if (!inspection.id) return;

    setGeneratingSOWForId(inspection.id);

    try {
      // Transform inspection data to SOW request format
      const sowRequest: SOWGenerationRequest = transformInspectionToSOWRequest(inspection);

      // Enhanced SOW request with ASCE requirements
      const enhancedSOWRequest: SOWGenerationRequest = {
        ...sowRequest,
        // Include location data for jurisdiction analysis
        city: inspection.city,
        state: inspection.state,
        county: inspection.county,
        // Include complete ASCE requirements
        asceRequirements: inspection.asce_requirements,
        asceVersion: inspection.asce_version,
        windSpeed: inspection.wind_speed,
        exposureCategory: inspection.exposure_category,
        buildingClassification: inspection.building_classification,
        // Add engineering notes
        engineeringNotes: inspection.asce_requirements ? 
          generateASCERequirementsSummary(inspection.asce_requirements) : undefined
      };

      await generateSOW(enhancedSOWRequest);
      
      // Refresh inspections to update SOW status
      refetch();
    } catch (error) {
      console.error('SOW generation failed:', error);
    } finally {
      setGeneratingSOWForId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'under review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'expedited':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getASCEStatus = (inspection: FieldInspection) => {
    if (inspection.asce_requirements?.engineer_approved) {
      return { icon: CheckCircle, text: 'Engineer Approved', color: 'text-green-600' };
    } else if (inspection.asce_requirements) {
      return { icon: AlertTriangle, text: 'Approval Required', color: 'text-yellow-600' };
    } else {
      return { icon: Wind, text: 'ASCE Pending', color: 'text-gray-500' };
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading inspections..." />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading inspections: {error.message}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const displayInspections = inspections?.slice(0, limit) || [];

  if (displayInspections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Inspections</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No inspections available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {displayInspections.map((inspectionRow) => {
        const inspection = convertRowToInspection(inspectionRow);
        const asceStatus = getASCEStatus(inspection);
        const AsceIcon = asceStatus.icon;

        return (
          <Card key={inspection.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{inspection.project_name}</h3>
                    <Badge className={getStatusColor(inspection.status || 'Draft')}>
                      {inspection.status || 'Draft'}
                    </Badge>
                    {inspection.priority_level !== 'Standard' && (
                      <Badge className={getPriorityColor(inspection.priority_level || 'Standard')}>
                        {inspection.priority_level}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {inspection.project_address}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {inspection.inspector_name}
                    </div>
                    {inspection.inspection_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(inspection.inspection_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* ASCE Status */}
                  <div className="flex items-center gap-2 mb-3">
                    <AsceIcon className={`w-4 h-4 ${asceStatus.color}`} />
                    <span className={`text-sm ${asceStatus.color}`}>
                      ASCE: {asceStatus.text}
                    </span>
                    {inspection.asce_requirements?.version && (
                      <Badge variant="outline" className="text-xs">
                        {inspection.asce_requirements.version}
                      </Badge>
                    )}
                  </div>

                  {/* Project Details */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {inspection.square_footage && (
                      <span>{inspection.square_footage.toLocaleString()} sq ft</span>
                    )}
                    {inspection.building_height && (
                      <span>{inspection.building_height}' height</span>
                    )}
                    {inspection.deck_type && (
                      <span>{inspection.deck_type} deck</span>
                    )}
                    {inspection.existing_membrane_type && (
                      <span>{inspection.existing_membrane_type} membrane</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {/* SOW Generation Status */}
                  {inspection.sow_generated ? (
                    <Badge variant="secondary" className="text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      SOW Generated
                    </Badge>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isGenerating || generatingSOWForId === inspection.id || !inspection.asce_requirements?.engineer_approved}
                          className="min-w-[120px]"
                        >
                          {generatingSOWForId === inspection.id ? (
                            'Generating...'
                          ) : (
                            <>
                              <FileText className="w-4 h-4 mr-2" />
                              Generate SOW
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Generate SOW Document</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p>This will generate a professional SOW document for:</p>
                            <p className="font-medium">{inspection.project_name}</p>
                            <p className="text-sm text-gray-600">{inspection.project_address}</p>
                            {inspection.asce_requirements && (
                              <div className="mt-3 p-3 bg-gray-50 rounded">
                                <p className="font-medium text-sm mb-2">ASCE Requirements:</p>
                                <pre className="text-xs whitespace-pre-wrap">
                                  {generateASCERequirementsSummary(inspection.asce_requirements)}
                                </pre>
                              </div>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleGenerateSOW(inspection)}>
                            Generate SOW
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails?.(inspection)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>

                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(inspection)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              {generationError && generatingSOWForId === inspection.id && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-600">
                    Error generating SOW: {generationError.message}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
