
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Clock, AlertCircle, CheckCircle2, User, MapPin } from "lucide-react";
import { useDashboardMetrics, useSOWHistory } from '@/hooks/useSOWDatabase';
import { useRealTimeSOWUpdates } from '@/hooks/useRealTimeSOW';
import { format } from 'date-fns';
import AvailableInspections from './AvailableInspections';

const EngineerDashboard = () => {
  // Real-time data hooks
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useDashboardMetrics();
  const { data: sowHistory, isLoading: historyLoading } = useSOWHistory(10);
  const { isConnected: realtimeConnected } = useRealTimeSOWUpdates();

  const handleDownloadSOW = (sowId: string) => {
    // Implementation for downloading SOW
    window.open(`/api/sow/download/${sowId}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (metricsError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading dashboard data: {metricsError.message}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Engineer Dashboard</h1>
            <p className="text-gray-600">Monitor SOW generation and manage projects</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              realtimeConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{realtimeConnected ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : metrics?.totalInspections || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for SOW generation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SOWs Generated</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : metrics?.totalSOWsGenerated || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending SOWs</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : metrics?.pendingSOWs || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                In queue or processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Generation Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metricsLoading ? '...' : `${metrics?.avgGenerationTime || 0}s`}
              </div>
              <p className="text-xs text-muted-foreground">
                Average completion time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="inspections" className="w-full">
          <TabsList>
            <TabsTrigger value="inspections">Available Inspections</TabsTrigger>
            <TabsTrigger value="recent">Recent SOW Generations</TabsTrigger>
            <TabsTrigger value="all">All History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="inspections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inspections Ready for SOW Generation</CardTitle>
                <CardDescription>
                  Select completed field inspections to generate Statement of Work documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvailableInspections />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent SOW Generations</CardTitle>
                <CardDescription>
                  Latest SOW generation requests and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : sowHistory && sowHistory.length > 0 ? (
                  <div className="space-y-4">
                    {sowHistory.map((sow) => (
                      <div key={sow.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(sow.generation_status)}
                          <div>
                            <div className="font-medium">
                              {(sow.input_data as any)?.projectName || 'Unnamed Project'}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center space-x-2">
                              <span>{format(new Date(sow.created_at), 'MMM dd, yyyy HH:mm')}</span>
                              <span>•</span>
                              <span>{sow.template_type}</span>
                              {sow.generation_duration_seconds && (
                                <>
                                  <span>•</span>
                                  <span>{sow.generation_duration_seconds}s</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(sow.generation_status)}>
                            {sow.generation_status}
                          </Badge>
                          {sow.generation_status === 'completed' && sow.output_file_path && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadSOW(sow.id)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No SOW generations yet</p>
                    <p className="text-sm">Generate your first SOW from a field inspection</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Complete SOW History</CardTitle>
                <CardDescription>
                  All SOW generations with detailed information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Complete history view - implement as needed</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EngineerDashboard;
