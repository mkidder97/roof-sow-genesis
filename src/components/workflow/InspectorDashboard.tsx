
import React from 'react';
import { useWorkflow } from '@/hooks/useWorkflow';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardCheck, Camera, MapPin, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';

const InspectorDashboard = () => {
  const { projects, userTasks, projectsLoading } = useWorkflow();
  const navigate = useNavigate();

  const inspectionProjects = projects.filter(p => p.current_stage === 'inspection');
  const completedInspections = projects.filter(p => p.current_stage !== 'inspection');

  const stats = {
    activeInspections: inspectionProjects.length,
    pendingHandoffs: inspectionProjects.filter(p => p.stage_data?.ready_for_handoff).length,
    completedThisWeek: completedInspections.filter(p => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(p.updated_at) >= weekAgo;
    }).length,
    totalProjects: projects.length
  };

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading inspector dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Inspector Dashboard</h1>
          <p className="text-blue-200">Field inspection management and workflow coordination</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.activeInspections}</div>
              <div className="text-blue-200 text-sm">Active Inspections</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.pendingHandoffs}</div>
              <div className="text-blue-200 text-sm">Pending Handoffs</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.completedThisWeek}</div>
              <div className="text-blue-200 text-sm">Completed This Week</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.totalProjects}</div>
              <div className="text-blue-200 text-sm">Total Projects</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button
            onClick={() => navigate('/field-inspection/new')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg h-auto flex-1"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Field Inspection
          </Button>
          <Button
            onClick={() => navigate('/workflow/create-project')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg h-auto flex-1"
          >
            <ClipboardCheck className="w-5 h-5 mr-2" />
            Create Workflow Project
          </Button>
        </div>

        {/* Active Inspections */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Active Inspections
            </CardTitle>
            <CardDescription className="text-blue-200">
              Projects currently in inspection stage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inspectionProjects.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardCheck className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-blue-200 mb-4">No active inspections</p>
                <Button 
                  onClick={() => navigate('/workflow/create-project')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {inspectionProjects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer border border-blue-400/20"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{project.project_name}</h3>
                        <div className="flex items-center text-blue-200 text-sm mt-1">
                          <MapPin className="w-4 h-4 mr-1" />
                          {project.address}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center text-blue-200">
                            <Clock className="w-4 h-4 mr-1" />
                            {format(new Date(project.created_at), 'MMM dd, yyyy')}
                          </div>
                          {project.square_footage && (
                            <Badge variant="outline" className="border-blue-400 text-blue-200">
                              {project.square_footage.toLocaleString()} sq ft
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/field-inspection/new?project=${project.id}`)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Camera className="w-4 h-4 mr-1" />
                          Inspect
                        </Button>
                        <Button
                          variant="outline"
                          className="border-blue-400 text-blue-200 hover:bg-blue-600"
                          size="sm"
                        >
                          <Users className="w-4 h-4 mr-1" />
                          Handoff
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-blue-200">
              Latest updates from your inspection projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedInspections.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">
                      <span className="font-medium">{project.project_name}</span> moved to {project.current_stage.replace('_', ' ')}
                    </p>
                    <p className="text-blue-200 text-xs">
                      {format(new Date(project.updated_at), 'MMM dd, h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
              {completedInspections.length === 0 && (
                <p className="text-blue-200 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InspectorDashboard;
