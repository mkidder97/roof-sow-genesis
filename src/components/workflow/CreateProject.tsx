
import React, { useState } from 'react';
import { useWorkflow } from '@/hooks/useWorkflow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building, Users, MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateProject = () => {
  const navigate = useNavigate();
  const { createProject, isCreatingProject } = useWorkflow();
  const [formData, setFormData] = useState({
    project_name: '',
    address: '',
    building_height: '',
    square_footage: '',
    deck_type: 'Steel',
    project_type: 'recover',
    assigned_inspector: '',
    assigned_consultant: '',
    assigned_engineer: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData = {
      project_name: formData.project_name,
      address: formData.address,
      building_height: formData.building_height ? Number(formData.building_height) : undefined,
      square_footage: formData.square_footage ? Number(formData.square_footage) : undefined,
      deck_type: formData.deck_type,
      project_type: formData.project_type,
      assigned_inspector: formData.assigned_inspector || undefined,
      assigned_consultant: formData.assigned_consultant || undefined,
      assigned_engineer: formData.assigned_engineer || undefined,
    };

    createProject(projectData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => navigate('/workflow')}
            variant="outline" 
            className="mb-4 border-blue-400 text-blue-200 hover:bg-blue-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Create New Project</h1>
            <p className="text-blue-200">Set up a new roofing project with workflow assignments</p>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building className="w-5 h-5" />
              Project Details
            </CardTitle>
            <CardDescription className="text-blue-200">
              Enter the basic project information and team assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Project Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="project_name" className="text-blue-200">Project Name *</Label>
                    <Input
                      id="project_name"
                      value={formData.project_name}
                      onChange={(e) => handleInputChange('project_name', e.target.value)}
                      placeholder="Enter project name"
                      className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address" className="text-blue-200">Project Address *</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter full project address"
                      className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Building Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Building Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="building_height" className="text-blue-200">Building Height (ft)</Label>
                    <Input
                      id="building_height"
                      type="number"
                      value={formData.building_height}
                      onChange={(e) => handleInputChange('building_height', e.target.value)}
                      placeholder="30"
                      className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="square_footage" className="text-blue-200">Square Footage</Label>
                    <Input
                      id="square_footage"
                      type="number"
                      value={formData.square_footage}
                      onChange={(e) => handleInputChange('square_footage', e.target.value)}
                      placeholder="10000"
                      className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deck_type" className="text-blue-200">Deck Type</Label>
                    <Select value={formData.deck_type} onValueChange={(value) => handleInputChange('deck_type', value)}>
                      <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
                        <SelectValue placeholder="Select deck type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Steel">Steel</SelectItem>
                        <SelectItem value="Concrete">Concrete</SelectItem>
                        <SelectItem value="Wood">Wood</SelectItem>
                        <SelectItem value="Gypsum">Gypsum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="project_type" className="text-blue-200">Project Type</Label>
                    <Select value={formData.project_type} onValueChange={(value) => handleInputChange('project_type', value)}>
                      <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
                        <SelectValue placeholder="Select project type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recover">Recover</SelectItem>
                        <SelectItem value="tearoff">Tear-off</SelectItem>
                        <SelectItem value="new">New Construction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Team Assignments */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Assignments
                </h3>
                <p className="text-blue-200 text-sm">
                  Assign team members to this project (optional - can be done later)
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="assigned_inspector" className="text-blue-200">Assigned Inspector</Label>
                    <Input
                      id="assigned_inspector"
                      value={formData.assigned_inspector}
                      onChange={(e) => handleInputChange('assigned_inspector', e.target.value)}
                      placeholder="Inspector user ID or email"
                      className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="assigned_consultant" className="text-blue-200">Assigned Consultant</Label>
                    <Input
                      id="assigned_consultant"
                      value={formData.assigned_consultant}
                      onChange={(e) => handleInputChange('assigned_consultant', e.target.value)}
                      placeholder="Consultant user ID or email"
                      className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="assigned_engineer" className="text-blue-200">Assigned Engineer</Label>
                    <Input
                      id="assigned_engineer"
                      value={formData.assigned_engineer}
                      onChange={(e) => handleInputChange('assigned_engineer', e.target.value)}
                      placeholder="Engineer user ID or email"
                      className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button 
                  type="submit" 
                  disabled={isCreatingProject || !formData.project_name || !formData.address}
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                >
                  {isCreatingProject ? 'Creating Project...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateProject;
