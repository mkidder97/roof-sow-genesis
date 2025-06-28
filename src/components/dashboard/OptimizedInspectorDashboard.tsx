
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus,
  ClipboardCheck, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  User,
  Building,
  MapPin,
  Edit,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { useToast } from '@/hooks/use-toast';
import { FieldInspection } from '@/types/fieldInspection';

export const OptimizedInspectorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { inspections, loading: inspectionsLoading, error: inspectionsError, refetch } = useFieldInspections();

  const pendingInspections = inspections.filter(i => !i.completed);
  const completedInspections = inspections.filter(i => i.completed);

  const handleCreateNew = () => {
    navigate('/field-inspection/new');
  };

  const handleViewInspection = (inspection: FieldInspection) => {
    navigate(`/field-inspection/${inspection.id}`);
  };

  const handleForceRefresh = () => {
    console.log('🔄 Force refreshing inspections data...');
    refetch();
    toast({
      title: "Refreshing Data",
      description: "Fetching latest inspection data...",
    });
  };

  if (inspectionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <Clock className="w-6 h-6 animate-spin" />
          Loading inspector dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Field Inspector Dashboard</h1>
          <p className="text-blue-200">Manage field inspections and building assessments</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={handleForceRefresh}
            className="bg-gray-600 hover:bg-gray-700"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Inspection
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {inspectionsError && (
        <Alert className="mb-6 bg-red-900/50 border-red-400/30">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200">
            Error loading inspections: {inspectionsError}
            <Button onClick={refetch} className="ml-4 bg-red-600 hover:bg-red-700" size="sm">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-white/10 backdrop-blur border-blue-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total Inspections</p>
                <p className="text-white text-2xl font-bold">{inspections.length}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur border-orange-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-200 text-sm">Pending</p>
                <p className="text-white text-2xl font-bold">{pendingInspections.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
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

        <Card className="bg-white/10 backdrop-blur border-purple-400/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm">This Week</p>
                <p className="text-white text-2xl font-bold">
                  {inspections.filter(i => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(i.created_at || '') > weekAgo;
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="bg-white/10 backdrop-blur">
          <TabsTrigger value="pending">Pending ({pendingInspections.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedInspections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <div className="grid gap-6">
            {pendingInspections.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur border-blue-400/30">
                <CardContent className="p-8 text-center">
                  <ClipboardCheck className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-white text-lg mb-2">No Pending Inspections</h3>
                  <p className="text-blue-200 mb-4">Create your first field inspection to get started.</p>
                  <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Inspection
                  </Button>
                </CardContent>
              </Card>
            ) : (
              pendingInspections.map((inspection) => (
                <Card key={inspection.id} className="bg-white/10 backdrop-blur border-blue-400/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">{inspection.project_name}</CardTitle>
                        <CardDescription className="text-blue-200">
                          {inspection.project_address}
                        </CardDescription>
                      </div>
                      <Badge className="bg-orange-600 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        {inspection.status || 'Pending'}
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
                          {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : 'Not set'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => handleViewInspection(inspection)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Continue Inspection
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

                  {/* Note: SOW generation removed from Inspector Dashboard - Engineers handle this */}
                  <div className="bg-blue-900/30 p-3 rounded-lg">
                    <p className="text-blue-200 text-sm">
                      ✅ Inspection completed and ready for engineering review. 
                      Engineers will handle SOW generation from their dashboard.
                    </p>
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

export default OptimizedInspectorDashboard;
