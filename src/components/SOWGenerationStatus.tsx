
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, FileText, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SOWGenerationStatusProps {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress?: number;
  message?: string;
  downloadUrl?: string;
  onDownload?: () => void;
  onRetry?: () => void;
}

const SOWGenerationStatus: React.FC<SOWGenerationStatusProps> = ({
  status,
  progress = 0,
  message,
  downloadUrl,
  onDownload,
  onRetry
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      default:
        return <FileText className="w-5 h-5 text-blue-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return 'Generating SOW...';
      case 'success':
        return 'SOW Generated Successfully';
      case 'error':
        return 'SOW Generation Failed';
      default:
        return 'Ready to Generate SOW';
    }
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {getStatusIcon()}
          SOW Generation Status
          <Badge className={`${getStatusColor()} text-white ml-2`}>
            {getStatusText()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'processing' && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-blue-200">Progress</span>
              <span className="text-white">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            {message && (
              <p className="text-blue-300 text-sm mt-2">{message}</p>
            )}
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">SOW Document Ready</h3>
            <p className="text-green-200 mb-4">
              Your professional SOW document has been generated successfully
            </p>
            {onDownload && (
              <Button 
                onClick={onDownload}
                className="bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download SOW PDF
              </Button>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Generation Failed</h3>
            <p className="text-red-200 mb-4">
              {message || 'There was an error generating the SOW document'}
            </p>
            {onRetry && (
              <Button 
                onClick={onRetry}
                variant="outline"
                className="border-red-400 text-red-200 hover:bg-red-600"
              >
                Try Again
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SOWGenerationStatus;
