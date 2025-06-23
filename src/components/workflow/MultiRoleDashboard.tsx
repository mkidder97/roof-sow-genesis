
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkflow } from '@/hooks/useWorkflow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardCheck, 
  Users, 
  FileText, 
  ArrowRight,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Building,
  User,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

const MultiRoleDashboard = () => {
  const { user } = useAuth();
  const { projects, userTasks, projectsLoading, createProject } = useWorkflow();
  const [activeTab, setActiveTab] = useState('overview');

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'inspection': return 'bg-blue-500';
      case 'consultant_review': return 'bg-yellow-500';
      case 'engineering': return 'bg-purple-500';
      case 'complete': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'inspection': return <ClipboardCheck className="w-4 h-4" />;
      case 'consultant_review': return <Users className="w-4 h-4" />;
      case 'engineering': return <FileText className="w-4 h-4" />;
      case 'complete': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const stats = {
    totalProjects: projects.length,
    myTasks: userTasks.length,
    inProgress: projects.filter(p => p.current_stage !== 'complete').length,
    completed: projects.filter(p => p.current_stage === 'complete').length,
  };

  if (projectsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading workflow dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Workflow Dashboard</h1>
          <p className="text-blue-200">Multi-role project management and collaboration</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.totalProjects}</div>
              <div className="text-blue-200 text-sm">Total Projects</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.myTasks}</div>
              <div className="text-blue-200 text-sm">My Tasks</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
              <div className="text-blue-200 text-sm">In Progress</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-blue-200 text-sm">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white/10 backdrop-blur-md">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Building className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="my-tasks" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <ClipboardCheck className="w-4 h-4" />
              My Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="all-projects" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4" />
              All Projects
            </TabsTrigger>
            <TabsTrigger 
              value="team" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white">Recent Projects</CardTitle>
                  <CardDescription className="text-blue-200">Latest project activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {projects.slice(0, 5).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">{project.project_name}</p>
                          <p className="text-blue-200 text-sm">{project.address}</p>
                        </div>
                        <Badge className={`${getStageColor(project.current_stage)} text-white text-xs`}>
                          {project.current_stage.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                  <CardDescription className="text-blue-200">Common workflow tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => window.location.href = '/field-inspection/new'}
                    className="w-full bg-blue-600 hover:bg-blue-700 justify-start"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Field Inspection
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('my-tasks')}
                    className="w-full bg-green-600 hover:bg-green-700 justify-start"
                  >
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    View My Tasks
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/sow-generation'}
                    className="w-full bg-purple-600 hover:bg-purple-700 justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate SOW
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Tasks Tab */}
          <TabsContent value="my-tasks" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">My Current Tasks</h2>
              <Badge variant="outline" className="border-blue-400 text-blue-200">
                {userTasks.length} tasks
              </Badge>
            </div>

            <div className="space-y-4">
              {userTasks.length === 0 ? (
                <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">All caught up!</h3>
                    <p className="text-blue-200">No pending tasks at the moment.</p>
                  </CardContent>
                </Card>
              ) : (
                userTasks.map((task) => (
                  <Card key={task.id} className="bg-white/10 backdrop-blur-md border-blue-400/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">{task.project_name}</h3>
                        <div className="flex items-center gap-2">
                          {getStageIcon(task.current_stage)}
                          <Badge className={`${getStageColor(task.current_stage)} text-white text-xs`}>
                            {task.current_stage.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-blue-200 mb-3">{task.address}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-blue-200 text-sm">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {format(new Date(task.created_at), 'MMM dd, yyyy')}
                        </div>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Work on Task
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* All Projects Tab */}
          <TabsContent value="all-projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">All Projects</h2>
              <Button 
                onClick={() => window.location.href = '/workflow/create-project'}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>

            <div className="space-y-4">
              {projects.map((project) => (
                <Card key={project.id} className="bg-white/10 backdrop-blur-md border-blue-400/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">{project.project_name}</h3>
                      <Badge className={`${getStageColor(project.current_stage)} text-white text-xs`}>
                        {project.current_stage.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-blue-200 mb-3">{project.address}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-blue-200 text-sm">
                        <User className="w-4 h-4 inline mr-1" />
                        Created {format(new Date(project.created_at), 'MMM dd, yyyy')}
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardContent className="p-8 text-center">
                <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Team Management</h3>
                <p className="text-blue-200 mb-6">
                  Team management features are coming soon. You'll be able to view team members, 
                  assign projects, and track collaboration.
                </p>
                <Badge variant="outline" className="border-blue-400 text-blue-200">
                  Coming Soon
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MultiRoleDashboard;
