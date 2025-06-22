import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Wind, Settings } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/tesla-ui.css';

const Dashboard = () => {
  const { user, session, loading, signOut } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast.error('Failed to load projects');
      } else {
        setProjects(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-blue-200">Welcome back, {user.email}</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-blue-400 text-blue-200 hover:bg-blue-800 hover:text-white"
          >
            Sign Out
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/15 transition-colors">
            <CardHeader className="text-center">
              <FileText className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <CardTitle className="text-white">Generate New SOW</CardTitle>
              <CardDescription className="text-blue-200">
                Create a professional scope of work with manufacturer analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/sow-generation">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Project
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-green-400/30">
            <CardHeader className="text-center">
              <Wind className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <CardTitle className="text-white">Enhanced Analysis</CardTitle>
              <CardDescription className="text-blue-200">
                Advanced manufacturer screening with NOA validation
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                  Live Scraping Active
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  HVHZ Compliance
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
            <CardHeader className="text-center">
              <Settings className="w-12 h-12 text-purple-400 mx-auto mb-2" />
              <CardTitle className="text-white">System Status</CardTitle>
              <CardDescription className="text-blue-200">
                Real-time system health and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200">Manufacturer Scrapers</span>
                  <Badge className="bg-green-500/20 text-green-300">Online</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200">Wind Calculations</span>
                  <Badge className="bg-green-500/20 text-green-300">Ready</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-200">NOA Database</span>
                  <Badge className="bg-green-500/20 text-green-300">Updated</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Info Card */}
        <Card className="mb-8 bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">Account Information</CardTitle>
            <CardDescription className="text-blue-200">
              Your account details and session information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-blue-200 text-sm font-medium">Email</Label>
                <p className="text-white mt-1">{user.email}</p>
              </div>
              <div>
                <Label className="text-blue-200 text-sm font-medium">User ID</Label>
                <p className="text-white mt-1 font-mono text-sm">{user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Section */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Your SOW Projects</CardTitle>
                <CardDescription className="text-blue-200">
                  Recent scope of work projects and their status
                </CardDescription>
              </div>
              <Link to="/sow-generation">
                <Button variant="outline" className="border-blue-400 text-blue-200 hover:bg-blue-800">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <div className="text-center py-8">
                <div className="text-blue-200">Loading projects...</div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4 opacity-50" />
                <div className="text-blue-200 mb-4">No SOW projects found</div>
                <p className="text-sm text-blue-300 mb-6">
                  Create your first professional scope of work with enhanced manufacturer analysis
                </p>
                <Link to="/sow-generation">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First SOW
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 bg-white/5 rounded-lg border border-blue-400/20 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <h3 className="text-white font-semibold">{project.project_name}</h3>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          {project.project_type || 'SOW'}
                        </Badge>
                      </div>
                      <span className="text-xs text-blue-300">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-blue-200 text-sm mb-3">{project.address}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-blue-300">Square Footage:</span>
                        <span className="text-white ml-2">{project.square_footage?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-blue-300">Building Height:</span>
                        <span className="text-white ml-2">{project.building_height || 'N/A'} ft</span>
                      </div>
                      <div>
                        <span className="text-blue-300">Wind Analysis:</span>
                        <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/30">
                          Complete
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;