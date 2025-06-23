
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, FileText, CheckCircle, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { SelfHealingInspector } from './SelfHealingInspector';
import { SectionAnalysisVisualizer } from './SectionAnalysisVisualizer';
import { PDFPreviewPanel } from './PDFPreviewPanel';
import { ErrorDisplay } from './ErrorDisplay';
import { SelfHealingAction, SectionAnalysis, EngineeringSummaryData } from '@/types/engineering';
import { SOWResponse } from '@/lib/api';

interface SOWReviewPanelProps {
  generatedSOW: SOWResponse | null;
  selfHealingActions?: SelfHealingAction[];
  sectionAnalysis?: SectionAnalysis;
  engineeringSummary?: EngineeringSummaryData;
  error?: string | null;
  onRetryGeneration?: () => void;
  onDownloadPDF?: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const SOWReviewPanel: React.FC<SOWReviewPanelProps> = ({
  generatedSOW,
  selfHealingActions = [],
  sectionAnalysis,
  engineeringSummary,
  error,
  onRetryGeneration,
  onDownloadPDF,
  isOpen = true,
  onToggle
}) => {
  // Don't render if no SOW has been generated yet
  if (!generatedSOW && !error) {
    return null;
  }

  const getErrorSuggestions = (errorMessage: string): string[] => {
    const suggestions = [];
    
    if (errorMessage.toLowerCase().includes('address')) {
      suggestions.push('Check that the address is complete and properly formatted');
      suggestions.push('Ensure the address includes city, state, and zip code');
    }
    
    if (errorMessage.toLowerCase().includes('connection') || errorMessage.toLowerCase().includes('network')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Verify the backend server is running on http://localhost:3001');
    }
    
    if (errorMessage.toLowerCase().includes('validation')) {
      suggestions.push('Ensure all required fields are filled out');
      suggestions.push('Check that numeric values are within valid ranges');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Try refreshing the page and submitting again');
      suggestions.push('Check the browser console for additional error details');
    }
    
    return suggestions;
  };

  const ReviewContent = () => (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <ErrorDisplay
          error={error}
          suggestions={getErrorSuggestions(error)}
          onRetry={onRetryGeneration}
        />
      )}

      {/* Success State with Summary */}
      {generatedSOW?.success && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">SOW Generated Successfully!</h3>
                <p className="text-sm text-green-700">
                  Your professional SOW has been generated and analyzed by the self-healing system
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <div className="text-sm text-gray-600">Self-Healing Actions</div>
                <div className="text-lg font-semibold text-green-700">
                  {selfHealingActions.length} corrections
                </div>
              </div>
              {sectionAnalysis && (
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <div className="text-sm text-gray-600">Sections Included</div>
                  <div className="text-lg font-semibold text-green-700">
                    {sectionAnalysis.includedSections.length} sections
                  </div>
                </div>
              )}
              {generatedSOW.generationTime && (
                <div className="bg-white p-3 rounded-lg border border-green-200">
                  <div className="text-sm text-gray-600">Generation Time</div>
                  <div className="text-lg font-semibold text-green-700">
                    {generatedSOW.generationTime}ms
                  </div>
                </div>
              )}
            </div>

            {/* Download Action */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{generatedSOW.filename}</h4>
                <p className="text-sm text-gray-600">{engineeringSummary?.fileSize || 'Unknown'} KB</p>
              </div>
              <Button onClick={onDownloadPDF} className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" />
                Download SOW PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Self-Healing Actions Display */}
      {selfHealingActions.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Self-Healing Analysis
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            The self-healing system reviewed the generated SOW and made the following corrections based on industry standards and template compliance:
          </p>
          <SelfHealingInspector actions={selfHealingActions} />
        </div>
      )}

      {/* Section Analysis Display */}
      {sectionAnalysis && (
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Section Selection Analysis
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            Analysis of which SOW sections were included or excluded in the final document and the reasoning behind these decisions:
          </p>
          <SectionAnalysisVisualizer analysis={sectionAnalysis} />
        </div>
      )}

      {/* PDF Preview Panel */}
      {(generatedSOW?.outputPath || engineeringSummary?.fileUrl) && (
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Generated SOW Preview
          </h4>
          <PDFPreviewPanel
            filename={engineeringSummary?.filename || generatedSOW.filename}
            fileUrl={engineeringSummary?.fileUrl || generatedSOW.outputPath}
            fileSize={engineeringSummary?.fileSize}
            generationTime={engineeringSummary?.generationTime || generatedSOW.generationTime}
            onDownload={onDownloadPDF}
          />
        </div>
      )}
    </div>
  );

  // If onToggle is provided, render as collapsible
  if (onToggle) {
    return (
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <Card className="border-blue-200">
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full cursor-pointer">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  SOW Review & Analysis
                  {generatedSOW?.success && (
                    <span className="text-sm font-normal text-green-600 ml-2">
                      ✓ Generated Successfully
                    </span>
                  )}
                  {error && (
                    <span className="text-sm font-normal text-red-600 ml-2">
                      ⚠ Generation Failed
                    </span>
                  )}
                </CardTitle>
                <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent>
              <ReviewContent />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // Render as always-open panel
  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          SOW Review & Analysis
          {generatedSOW?.success && (
            <span className="text-sm font-normal text-green-600 ml-2">
              ✓ Generated Successfully
            </span>
          )}
          {error && (
            <span className="text-sm font-normal text-red-600 ml-2">
              ⚠ Generation Failed
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ReviewContent />
      </CardContent>
    </Card>
  );
};
