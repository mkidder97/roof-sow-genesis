import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2, Server, Zap, FileText } from 'lucide-react';
import { useSOWGeneration } from '@/hooks/useSOWGeneration';
import { apiCall, API_ENDPOINTS } from '@/lib/api';
import { useState } from 'react';

const BackendConnectionTest = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const {
    healthStatus,
    isHealthLoading,
    backendStatus,
    isStatusLoading,
    isBackendOnline
  } = useSOWGeneration();

  const testAllEndpoints = async () => {
    setIsTestingConnection(true);
    const results: any = {};
    
    try {
      // Test health endpoint
      try {
        results.health = await apiCall(API_ENDPOINTS.health);
        results.healthStatus = 'success';
      } catch (error) {
        results.healthError = error;
        results.healthStatus = 'error';
      }

      // Test status endpoint
      try {
        results.status = await apiCall(API_ENDPOINTS.status);
        results.statusStatus = 'success';
      } catch (error) {
        results.statusError = error;
        results.statusStatus = 'error';
      }

      // Test docs endpoint
      try {
        results.docs = await apiCall(API_ENDPOINTS.docs);
        results.docsStatus = 'success';
      } catch (error) {
        results.docsError = error;
        results.docsStatus = 'error';
      }

      // Test template map endpoint
      try {
        results.templateMap = await apiCall(API_ENDPOINTS.templateMap);
        results.templateMapStatus = 'success';
      } catch (error) {
        results.templateMapError = error;
        results.templateMapStatus = 'error';
      }

      setTestResults(results);
    } catch (error) {
      console.error('Error testing endpoints:', error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Loader2 className="w-4 h-4 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Server className="w-5 h-5" />
            Backend Connection Status
          </CardTitle>
          <CardDescription className="text-blue-200">
            Monitor the connection between your Lovable frontend and SOW generation backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Status */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              {isHealthLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              ) : isBackendOnline ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              )}
              <span className="text-white font-medium">Backend Server</span>
            </div>
            <Badge className={isBackendOnline ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
              {isBackendOnline ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          {/* Health Details */}
          {healthStatus && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Health Check Results:</h4>
              <pre className="text-blue-200 text-sm overflow-auto">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
          )}

          {/* Status Details */}
          {backendStatus && (
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2">Backend Status:</h4>
              <pre className="text-blue-200 text-sm overflow-auto">
                {JSON.stringify(backendStatus, null, 2)}
              </pre>
            </div>
          )}

          {/* Test All Endpoints */}
          <div className="flex items-center gap-4">
            <Button
              onClick={testAllEndpoints}
              disabled={isTestingConnection}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Test All Endpoints
                </>
              )}
            </Button>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="space-y-3">
              <h4 className="text-white font-medium">Endpoint Test Results:</h4>
              
              {/* Health Endpoint */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-blue-200">/health</span>
                <div className={`flex items-center gap-2 ${getStatusColor(testResults.healthStatus)}`}>
                  {getStatusIcon(testResults.healthStatus)}
                  <span>{testResults.healthStatus}</span>
                </div>
              </div>

              {/* Status Endpoint */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-blue-200">/api/status</span>
                <div className={`flex items-center gap-2 ${getStatusColor(testResults.statusStatus)}`}>
                  {getStatusIcon(testResults.statusStatus)}
                  <span>{testResults.statusStatus}</span>
                </div>
              </div>

              {/* Docs Endpoint */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-blue-200">/api/docs</span>
                <div className={`flex items-center gap-2 ${getStatusColor(testResults.docsStatus)}`}>
                  {getStatusIcon(testResults.docsStatus)}
                  <span>{testResults.docsStatus}</span>
                </div>
              </div>

              {/* Template Map Endpoint */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-blue-200">/api/template-map</span>
                <div className={`flex items-center gap-2 ${getStatusColor(testResults.templateMapStatus)}`}>
                  {getStatusIcon(testResults.templateMapStatus)}
                  <span>{testResults.templateMapStatus}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <h4 className="text-white font-medium">Start Backend Server</h4>
                <p className="text-blue-200 text-sm">
                  Run <code className="bg-gray-800 px-2 py-1 rounded">cd server && npm run start:enhanced</code>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <h4 className="text-white font-medium">Verify Backend is Running</h4>
                <p className="text-blue-200 text-sm">
                  Check that <code className="bg-gray-800 px-2 py-1 rounded">http://localhost:3001/health</code> responds
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <h4 className="text-white font-medium">Set Environment Variables</h4>
                <p className="text-blue-200 text-sm">
                  Copy <code className="bg-gray-800 px-2 py-1 rounded">.env.example</code> to <code className="bg-gray-800 px-2 py-1 rounded">.env</code> and configure
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <h4 className="text-white font-medium">Test SOW Generation</h4>
                <p className="text-blue-200 text-sm">
                  Use the SOW Generation page to test the full workflow
                </p>
              </div>
            </div>
          </div>

          {!isBackendOnline && (
            <Alert className="bg-red-500/20 border-red-500/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-200">
                Backend server is not responding. Please ensure it's running on port 3001.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackendConnectionTest;