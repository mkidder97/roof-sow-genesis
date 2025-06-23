
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Smartphone, 
  Users, 
  FileText, 
  Building,
  CheckCircle,
  MapPin,
  Camera,
  CloudUpload,
  Zap,
  Shield,
  Clock,
  ArrowRight,
  Star,
  Globe
} from 'lucide-react';

const Services = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <Button 
          onClick={() => navigate('/')}
          variant="outline" 
          className="mb-6 border-blue-400 text-blue-200 hover:bg-blue-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <Badge className="mb-6 bg-blue-600/20 text-blue-200 border-blue-400/30">
          Professional Services
        </Badge>
        <h1 className="text-5xl font-bold text-white mb-6">
          Comprehensive Roofing
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400"> Workflow Solutions</span>
        </h1>
        <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-8">
          From mobile field inspections to engineering analysis and professional 
          document generation - we provide the complete toolkit for modern roofing professionals.
        </p>
      </section>

      {/* Core Services */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Field Inspection Platform */}
          <Card className="bg-white/10 backdrop-blur-md border-green-400/30">
            <CardHeader>
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-white text-2xl mb-2">Field Inspection Platform</CardTitle>
              <CardDescription className="text-green-200 text-lg">
                Mobile-optimized inspection tools for comprehensive field data collection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Camera className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">GPS-Enabled Photo Capture</h4>
                    <p className="text-green-200 text-sm">Automatically geo-tag photos with precise location data and timestamps</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CloudUpload className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Offline Capability</h4>
                    <p className="text-green-200 text-sm">Work without internet connection, auto-sync when back online</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Dynamic Checklists</h4>
                    <p className="text-green-200 text-sm">Intelligent forms that adapt based on roof type and project requirements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Remote Site Access</h4>
                    <p className="text-green-200 text-sm">Optimized for field work in areas with limited connectivity</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-600/20 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Perfect For:</h5>
                <ul className="text-green-200 text-sm space-y-1">
                  <li>• Field inspectors and assessment teams</li>
                  <li>• Remote site documentation</li>
                  <li>• Quality control and compliance</li>
                  <li>• Insurance claim documentation</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Consultant Workflow Management */}
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-white text-2xl mb-2">Consultant Workflow Management</CardTitle>
              <CardDescription className="text-blue-200 text-lg">
                Comprehensive client requirement analysis and project scope management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Client Requirement Analysis</h4>
                    <p className="text-blue-200 text-sm">Structured analysis of client needs, budget, and timeline requirements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-blue-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Scope Modification Tools</h4>
                    <p className="text-blue-200 text-sm">Dynamic tools for adjusting project scope based on field findings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Risk Assessment Features</h4>
                    <p className="text-blue-200 text-sm">Comprehensive risk analysis and mitigation planning</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Timeline Management</h4>
                    <p className="text-blue-200 text-sm">Advanced scheduling and deadline tracking across project phases</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-600/20 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Perfect For:</h5>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• Roofing consultants and advisors</li>
                  <li>• Project managers and coordinators</li>
                  <li>• Client relationship management</li>
                  <li>• Multi-stakeholder projects</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Engineering SOW Generation */}
          <Card className="bg-white/10 backdrop-blur-md border-purple-400/30">
            <CardHeader>
              <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-white text-2xl mb-2">Engineering SOW Generation</CardTitle>
              <CardDescription className="text-purple-200 text-lg">
                AI-powered professional document generation with engineering analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Automated Compliance Checking</h4>
                    <p className="text-purple-200 text-sm">Built-in ASCE wind analysis and building code compliance validation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Manufacturer Database Integration</h4>
                    <p className="text-purple-200 text-sm">Comprehensive database with real-time manufacturer specifications</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Professional Deliverable Creation</h4>
                    <p className="text-purple-200 text-sm">Publication-ready PDFs with engineering stamps and calculations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Dynamic Section Mapping</h4>
                    <p className="text-purple-200 text-sm">Intelligent content generation based on project parameters</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-600/20 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Perfect For:</h5>
                <ul className="text-purple-200 text-sm space-y-1">
                  <li>• Structural engineers and PE professionals</li>
                  <li>• Technical document creation</li>
                  <li>• Code compliance verification</li>
                  <li>• Professional engineering deliverables</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Enterprise Integration */}
          <Card className="bg-white/10 backdrop-blur-md border-orange-400/30">
            <CardHeader>
              <div className="w-16 h-16 bg-orange-600 rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-white text-2xl mb-2">Enterprise Integration</CardTitle>
              <CardDescription className="text-orange-200 text-lg">
                Scalable solutions for large organizations with custom integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-orange-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">API Access</h4>
                    <p className="text-orange-200 text-sm">Comprehensive REST APIs for custom integrations and automation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-orange-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Multi-Tenant Architecture</h4>
                    <p className="text-orange-200 text-sm">Secure, scalable infrastructure for enterprise-level deployments</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-orange-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">White-Label Solutions</h4>
                    <p className="text-orange-200 text-sm">Customizable branding and interface for your organization</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-orange-400 mt-1" />
                  <div>
                    <h4 className="text-white font-semibold">Dedicated Support</h4>
                    <p className="text-orange-200 text-sm">24/7 enterprise support with dedicated account management</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-600/20 rounded-lg p-4">
                <h5 className="text-white font-semibold mb-2">Perfect For:</h5>
                <ul className="text-orange-200 text-sm space-y-1">
                  <li>• Large roofing contractors and firms</li>
                  <li>• Enterprise software integrations</li>
                  <li>• Custom workflow requirements</li>
                  <li>• Multi-location organizations</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Process Flow */}
      <section className="container mx-auto px-4 py-16 bg-white/5 backdrop-blur-sm rounded-lg my-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Complete Workflow Integration</h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            See how our services work together to create a seamless end-to-end workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">1</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Field Inspection</h3>
            <p className="text-blue-200 text-sm">Mobile data collection with photos and measurements</p>
            <ArrowRight className="w-6 h-6 text-blue-400 mx-auto mt-4 hidden md:block" />
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">2</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Consultant Review</h3>
            <p className="text-blue-200 text-sm">Analysis of requirements and scope refinement</p>
            <ArrowRight className="w-6 h-6 text-blue-400 mx-auto mt-4 hidden md:block" />
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">3</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Engineering Analysis</h3>
            <p className="text-blue-200 text-sm">Technical validation and SOW generation</p>
            <ArrowRight className="w-6 h-6 text-blue-400 mx-auto mt-4 hidden md:block" />
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">4</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Professional Delivery</h3>
            <p className="text-blue-200 text-sm">Final documents and project completion</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-blue-200 mb-8">
            Choose the services that fit your needs, or get the complete platform 
            for maximum efficiency and collaboration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3 h-auto"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/pricing')}
              className="border-blue-400 text-blue-200 hover:bg-blue-600/20 text-lg px-8 py-3 h-auto"
            >
              View Pricing
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
