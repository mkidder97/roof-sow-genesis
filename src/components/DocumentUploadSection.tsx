
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Upload, FileText, X, AlertTriangle, CheckCircle, Eye, ChevronDown, RefreshCw, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SelfHealingAction {
  type: 'missing_field' | 'low_confidence' | 'fallback_selection' | 'auto_correction';
  field: string;
  originalValue?: any;
  correctedValue: any;
  reason: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
}

interface SectionOutput {
  id: string;
  title: string;
  included: boolean;
  rationale: string;
  content?: string;
  priority?: number;
}

interface SectionAnalysis {
  includedSections: SectionOutput[];
  excludedSections: SectionOutput[];
  reasoningMap: Record<string, string>;
  selfHealingActions: SelfHealingAction[];
  confidenceScore: number;
}

interface DocumentUploadProps {
  onFileUpload: (file: { filename: string; type: string; data: string }) => void;
  selfHealingActions?: SelfHealingAction[];
  sectionAnalysis?: SectionAnalysis;
  generatedPDFUrl?: string;
  engineeringSummary?: any;
}

export const DocumentUploadSection: React.FC<DocumentUploadProps> = ({
  onFileUpload,
  selfHealingActions = [],
  sectionAnalysis,
  generatedPDFUrl,
  engineeringSummary
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<{ filename: string; type: string } | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [showSectionAnalysis, setShowSectionAnalysis] = useState(false);
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

  const getBadgeVariant = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'missing_field': return <AlertTriangle className="h-3 w-3" />;
      case 'auto_correction': return <RefreshCw className="h-3 w-3" />;
      case 'fallback_selection': return <CheckCircle className="h-3 w-3" />;
      case 'low_confidence': return <Flag className="h-3 w-3" />;
      default: return <CheckCircle className="h-3 w-3" />;
    }
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

      {/* Self-Healing Actions Display */}
      {selfHealingActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-600" />
                Auto-Corrections Applied
              </div>
              <Badge variant="outline">
                {selfHealingActions.length} corrections
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selfHealingActions.map((action, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg">
                  <div className="mt-0.5">
                    {getActionIcon(action.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-slate-700 text-sm">
                        {action.field}
                      </p>
                      <Badge variant={getBadgeVariant(action.impact)} className="text-xs">
                        {action.impact} impact
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(action.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{action.reason}</p>
                    {action.originalValue !== undefined && (
                      <div className="text-xs text-slate-500">
                        <span className="line-through">Original: {String(action.originalValue)}</span>
                        {' → '}
                        <span className="font-medium">Corrected: {String(action.correctedValue)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Analysis Display */}
      {sectionAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                SOW Section Analysis
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-700">
                  {sectionAnalysis.includedSections.length} included
                </Badge>
                <Badge variant="secondary">
                  {sectionAnalysis.excludedSections.length} excluded
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Collapsible open={showSectionAnalysis} onOpenChange={setShowSectionAnalysis}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 mb-4">
                  <span className="font-medium">View Section Breakdown</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showSectionAnalysis ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4">
                  {/* Included Sections */}
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Included Sections
                    </h4>
                    <div className="space-y-2">
                      {sectionAnalysis.includedSections.map((section, index) => (
                        <div key={index} className="p-2 border-l-4 border-green-500 bg-green-50 rounded-r">
                          <p className="font-medium text-sm text-green-800">{section.title}</p>
                          <p className="text-xs text-green-600">{section.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Excluded Sections */}
                  <div>
                    <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <X className="h-4 w-4" />
                      Excluded Sections
                    </h4>
                    <div className="space-y-2">
                      {sectionAnalysis.excludedSections.map((section, index) => (
                        <div key={index} className="p-2 border-l-4 border-slate-400 bg-slate-50 rounded-r">
                          <p className="font-medium text-sm text-slate-700">{section.title}</p>
                          <p className="text-xs text-slate-500">{section.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      {/* Generated PDF Preview */}
      {generatedPDFUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Generated SOW Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
              <div>
                <p className="font-medium text-slate-700">SOW Document Ready</p>
                <p className="text-sm text-slate-600">Your scope of work has been generated successfully</p>
              </div>
              <Button asChild>
                <a href={generatedPDFUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  View PDF
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Panel */}
      {engineeringSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Engineering Debug Panel
              </div>
              <div className="flex items-center gap-2">
                {selfHealingActions.some(a => a.type === 'auto_correction') && (
                  <Badge variant="outline" className="text-blue-700">auto-corrected</Badge>
                )}
                {selfHealingActions.some(a => a.type === 'missing_field') && (
                  <Badge variant="outline" className="text-orange-700">missing</Badge>
                )}
                {selfHealingActions.some(a => a.impact === 'high') && (
                  <Badge variant="destructive">flagged for review</Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Collapsible open={showDebugPanel} onOpenChange={setShowDebugPanel}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 mb-4">
                  <span className="font-medium">View Engineering Summary</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showDebugPanel ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-slate-700">
                    {JSON.stringify(engineeringSummary, null, 2)}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
