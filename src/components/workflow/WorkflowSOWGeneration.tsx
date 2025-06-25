
import React from 'react';
import { useSOWGeneration } from '@/hooks/useSOWGeneration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { SOWGenerationRequest, FieldInspectionData, transformInspectionToSOWRequest } from '@/types/sow';

interface WorkflowSOWGenerationProps {
  inspectionData?: FieldInspectionData;
  onSOWGenerated?: (sowId: string) => void;
}

export const WorkflowSOWGeneration: React.FC<WorkflowSOWGenerationProps> = ({
  inspectionData,
  onSOWGenerated
}) => {
  const {
    generateSOW,
    isGenerating,
    generationError,
    generationData,
    generationProgress,
    generationStatus
  } = useSOWGeneration({
    onSuccess: (data) => {
      if (data.sowId) {
        onSOWGenerated?.(data.sowId);
      }
    }
  });

  const handleGenerateSOW = () => {
    if (!inspectionData) return;

    // Transform inspection data to SOW request format
    const sowRequest: SOWGenerationRequest = transformInspectionToSOWRequest(inspectionData);

    // Ensure required fields are present
    if (!sowRequest.projectName || !sowRequest.projectAddress) {
      console.error('Missing required fields for SOW generation');
      return;
    }

    generateSOW(sowRequest);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          SOW Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isGenerating && !generationData && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Generate a professional SOW document from this inspection data.
            </p>
            <Button onClick={handleGenerateSOW} disabled={!inspectionData}>
              <FileText className="w-4 h-4 mr-2" />
              Generate SOW
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <div>
              <p className="text-sm text-gray-600">{generationStatus}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {generationError && (
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Error: {generationError.message}
            </p>
            <Button onClick={handleGenerateSOW} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {generationData?.success && (
          <div className="text-center">
            <p className="text-green-600 mb-4">
              SOW generated successfully!
            </p>
            {generationData.downloadUrl && (
              <Button asChild>
                <a href={generationData.downloadUrl} download>
                  Download SOW PDF
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowSOWGeneration;
