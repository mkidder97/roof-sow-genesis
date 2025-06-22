
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SelfHealingInspector } from './SelfHealingInspector';
import { SectionAnalysisVisualizer } from './SectionAnalysisVisualizer';
import { PDFPreviewPanel } from './PDFPreviewPanel';
import { ErrorDisplay } from './ErrorDisplay';
import { SelfHealingAction, SectionAnalysis, EngineeringSummaryData } from '@/types/engineering';

interface DocumentUploadProps {
  onFileUpload: (file: { filename: string; type: string; data: string }) => void;
  selfHealingActions?: SelfHealingAction[];
  sectionAnalysis?: SectionAnalysis;
  generatedPDFUrl?: string;
  engineeringSummary?: EngineeringSummaryData;
  error?: string;
  onRetryGeneration?: () => void;
  onDownloadPDF?: () => void;
}

export const DocumentUploadSection: React.FC<DocumentUploadProps> = ({
  onFileUpload,
  selfHealingActions = [],
  sectionAnalysis,
  generatedPDFUrl,
  engineeringSummary,
  error,
  onRetryGeneration,
  onDownloadPDF
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{ filename: string; type: string } | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF, JPG, or PNG file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(',')[1];
      
      const fileData = {
        filename: file.name,
        type: file.type,
        data: base64Data,
      };
      
      setUploadedFile({ filename: file.name, type: file.type });
      onFileUpload(fileData);
      
      toast({
        title: "File Uploaded Successfully",
        description: `${file.name} has been uploaded and will be analyzed.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!uploadedFile ? (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Upload Project Document
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Upload PDF plans, NOA documents, or images for automatic data extraction
              </p>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mb-2"
              >
                Choose File
              </Button>
              <p className="text-xs text-slate-500">
                Supports PDF, JPG, PNG • Max 10MB
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">{uploadedFile.filename}</p>
                  <p className="text-sm text-slate-500">{uploadedFile.type}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFile}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          error={error}
          suggestions={getErrorSuggestions(error)}
          onRetry={onRetryGeneration}
        />
      )}

      {/* Self-Healing Actions Display */}
      {selfHealingActions.length > 0 && (
        <SelfHealingInspector actions={selfHealingActions} />
      )}

      {/* Section Analysis Display */}
      {sectionAnalysis && (
        <SectionAnalysisVisualizer analysis={sectionAnalysis} />
      )}

      {/* PDF Preview Panel */}
      <PDFPreviewPanel
        filename={engineeringSummary?.filename}
        fileUrl={engineeringSummary?.fileUrl || generatedPDFUrl}
        fileSize={engineeringSummary?.fileSize}
        generationTime={engineeringSummary?.generationTime}
        onDownload={onDownloadPDF}
      />
    </div>
  );
};
