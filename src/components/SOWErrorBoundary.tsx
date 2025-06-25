
import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { SOWGenerationError, createSOWError, isNetworkError, isValidationError } from '@/types/sowGeneration';

interface Props {
  children: ReactNode;
  onError?: (error: SOWGenerationError) => void;
}

interface State {
  hasError: boolean;
  error: SOWGenerationError | null;
}

export class SOWErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    let sowError: SOWGenerationError;

    if (isNetworkError(error)) {
      sowError = createSOWError(
        'Network connection failed. Please check your internet connection and ensure the backend server is running.',
        'network',
        { originalError: error.message }
      );
    } else if (isValidationError(error)) {
      sowError = createSOWError(
        'Invalid data provided. Please check your form inputs.',
        'validation',
        { originalError: error.message }
      );
    } else {
      sowError = createSOWError(
        `An unexpected error occurred: ${error.message}`,
        'unknown',
        { originalError: error.message, stack: error.stack }
      );
    }

    return {
      hasError: true,
      error: sowError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SOW Error Boundary caught an error:', error, errorInfo);
    
    if (this.props.onError && this.state.error) {
      this.props.onError(this.state.error);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <Card className="bg-white/10 backdrop-blur-md border-red-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              SOW Generation Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Type: {this.state.error.type}</AlertTitle>
              <AlertDescription>
                <div className="space-y-3">
                  <p>{this.state.error.message}</p>
                  
                  {this.state.error.type === 'network' && (
                    <div>
                      <p className="font-medium text-sm">Troubleshooting Steps:</p>
                      <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                        <li>Check your internet connection</li>
                        <li>Ensure the backend server is running on localhost:3001</li>
                        <li>Verify the API endpoints are accessible</li>
                        <li>Try refreshing the page</li>
                      </ul>
                    </div>
                  )}

                  {this.state.error.type === 'validation' && (
                    <div>
                      <p className="font-medium text-sm">Suggestions:</p>
                      <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                        <li>Check that all required fields are filled</li>
                        <li>Ensure numeric values are valid numbers</li>
                        <li>Verify file uploads meet size and type requirements</li>
                      </ul>
                    </div>
                  )}
                  
                  {this.state.error.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
                      <pre className="mt-2 text-xs bg-black/20 p-2 rounded overflow-auto">
                        {JSON.stringify(this.state.error.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry}
                variant="outline" 
                className="border-red-400 text-red-200 hover:bg-red-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-blue-400 text-blue-200 hover:bg-blue-600"
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
