
import React from 'react';
import { useWorkflow } from '@/hooks/useWorkflow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, AlertTriangle, Users, Clock, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';

const ConsultantDashboard = () => {
  const { projects, userTasks, projectsLoading } = useWorkflow();

  const consultantProjects = projects.filter(p => p.current_stage === 'consultant_review');
  const priorityProjects = consultantProjects.filter(p => {
    const stageData = p.stage_data as any;
    return stageData?.priority === 'high';
  });
  const completedReviews = projects.filter(p => p.current_stage === 'engineering' || p.current_stage === 'complete');

  const stats = {
    pendingReviews: consultantProjects.length,
    priorityReviews: priorityProjects.length,
    completedThisWeek: completedReviews.filter(p => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(p.updated_at) >= weekAgo;
    }).length,
    totalProjects: projects.length
  };

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading consultant dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Consultant Dashboard</h1>
          <p className="text-blue-200">Project review and client requirements management</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.pendingReviews}</div>
              <div className="text-blue-200 text-sm">Pending Reviews</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.priorityReviews}</div>
              <div className="text-blue-200 text-sm">Priority Reviews</div>
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

        {/* Pending Reviews */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pending Reviews
            </CardTitle>
            <CardDescription className="text-blue-200">
              Projects awaiting consultant review and analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {consultantProjects.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <p className="text-blue-200">No pending reviews</p>
              </div>
            ) : (
              <div className="space-y-4">
                {consultantProjects.map((project) => {
                  const stageData = project.stage_data as any;
                  return (
                    <div
                      key={project.id}
                      className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all cursor-pointer border border-blue-400/20"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">{project.project_name}</h3>
                            {stageData?.priority === 'high' && (
                              <Badge className="bg-red-500 text-white">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Priority
                              </Badge>
                            )}
                          </div>
                          <p className="text-blue-200 text-sm mb-2">{project.address}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center text-blue-200">
                              <Clock className="w-4 h-4 mr-1" />
                              Received {format(new Date(project.updated_at), 'MMM dd, yyyy')}
                            </div>
                            {project.square_footage && (
                              <Badge variant="outline" className="border-blue-400 text-blue-200">
                                {project.square_footage.toLocaleString()} sq ft
                              </Badge>
                            )}
                            {project.project_type && (
                              <Badge variant="outline" className="border-green-400 text-green-200">
                                {project.project_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            size="sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                          <Button
                            variant="outline"
                            className="border-green-400 text-green-200 hover:bg-green-600"
                            size="sm"
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Handoff
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bid Alerts & Risk Factors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Bid Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {priorityProjects.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-400/30">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{project.project_name}</p>
                      <p className="text-yellow-200 text-xs">High priority review required</p>
                    </div>
                  </div>
                ))}
                {priorityProjects.length === 0 && (
                  <p className="text-blue-200 text-center py-4">No active alerts</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-white">Recent Completions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedReviews.slice(0, 3).map((project) => (
                  <div key={project.id} className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg border border-green-400/30">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{project.project_name}</p>
                      <p className="text-green-200 text-xs">
                        Completed {format(new Date(project.updated_at), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                ))}
                {completedReviews.length === 0 && (
                  <p className="text-blue-200 text-center py-4">No recent completions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConsultantDashboard;
