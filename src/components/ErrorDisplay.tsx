
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
  suggestions?: string[];
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry, suggestions }) => {
  return (
    <Alert variant="destructive" className="border-red-300">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Generation Failed</AlertTitle>
      <AlertDescription>
        <div className="space-y-3">
          <p>{error}</p>
          
          {suggestions && suggestions.length > 0 && (
            <div>
              <p className="font-medium text-sm">Suggestions:</p>
              <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-3">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};
