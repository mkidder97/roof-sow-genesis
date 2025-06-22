
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import '@/styles/tesla-ui.css';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="tesla-dark min-h-screen tesla-scrollbar">
      {/* Tesla-Style Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-tesla-bg-primary via-tesla-bg-secondary to-tesla-bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.05),transparent_50%)]"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="tesla-glass-card mx-4 mt-4 mb-8">
          <div className="container mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="tesla-h2 mb-2">Dashboard</h1>
                <p className="tesla-body text-tesla-text-secondary">
                  Welcome back, {user.email}
                </p>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="border-tesla-blue text-tesla-blue hover:bg-tesla-blue hover:text-white"
                >
                  Home
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-tesla-warning text-tesla-warning hover:bg-tesla-warning hover:text-white"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Projects Card */}
            <Card className="tesla-glass-card border-tesla-surface">
              <CardHeader>
                <CardTitle className="tesla-h3">My Projects</CardTitle>
                <CardDescription className="tesla-small text-tesla-text-muted">
                  Manage your TPO roof projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="tesla-body text-tesla-text-secondary mb-4">
                    No projects yet
                  </p>
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-tesla-blue hover:bg-tesla-blue-light"
                  >
                    Create First Project
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent SOWs */}
            <Card className="tesla-glass-card border-tesla-surface">
              <CardHeader>
                <CardTitle className="tesla-h3">Recent SOWs</CardTitle>
                <CardDescription className="tesla-small text-tesla-text-muted">
                  Your latest generated documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="tesla-body text-tesla-text-secondary">
                    No SOWs generated yet
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="tesla-glass-card border-tesla-surface">
              <CardHeader>
                <CardTitle className="tesla-h3">Account Info</CardTitle>
                <CardDescription className="tesla-small text-tesla-text-muted">
                  Your account details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="tesla-small text-tesla-text-muted">Email</Label>
                    <p className="tesla-body">{user.email}</p>
                  </div>
                  <div>
                    <Label className="tesla-small text-tesla-text-muted">Member Since</Label>
                    <p className="tesla-body">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
