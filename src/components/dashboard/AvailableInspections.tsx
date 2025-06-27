
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Calendar, User, FileText, Loader2 } from "lucide-react";
import { useCompletedInspections } from '@/hooks/useCompletedInspections';
import { useSOWGeneration } from '@/hooks/useSOWGeneration';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const AvailableInspections = () => {
  const { completedInspections, loading, error, refetch } = useCompletedInspections();
  const { generateSOW, isGenerating } = useSOWGeneration({
    onSuccess: () => {
      toast({
        title: "SOW Generated",
        description: "Statement of Work has been generated successfully.",
      });
      refetch(); // Refresh the inspections list
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  const { toast } = useToast();

  const handleGenerateSOW = async (inspection: any) => {
    try {
      const sowRequest = {
        projectName: inspection.project_name,
        projectAddress: inspection.project_address,
        customerName: inspection.customer_name,
        customerPhone: inspection.customer_phone,
        buildingHeight: inspection.building_height,
        squareFootage: inspection.square_footage,
        deckType: inspection.deck_type,
        membraneType: inspection.existing_membrane_type,
        insulationType: inspection.insulation_type,
        city: inspection.city,
        state: inspection.state,
        zipCode: inspection.zip_code,
        buildingClassification: inspection.building_classification,
        exposureCategory: inspection.exposure_category,
        windSpeed: inspection.wind_speed,
        notes: inspection.notes,
        inspectionId: inspection.id,
        projectType: 'recover' // Default for field inspections
      };

      await generateSOW(sowRequest);
    } catch (error) {
      console.error('SOW generation error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading inspections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-600 text-center">
            <p>Error loading inspections: {error}</p>
            <Button onClick={refetch} className="mt-2" variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableInspections = completedInspections.filter(inspection => !inspection.sow_generated);

  if (availableInspections.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Inspections Available</h3>
          <p className="text-gray-600">
            All completed inspections have already had SOWs generated, or there are no completed inspections yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Available for SOW Generation ({availableInspections.length})
        </h3>
      </div>

      {availableInspections.map((inspection) => (
        <Card key={inspection.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <h4 className="text-lg font-semibold text-gray-900">
                    {inspection.project_name}
                  </h4>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Ready for SOW
                  </Badge>
                </div>

                <p className="text-gray-600 mb-3">{inspection.project_address}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {inspection.inspection_date 
                        ? format(new Date(inspection.inspection_date), 'MMM dd, yyyy')
                        : 'No date recorded'
                      }
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{inspection.inspector_name || 'Unknown Inspector'}</span>
                  </div>

                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      {inspection.square_footage?.toLocaleString() || 'N/A'} sq ft
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {inspection.deck_type && (
                    <Badge variant="secondary" className="text-xs">
                      {inspection.deck_type} Deck
                    </Badge>
                  )}
                  {inspection.existing_membrane_type && (
                    <Badge variant="secondary" className="text-xs">
                      {inspection.existing_membrane_type} Membrane
                    </Badge>
                  )}
                  {inspection.building_height && (
                    <Badge variant="secondary" className="text-xs">
                      {inspection.building_height}ft Height
                    </Badge>
                  )}
                </div>
              </div>

              <div className="ml-4">
                <Button
                  onClick={() => handleGenerateSOW(inspection)}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate SOW
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AvailableInspections;
