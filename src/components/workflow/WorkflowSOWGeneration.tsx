
import React, { useState } from 'react';
import { useWorkflow } from '@/hooks/useWorkflow';
import { useSOWGeneration } from '@/hooks/useSOWGeneration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Users, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WorkflowSOWGeneration = () => {
  const navigate = useNavigate();
  const { projects, selectedProject, setSelectedProject } = useWorkflow();
  const { generateSOW, isGenerating } = useSOWGeneration();
  const [engineerNotes, setEngineerNotes] = useState('');
  const [includeAuditTrail, setIncludeAuditTrail] = useState(true);

  // Filter projects ready for SOW generation (engineering stage or complete)
  const engineeringProjects = projects.filter(p => 
    p.current_stage === 'engineering' || p.current_stage === 'complete'
  );

  const handleGenerateSOW = async () => {
    if (!selectedProject) return;

    const sowRequest = {
      projectName: selectedProject.project_name,
      projectAddress: selectedProject.address,
      city: selectedProject.address.split(',')[1]?.trim() || '',
      state: selectedProject.address.split(',')[2]?.trim() || '',
      zipCode: selectedProject.address.split(' ').pop() || '',
      buildingHeight: selectedProject.building_height || 30,
      deckType: selectedProject.deck_type || 'Steel',
      membraneType: selectedProject.membrane_thickness || 'TPO',
      insulationType: selectedProject.insulation_type || 'Polyiso',
      windSpeed: 120,
      exposureCategory: 'C' as const,
      buildingClassification: 'II' as const
    };

    try {
      await generateSOW(sowRequest);
    } catch (error) {
      console.error('SOW generation failed:', error);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'inspection': return 'bg-yellow-500';
      case 'consultant_review': return 'bg-blue-500';
      case 'engineering': return 'bg-purple-500';
      case 'complete': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
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
            <h1 className="text-3xl font-bold text-white mb-2">Workflow SOW Generation</h1>
            <p className="text-blue-200">Generate SOW documents from completed workflow projects</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Selection */}
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Project
              </CardTitle>
              <CardDescription className="text-blue-200">
                Choose a project in engineering stage for SOW generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {engineeringProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-200">No projects ready for SOW generation</p>
                  <p className="text-blue-300 text-sm mt-2">
                    Projects must be in engineering stage or complete
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {engineeringProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedProject?.id === project.id
                          ? 'bg-blue-600/30 border-blue-400'
                          : 'bg-white/5 border-blue-400/30 hover:bg-white/10'
                      }`}
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{project.project_name}</h3>
                          <p className="text-blue-200 text-sm mt-1">{project.address}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`${getStageColor(project.current_stage)} text-white text-xs`}>
                              {project.current_stage.replace('_', ' ')}
                            </Badge>
                            {project.square_footage && (
                              <Badge variant="outline" className="border-blue-400 text-blue-200 text-xs">
                                {project.square_footage.toLocaleString()} sq ft
                              </Badge>
                            )}
                          </div>
                        </div>
                        {selectedProject?.id === project.id && (
                          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SOW Configuration */}
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                SOW Configuration
              </CardTitle>
              <CardDescription className="text-blue-200">
                Configure SOW generation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedProject ? (
                <>
                  <div>
                    <label className="text-blue-200 text-sm font-medium mb-2 block">
                      Engineer Notes
                    </label>
                    <Textarea
                      value={engineerNotes}
                      onChange={(e) => setEngineerNotes(e.target.value)}
                      placeholder="Add any additional engineering notes or specifications..."
                      className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-blue-200 text-sm font-medium mb-2 block">
                      Include Audit Trail
                    </label>
                    <Select 
                      value={includeAuditTrail ? 'yes' : 'no'}
                      onValueChange={(value) => setIncludeAuditTrail(value === 'yes')}
                    >
                      <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes - Include workflow history</SelectItem>
                        <SelectItem value="no">No - SOW only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Project Summary */}
                  <div className="bg-white/5 rounded-lg p-4 mt-6">
                    <h4 className="text-white font-semibold mb-3">Project Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-200">Project:</span>
                        <span className="text-white">{selectedProject.project_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Stage:</span>
                        <Badge className={`${getStageColor(selectedProject.current_stage)} text-white text-xs`}>
                          {selectedProject.current_stage.replace('_', ' ')}
                        </Badge>
                      </div>
                      {selectedProject.square_footage && (
                        <div className="flex justify-between">
                          <span className="text-blue-200">Area:</span>
                          <span className="text-white">{selectedProject.square_footage.toLocaleString()} sq ft</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-blue-200">Type:</span>
                        <span className="text-white">{selectedProject.project_type || 'recover'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={handleGenerateSOW}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg mt-6"
                  >
                    {isGenerating ? (
                      <>
                        <Clock className="w-5 h-5 mr-2 animate-spin" />
                        Generating SOW...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        Generate SOW
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <p className="text-blue-200">Select a project to configure SOW generation</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workflow Integration Info */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Workflow Integration Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white">Multi-role data compilation</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white">Complete audit trail</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white">Quality assurance validation</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white">Professional collaboration tracking</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white">Engineering validation</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white">Consultant expertise integration</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkflowSOWGeneration;
