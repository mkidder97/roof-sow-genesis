
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Target, 
  Eye, 
  Heart, 
  Users, 
  Shield, 
  Zap, 
  Building,
  CheckCircle,
  Award,
  Globe
} from 'lucide-react';

const About = () => {
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
          About SOW Genesis
        </Badge>
        <h1 className="text-5xl font-bold text-white mb-6">
          Revolutionizing Roofing
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400"> Industry Workflows</span>
        </h1>
        <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-8">
          We're transforming how roofing professionals collaborate, from field inspections 
          to engineering analysis and professional document generation.
        </p>
      </section>

      {/* Mission, Vision, Values */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Mission */}
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200">
                To revolutionize roofing industry workflows through innovative technology 
                that connects field inspectors, consultants, and engineers in seamless collaboration.
              </p>
            </CardContent>
          </Card>

          {/* Vision */}
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardHeader>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Our Vision</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200">
                To become the industry standard for roofing workflow management, 
                driving efficiency, accuracy, and professionalism across all project phases.
              </p>
            </CardContent>
          </Card>

          {/* Values */}
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Our Values</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200">
                Innovation, reliability, and customer success. We're committed to 
                delivering cutting-edge solutions that exceed expectations.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Technology & Innovation */}
      <section className="container mx-auto px-4 py-16 bg-white/5 backdrop-blur-sm rounded-lg my-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Technology & Innovation</h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Built on modern technology stack with enterprise-grade security and performance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">AI-Powered Analysis</h3>
            <p className="text-blue-200 text-sm">Advanced algorithms for manufacturer intelligence and wind analysis</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Enterprise Security</h3>
            <p className="text-blue-200 text-sm">Bank-level encryption and compliance with industry standards</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">Cloud Infrastructure</h3>
            <p className="text-blue-200 text-sm">Scalable architecture with 99.9% uptime guarantee</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-white font-semibold mb-2">API Integration</h3>
            <p className="text-blue-200 text-sm">Comprehensive APIs for custom integrations and workflows</p>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-8 text-center">Our Story</h2>
          <div className="space-y-6 text-blue-200 text-lg">
            <p>
              SOW Genesis was founded by industry veterans who experienced firsthand the 
              inefficiencies and communication gaps in traditional roofing workflows. 
              From missed details in field inspections to delays in engineering analysis, 
              we saw how technology could transform the industry.
            </p>
            <p>
              Our platform emerged from real-world challenges: field inspectors struggling 
              with paper forms and disconnected systems, consultants managing client 
              requirements across multiple tools, and engineers recreating SOW documents 
              from scratch for every project.
            </p>
            <p>
              Today, SOW Genesis serves roofing professionals across the industry, from 
              small inspection teams to large engineering firms. Our integrated approach 
              has helped eliminate workflow bottlenecks, improve accuracy, and deliver 
              professional results that exceed client expectations.
            </p>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Our Achievements</h2>
          <p className="text-xl text-blue-200">Milestones that demonstrate our commitment to excellence</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Industry Recognition</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-blue-200">
                <li className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>SOC 2 Type II Certified</span>
                </li>
                <li className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>GDPR Compliant</span>
                </li>
                <li className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>99.9% Uptime SLA</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Customer Success</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-blue-200">
                <li className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span>500+ Active Users</span>
                </li>
                <li className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span>98% Customer Satisfaction</span>
                </li>
                <li className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span>50% Time Savings</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white">Platform Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-blue-200">
                <li className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>10,000+ Projects Managed</span>
                </li>
                <li className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>1M+ Documents Generated</span>
                </li>
                <li className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>24/7 Global Support</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join Our Mission?
          </h2>
          <p className="text-xl text-blue-200 mb-8">
            Be part of the transformation that's reshaping the roofing industry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/auth')}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3 h-auto"
            >
              Get Started Today
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/contact')}
              className="border-blue-400 text-blue-200 hover:bg-blue-600/20 text-lg px-8 py-3 h-auto"
            >
              Contact Our Team
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
