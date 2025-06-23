
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkflow } from '@/hooks/useWorkflow';
import { useSOWGeneration } from '@/hooks/useSOWGeneration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  ClipboardCheck,
  Download,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WorkflowSOWGeneration = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects } = useWorkflow();
  const { generateSOW, isGenerating, generationProgress, generationStatus } = useSOWGeneration();
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [engineerNotes, setEngineerNotes] = useState('');
  const [includeAuditTrail, setIncludeAuditTrail] = useState(true);

  // Filter projects that are ready for SOW generation
  const readyProjects = projects.filter(p => p.current_stage === 'engineering');
  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleGenerateSOW = () => {
    if (!selectedProjectId) return;

    const sowData = {
      project_id: selectedProjectId,
      engineer_notes: engineerNotes,
      include_audit_trail: includeAuditTrail,
      projectName: selectedProject?.project_name || 'Unnamed Project',
      projectAddress: selectedProject?.address || '',
      city: '',
      state: '',
      zipCode: '',
      buildingHeight: selectedProject?.building_height || 30,
      deckType: selectedProject?.deck_type || 'Steel',
      membraneType: 'TPO',
      insulationType: 'Polyisocyanurate',
      windSpeed: 90,
      exposureCategory: 'C',
      buildingClassification: 'II',
    };

    generateSOW(sowData);
  };

  const getProjectSuitability = (project: any) => {
    const hasInspection = project.stage_data?.inspection;
    const hasConsultantReview = project.stage_data?.consultant_review;
    const isEngineering = project.current_stage === 'engineering';
    
    if (isEngineering && hasInspection && hasConsultantReview) {
      return { suitable: true, reason: 'Ready for SOW generation' };
    } else if (!isEngineering) {
      return { suitable: false, reason: `Currently in ${project.current_stage} stage` };
    } else if (!hasInspection) {
      return { suitable: false, reason: 'Missing field inspection data' };
    } else if (!hasConsultantReview) {
      return { suitable: false, reason: 'Missing consultant review' };
    }
    
    return { suitable: false, reason: 'Unknown issue' };
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
            <h1 className="text-3xl font-bold text-white mb-2">Workflow-Integrated SOW Generation</h1>
            <p className="text-blue-200">Generate comprehensive SOWs from multi-role workflow data</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Select Project for SOW Generation
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Choose a project in the engineering stage to generate a comprehensive SOW
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="project-select" className="text-blue-200">Project</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="bg-white/20 border-blue-400/30 text-white">
                      <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {readyProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.project_name} - {project.address}
                        </SelectItem>
                      ))}
                      {readyProjects.length === 0 && (
                        <SelectItem value="" disabled>
                          No projects ready for SOW generation
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProject && (
                  <div className="p-4 bg-white/5 rounded-lg space-y-3">
                    <h4 className="font-medium text-white">Project Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-200">Address:</span>
                        <p className="text-white">{selectedProject.address}</p>
                      </div>
                      <div>
                        <span className="text-blue-200">Stage:</span>
                        <Badge className="ml-2 bg-purple-500 text-white">
                          {selectedProject.current_stage.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-blue-200">Building Height:</span>
                        <p className="text-white">{selectedProject.building_height || 'Not specified'} ft</p>
                      </div>
                      <div>
                        <span className="text-blue-200">Square Footage:</span>
                        <p className="text-white">{selectedProject.square_footage?.toLocaleString() || 'Not specified'} sq ft</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="engineer-notes" className="text-blue-200">Engineer Notes (Optional)</Label>
                  <Textarea
                    id="engineer-notes"
                    value={engineerNotes}
                    onChange={(e) => setEngineerNotes(e.target.value)}
                    placeholder="Add any specific engineering notes or requirements..."
                    className="bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="audit-trail"
                    checked={includeAuditTrail}
                    onChange={(e) => setIncludeAuditTrail(e.target.checked)}
                    className="rounded border-blue-400"
                  />
                  <Label htmlFor="audit-trail" className="text-blue-200">
                    Include workflow audit trail in SOW
                  </Label>
                </div>

                <Button
                  onClick={handleGenerateSOW}
                  disabled={!selectedProjectId || isGenerating}
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Generating SOW...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      Generate Workflow SOW
                    </>
                  )}
                </Button>

                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={generationProgress} className="w-full" />
                    <p className="text-blue-200 text-sm text-center">{generationStatus}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Status & Features */}
          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white">Workflow Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white text-sm">Multi-role data compilation</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white text-sm">Field inspection integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white text-sm">Consultant review data</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white text-sm">Professional audit trail</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white text-sm">Engineering calculations</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white text-sm">Collaboration tracking</span>
                </div>
              </CardContent>
            </Card>

            {/* Available Projects Status */}
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white">Project Readiness</CardTitle>
                <CardDescription className="text-blue-200">
                  Status of projects available for SOW generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects.slice(0, 5).map((project) => {
                    const suitability = getProjectSuitability(project);
                    return (
                      <div key={project.id} className="p-3 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white text-sm font-medium">
                            {project.project_name}
                          </span>
                          {suitability.suitable ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                          )}
                        </div>
                        <p className="text-blue-200 text-xs">{suitability.reason}</p>
                      </div>
                    );
                  })}
                  
                  {projects.length === 0 && (
                    <div className="text-center text-blue-200 py-4">
                      <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No projects available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowSOWGeneration;
