import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
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
            <CardTitle className="text-white">Your Projects</CardTitle>
            <CardDescription className="text-blue-200">
              SOW projects associated with your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProjects ? (
              <div className="text-center py-8">
                <div className="text-blue-200">Loading projects...</div>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-blue-200 mb-4">No projects found</div>
                <p className="text-sm text-blue-300">
                  Create your first SOW project to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="p-4 bg-white/5 rounded-lg border border-blue-400/20"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-semibold">{project.project_name}</h3>
                      <span className="text-xs text-blue-300">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-blue-200 text-sm mb-2">{project.address}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-300">Square Footage:</span>
                        <span className="text-white ml-2">{project.square_footage?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-blue-300">Project Type:</span>
                        <span className="text-white ml-2 capitalize">{project.project_type || 'N/A'}</span>
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
