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
        title: "SOW Generated Successfully",
        description: "Statement of Work has been generated and is ready for download.",
      });
      refetch(); // Refresh the inspections list
    },
    onError: (error) => {
      toast({
        title: "SOW Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  const { toast } = useToast();

  const handleGenerateSOW = async (inspection: any) => {
    try {
      console.log('Generating SOW for inspection:', inspection);
      
      // Fixed: Wrap all project fields under projectData
      const sowRequest = {
        projectData: {
          projectName: inspection.project_name,
          projectAddress: inspection.project_address,
          city: inspection.city || 'Unknown',
          state: inspection.state || 'FL',
          zipCode: inspection.zip_code || '00000',
          customerName: inspection.customer_name || 'TBD',
          customerPhone: inspection.customer_phone || 'TBD',
          buildingHeight: inspection.building_height || 20,
          squareFootage: inspection.square_footage || 10000,
          deckType: inspection.deck_type || 'steel',
          membraneType: inspection.existing_membrane_type || 'tpo',
          windSpeed: inspection.wind_speed || 140,
          exposureCategory: inspection.exposure_category || 'C',
          buildingClassification: inspection.building_classification || 'II',
          projectType: (inspection.project_type || 'recover') as 'recover' | 'tearoff' | 'new',
          notes: [inspection.notes, inspection.recommendations, inspection.concerns]
            .filter(Boolean)
            .join('; ') || undefined
        },
        inspectionId: inspection.id
      };

      console.log('Enhanced SOW Request:', sowRequest);
      await generateSOW(sowRequest);
    } catch (error) {
      console.error('SOW generation error:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate SOW. Please try again.",
        variant: "destructive",
      });
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

  // Phase 1: Only show inspections that don't have SOWs generated yet
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
                
                {/* Enhanced location and wind data display */}
                <div className="text-sm text-gray-600 mb-3">
                  {inspection.city && inspection.state && (
                    <span>{inspection.city}, {inspection.state} {inspection.zip_code}</span>
                  )}
                  {inspection.wind_speed && (
                    <span className="ml-4">Wind: {inspection.wind_speed} mph</span>
                  )}
                  {inspection.exposure_category && (
                    <span className="ml-2">Exp: {inspection.exposure_category}</span>
                  )}
                </div>

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
                  {inspection.building_classification && (
                    <Badge variant="secondary" className="text-xs">
                      Class {inspection.building_classification}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="ml-4">
                <Button
                  onClick={() => handleGenerateSOW(inspection)}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating SOW...
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
