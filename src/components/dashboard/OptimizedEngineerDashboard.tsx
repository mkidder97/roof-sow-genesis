import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Wrench, 
  TrendingUp,
  Calendar,
  User,
  Building,
  MapPin,
  Download
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSOWGeneration } from '@/hooks/useSOWGeneration';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { useToast } from '@/hooks/use-toast';
import { FieldInspection } from '@/types/fieldInspection';
import { SOWGenerationRequest, transformInspectionToSOWRequest } from '@/types/sow';

export const OptimizedEngineerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { inspections, loading: inspectionsLoading } = useFieldInspections();
  const {
    generateSOW,
    isGenerating,
    generationData,
    generationError,
    generationStatus,
    healthStatus,
    isBackendOnline
  } = useSOWGeneration();

  const completedInspections = inspections.filter(i => i.completed);
  const readyForSOW = completedInspections.filter(i => !i.sow_generated);

  const handleGenerateSOW = async (inspection: FieldInspection) => {
    if (!inspection.id) return;

    const sowRequest: SOWGenerationRequest = transformInspectionToSOWRequest({
      ...inspection,
      id: inspection.id
    });

    generateSOW(sowRequest);

    toast({
      title: "SOW Generation Started",
      description: `Generating SOW for ${inspection.project_name}`,
    });
  };

  const handleDownloadSOW = (generation: any) => {
    // Fix the status comparison - use string comparison instead of type mismatch
    if (generation.generation_status === 'completed' && generation.pdf_url) {
      const link = document.createElement('a');
      link.href = generation.pdf_url;
      link.download = `SOW_${generation.id}.pdf`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Engineer Dashboard</h1>
        <p className="text-blue-200">Review completed inspections and generate SOW documents</p>
      </div>

      {/* Backend Status */}
      <Alert className={`mb-6 ${isBackendOnline ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
        <AlertDescription className="text-white">
          Backend Status: {isBackendOnline ? 'Connected' : 'Offline'}
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 backdrop-blur border-blue-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total Inspections</p>
                <p className="text-white text-2xl font-bold">{inspections.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-green-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Completed</p>
                <p className="text-white text-2xl font-bold">{completedInspections.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-orange-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-200 text-sm">Ready for SOW</p>
                <p className="text-white text-2xl font-bold">{readyForSOW.length}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-purple-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">Generation Status</p>
                <p className="text-white text-sm">{generationStatus || 'Ready'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="ready" className="space-y-6">
        <TabsList className="bg-white/10 backdrop-blur">
          <TabsTrigger value="ready">Ready for SOW ({readyForSOW.length})</TabsTrigger>
          <TabsTrigger value="completed">All Completed ({completedInspections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ready">
          <div className="grid gap-6">
            {readyForSOW.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur border-blue-400/30">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-white text-lg mb-2">No Inspections Ready</h3>
                  <p className="text-blue-200">Complete field inspections will appear here for SOW generation.</p>
                </CardContent>
              </Card>
            ) : (
              readyForSOW.map((inspection) => (
                <Card key={inspection.id} className="bg-white/10 backdrop-blur border-blue-400/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">{inspection.project_name}</CardTitle>
                        <CardDescription className="text-blue-200">
                          {inspection.project_address}
                        </CardDescription>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-blue-200">
                        <User className="h-4 w-4" />
                        <span className="text-sm">{inspection.inspector_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-200">
                        <Building className="h-4 w-4" />
                        <span className="text-sm">{inspection.square_footage?.toLocaleString()} sq ft</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-200">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{inspection.city}, {inspection.state}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-200">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {inspection.completed_at ? new Date(inspection.completed_at).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => handleGenerateSOW(inspection)}
                        disabled={isGenerating || !isBackendOnline}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isGenerating ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Generate SOW
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="grid gap-6">
            {completedInspections.map((inspection) => (
              <Card key={inspection.id} className="bg-white/10 backdrop-blur border-blue-400/30">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{inspection.project_name}</CardTitle>
                      <CardDescription className="text-blue-200">
                        {inspection.project_address}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-green-600 text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                      {inspection.sow_generated && (
                        <Badge className="bg-purple-600 text-white">
                          SOW Generated
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 text-blue-200">
                      <User className="h-4 w-4" />
                      <span className="text-sm">{inspection.inspector_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-200">
                      <Building className="h-4 w-4" />
                      <span className="text-sm">{inspection.square_footage?.toLocaleString()} sq ft</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-200">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{inspection.city}, {inspection.state}</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-200">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {inspection.completed_at ? new Date(inspection.completed_at).toLocaleDateString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OptimizedEngineerDashboard;
