import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, FileText, Zap } from 'lucide-react';

interface ExtractedData {
  projectName?: string;
  address?: string;
  companyName?: string;
  squareFootage?: number;
  buildingHeight?: number;
  buildingDimensions?: {
    length: number;
    width: number;
  };
  elevation?: number;
  membraneThickness?: string;
  membraneColor?: string;
  deckType?: string;
  confidence: number;
}

interface PreviewItem {
  field: string;
  label: string;
  value: any;
  confidence: number;
  willPopulate: boolean;
}

interface PDFPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: ExtractedData | null;
  previewItems: PreviewItem[];
  onApply: (selectedFields: string[]) => void;
  isLoading: boolean;
}

export const PDFPreviewDialog: React.FC<PDFPreviewDialogProps> = ({
  isOpen,
  onClose,
  extractedData,
  previewItems,
  onApply,
  isLoading
}) => {
  const [selectedFields, setSelectedFields] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Auto-select fields with high confidence
    if (previewItems.length > 0) {
      const highConfidenceFields = previewItems
        .filter(item => item.willPopulate)
        .map(item => item.field);
      setSelectedFields(new Set(highConfidenceFields));
    }
  }, [previewItems]);

  const toggleField = (field: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(field)) {
      newSelected.delete(field);
    } else {
      newSelected.add(field);
    }
    setSelectedFields(newSelected);
  };

  const handleApply = () => {
    onApply(Array.from(selectedFields));
    onClose();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Parsing PDF...
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-slate-600">Extracting project data...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            PDF Data Extraction Results
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Review the extracted data and select which fields to auto-populate
          </p>
        </DialogHeader>

        {extractedData && (
          <div className="space-y-6">
            {/* Overall Confidence */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-slate-700">Overall Extraction Quality:</div>
                <Badge className={getConfidenceColor(extractedData.confidence)}>
                  {getConfidenceLabel(extractedData.confidence)} ({Math.round(extractedData.confidence * 100)}%)
                </Badge>
              </div>
            </div>

            {/* Extracted Fields */}
            <div className="space-y-3">
              <h4 className="font-medium text-slate-700">Extracted Fields</h4>
              
              {previewItems.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>No relevant project data found in the PDF</p>
                  <p className="text-sm">Try uploading a different document or enter data manually</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {previewItems.map((item) => (
                    <div
                      key={item.field}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedFields.has(item.field)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => toggleField(item.field)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-slate-700">{item.label}</span>
                            <Badge className={getConfidenceColor(item.confidence)} variant="outline">
                              {getConfidenceLabel(item.confidence)}
                            </Badge>
                          </div>
                          <div className="text-sm text-slate-600">
                            <strong>Value:</strong> {String(item.value)}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {selectedFields.has(item.field) ? (
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          ) : (
                            <div className="h-5 w-5 border-2 border-slate-300 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selection Summary */}
            {previewItems.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>{selectedFields.size} of {previewItems.length} fields</strong> selected for auto-population
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  You can change these selections before applying
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            disabled={selectedFields.size === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Apply Selected Fields ({selectedFields.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
