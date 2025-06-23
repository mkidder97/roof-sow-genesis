
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  FileText, 
  Building, 
  Users, 
  Smartphone,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  Star,
  MapPin,
  Camera,
  CloudUpload
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">SOW Genesis</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/about')}
                className="text-white hover:text-blue-200"
              >
                About
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/services')}
                className="text-white hover:text-blue-200"
              >
                Services
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/pricing')}
                className="text-white hover:text-blue-200"
              >
                Pricing
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/team')}
                className="text-white hover:text-blue-200"
              >
                Team
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-blue-600/20 text-blue-200 border-blue-400/30">
            Revolutionary Multi-Role Platform
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Professional Roofing
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400"> Workflow Platform</span>
          </h1>
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto">
            Streamline inspections, consultations, and SOW generation with our integrated 
            multi-role platform. From field to final delivery, manage your entire roofing workflow.
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
              onClick={() => navigate('/services')}
              className="border-blue-400 text-blue-200 hover:bg-blue-600/20 text-lg px-8 py-3 h-auto"
            >
              View Demo
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 flex items-center justify-center gap-8 text-blue-200">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Enterprise Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="relative z-10 py-20 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Complete Workflow Solution
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              From mobile field inspections to professional SOW generation, 
              our platform handles every aspect of your roofing projects.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mobile Field Inspections */}
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white">Mobile-First Inspections</CardTitle>
                <CardDescription className="text-blue-200">
                  Comprehensive field data collection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-green-400" />
                    GPS-enabled photo capture
                  </li>
                  <li className="flex items-center gap-2">
                    <CloudUpload className="w-4 h-4 text-green-400" />
                    Offline with auto-sync
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Real-time validation
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* AI-Powered SOW */}
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white">AI-Powered SOW</CardTitle>
                <CardDescription className="text-blue-200">
                  Intelligent document generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-400" />
                    Manufacturer intelligence
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    ASCE wind analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-400" />
                    Professional PDFs
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Real-Time Collaboration */}
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white">Real-Time Collaboration</CardTitle>
                <CardDescription className="text-blue-200">
                  Multi-role team coordination
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Live activity feeds
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-purple-400" />
                    Multi-role handoffs
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    Instant notifications
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Enterprise Management */}
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white">Enterprise Management</CardTitle>
                <CardDescription className="text-blue-200">
                  Secure file and project management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-blue-100">
                  <li className="flex items-center gap-2">
                    <CloudUpload className="w-4 h-4 text-orange-400" />
                    Cloud storage with versioning
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-400" />
                    Metadata extraction
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-400" />
                    Compliance audit trails
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Roofing Workflow?
            </h2>
            <p className="text-xl text-blue-200 mb-8">
              Join hundreds of roofing professionals who have streamlined their operations 
              with our comprehensive platform.
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
                onClick={() => navigate('/contact')}
                className="border-blue-400 text-blue-200 hover:bg-blue-600/20 text-lg px-8 py-3 h-auto"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/20 backdrop-blur-sm border-t border-white/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">SOW Genesis</span>
              </div>
              <p className="text-blue-200 text-sm">
                Professional roofing workflow platform for inspectors, consultants, and engineers.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><button onClick={() => navigate('/services')} className="hover:text-white">Features</button></li>
                <li><button onClick={() => navigate('/pricing')} className="hover:text-white">Pricing</button></li>
                <li><button onClick={() => navigate('/auth')} className="hover:text-white">Get Started</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><button onClick={() => navigate('/about')} className="hover:text-white">About</button></li>
                <li><button onClick={() => navigate('/team')} className="hover:text-white">Team</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-white">Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><button onClick={() => navigate('/faq')} className="hover:text-white">FAQ</button></li>
                <li><button onClick={() => navigate('/terms')} className="hover:text-white">Terms</button></li>
                <li><button onClick={() => navigate('/privacy')} className="hover:text-white">Privacy</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p className="text-blue-200 text-sm">
              © 2024 SOW Genesis. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
