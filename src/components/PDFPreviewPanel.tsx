
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Clock, HardDrive } from 'lucide-react';

interface PDFPreviewPanelProps {
  filename?: string;
  fileUrl?: string;
  fileSize?: number;
  generationTime?: number;
  onDownload?: () => void;
}

export const PDFPreviewPanel: React.FC<PDFPreviewPanelProps> = ({
  filename,
  fileUrl,
  fileSize,
  generationTime,
  onDownload
}) => {
  if (!filename && !fileUrl) {
    return null;
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    return `${kb.toFixed(1)} KB`;
  };

  const formatGenerationTime = (ms?: number) => {
    if (!ms) return 'Unknown';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          PDF Generated Successfully
          <Badge variant="default" className="bg-green-600">
            ✅ Ready
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* File Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">{filename || 'SOW Document'}</p>
                <p className="text-xs text-gray-500">PDF Document</p>
              </div>
            </div>
            
            {fileSize && (
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{formatFileSize(fileSize)}</p>
                  <p className="text-xs text-gray-500">File Size</p>
                </div>
              </div>
            )}
            
            {generationTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{formatGenerationTime(generationTime)}</p>
                  <p className="text-xs text-gray-500">Generation Time</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t">
            {fileUrl && (
              <Button asChild className="flex-1">
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  View PDF
                </a>
              </Button>
            )}
            
            {onDownload && (
              <Button variant="outline" onClick={onDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
