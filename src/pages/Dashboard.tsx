import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Building, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ClipboardCheck,
  Loader2,
  Users
} from 'lucide-react';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <div className="text-white text-xl flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to SOW Genesis
          </h1>
          <p className="text-blue-200 text-lg">
            Professional roof scope of work generation platform
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Add workflow tab in TabsList */}
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/10 backdrop-blur-md">
            {/* Existing tabs */}
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="sow-generation" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4" />
              SOW Generation
            </TabsTrigger>
            <TabsTrigger 
              value="field-inspector" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <ClipboardCheck className="w-4 h-4" />
              Field Inspector
            </TabsTrigger>
            <TabsTrigger 
              value="projects" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Building className="w-4 h-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger 
              value="workflow" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              Workflow
            </TabsTrigger>
          </TabsList>

          {/* Existing TabsContent */}
          <TabsContent value="overview" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h2>
              <p className="text-blue-200">Quick access to your most important tools and information</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    SOW Generation
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    Create professional scope of work documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-100 text-sm mb-4">
                    Generate comprehensive SOW documents with engineering calculations, 
                    manufacturer analysis, and professional formatting.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('sow-generation')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Start SOW Generation
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-green-400" />
                    Field Inspector
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    Mobile-first field inspection interface
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-100 text-sm mb-4">
                    Collect field data on mobile devices, capture photos, and 
                    automatically populate SOW generation workflows.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('field-inspector')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Open Field Inspector
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-400" />
                    Project Management
                  </CardTitle>
                  <CardDescription className="text-blue-200">
                    Manage all your roofing projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-100 text-sm mb-4">
                    Track project progress, manage inspections, and maintain 
                    a complete history of all your work.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('projects')}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    View Projects
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white">Platform Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Dynamic SOW Generation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Mobile Field Inspections</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Engineering Calculations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Manufacturer Analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Professional PDF Output</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white">Getting Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                      <div>
                        <p className="text-white font-medium">Create Field Inspection</p>
                        <p className="text-blue-200 text-sm">Use mobile interface to collect site data</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                      <div>
                        <p className="text-white font-medium">Generate SOW</p>
                        <p className="text-blue-200 text-sm">Convert inspection data to professional SOW</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                      <div>
                        <p className="text-white font-medium">Download & Share</p>
                        <p className="text-blue-200 text-sm">Export PDF and deliver to clients</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SOW Generation Tab */}
          <TabsContent value="sow-generation" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">SOW Generation</h2>
              <p className="text-blue-200">Create professional scope of work documents with engineering analysis</p>
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Advanced SOW Generation</h3>
                <p className="text-blue-200 mb-6">
                  Generate comprehensive scope of work documents with dynamic section mapping, 
                  engineering calculations, and manufacturer analysis.
                </p>
                <Button 
                  onClick={() => window.location.href = '/sow-generation'}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg h-auto"
                  size="lg"
                >
                  Start SOW Generation
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Field Inspector Tab */}
          <TabsContent value="field-inspector" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Field Inspector</h2>
              <p className="text-blue-200">Mobile-first interface for field data collection and inspection management</p>
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardContent className="p-8 text-center">
                <ClipboardCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Mobile Field Inspections</h3>
                <p className="text-blue-200 mb-6">
                  Collect comprehensive field data on mobile devices, capture photos, and automatically 
                  populate SOW generation workflows with inspection data.
                </p>
                <Button 
                  onClick={() => window.location.href = '/field-inspector'}
                  className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg h-auto"
                  size="lg"
                >
                  Open Field Inspector
                </Button>
              </CardContent>
            </Card>

            {/* Field Inspector Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white">Inspection Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Multi-step mobile forms</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Photo capture & upload</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Equipment inventory</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Condition assessments</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white">Mobile Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Touch-optimized interface</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Auto-save functionality</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Image compression</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Offline capability</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Project Management</h2>
              <p className="text-blue-200">Manage and track all your roofing projects in one place</p>
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardContent className="p-8 text-center">
                <Building className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
                <p className="text-blue-200 mb-6">
                  Comprehensive project management features are being developed to help you 
                  track inspections, SOW generation, and project completion status.
                </p>
                <Badge variant="outline" className="border-purple-400 text-purple-200">
                  In Development
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Multi-Role Workflow</h2>
              <p className="text-blue-200">Complete project lifecycle from inspection to SOW generation</p>
            </div>

            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardContent className="p-8 text-center">
                <Users className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Multi-Role Project Management</h3>
                <p className="text-blue-200 mb-6">
                  Comprehensive workflow system supporting Inspector → Consultant → Engineer collaboration 
                  with integrated SOW generation from multi-role data compilation.
                </p>
                <Button 
                  onClick={() => window.location.href = '/workflow'}
                  className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg h-auto"
                  size="lg"
                >
                  Open Workflow Dashboard
                </Button>
              </CardContent>
            </Card>

            {/* Workflow Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white">Workflow Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Multi-role dashboards</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Project lifecycle management</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Role-based task assignment</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Handoff validation system</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white">SOW Integration</CardHeader>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Workflow-aware SOW generation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Multi-role data compilation</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Professional audit trails</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-white">Collaboration tracking</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
