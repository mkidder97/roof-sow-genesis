
import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  onFileUpload: (file: { filename: string; type: string; data: string }) => void;
  uploadedFile?: { filename: string; type: string } | null;
  onClearFile?: () => void;
}

export const DocumentUploadSection: React.FC<DocumentUploadProps> = ({
  onFileUpload,
  uploadedFile,
  onClearFile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalUploadedFile, setInternalUploadedFile] = useState<{ filename: string; type: string } | null>(null);
  const { toast } = useToast();

  // Use either external uploaded file prop or internal state
  const currentFile = uploadedFile || internalUploadedFile;

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
      
      setInternalUploadedFile({ filename: file.name, type: file.type });
      onFileUpload(fileData);
      
      toast({
        title: "File Uploaded Successfully",
        description: `${file.name} has been uploaded and will be processed for data extraction.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setInternalUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onClearFile) {
      onClearFile();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Project Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!currentFile ? (
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
              Upload Takeoff Forms, NOAs, or Plans
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Upload PDF takeoff forms, NOA documents, or project plans for automatic data extraction and form auto-fill
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
                <p className="font-medium text-slate-700">{currentFile.filename}</p>
                <p className="text-sm text-slate-500">{currentFile.type}</p>
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
  );
};
