
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProjectMetadataSection } from './sections/ProjectMetadataSection';
import { EnvironmentalSection } from './sections/EnvironmentalSection';
import { WindParametersSection } from './sections/WindParametersSection';
import { MembraneSection } from './sections/MembraneSection';
import { InsulationSection } from './sections/InsulationSection';
import { TakeoffSection } from './sections/TakeoffSection';
import { NotesSection } from './sections/NotesSection';
import { generateSOW } from '@/lib/api';
import type { SOWData } from '@/types/sow';

export const SOWInputForm = () => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFile, setGeneratedFile] = useState<any>(null);
  const [formData, setFormData] = useState<SOWData>({
    projectMetadata: {
      projectName: '',
      companyName: '',
      address: '',
      squareFootage: 0,
      projectType: 'Replacement',
      deckType: 'Steel',
      buildingHeight: 0,
      length: 0,
      width: 0,
    },
    environmental: {
      city: '',
      state: '',
      zip: '',
      jurisdiction: '',
      elevation: 0,
      exposureCategory: 'B',
      asceVersion: '7-22',
      hvhzZone: false,
    },
    windParameters: {
      basicWindSpeed: 0,
      designPressures: {
        zone1: 0,
        zone2: 0,
        zone3: 0,
      },
    },
    membrane: {
      manufacturer: '',
      productName: '',
      membraneType: 'TPO',
      thickness: 60,
      attachmentMethod: 'Mechanically Attached',
      warrantyTerm: 20,
    },
    insulation: {
      type: 'Polyiso',
      rValue: 0,
      coverboardRequired: false,
    },
    takeoff: {
      drains: 0,
      pipePenetrations: 0,
      curbs: 0,
      hvacUnits: 0,
      skylights: 0,
      expansionJoints: false,
      scuppers: 0,
    },
    notes: {
      addendaNotes: '',
      warrantyNotes: '',
      contractorName: '',
    },
  });

  const updateFormData = (section: keyof SOWData, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.projectMetadata.projectName || !formData.projectMetadata.address) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields: Project Name and Address",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Submitting SOW data:', formData);
      const result = await generateSOW(formData);
      
      setGeneratedFile(result);
      toast({
        title: "SOW Generated Successfully!",
        description: `PDF generated in ${result.generationTime}ms`,
      });
    } catch (error) {
      console.error('Error generating SOW:', error);
      toast({
        title: "Generation Failed",
        description: "There was an error generating your SOW. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <ProjectMetadataSection 
          data={formData.projectMetadata}
          onChange={(data) => updateFormData('projectMetadata', data)}
        />
        
        <EnvironmentalSection 
          data={formData.environmental}
          onChange={(data) => updateFormData('environmental', data)}
          address={formData.projectMetadata.address}
        />
        
        <WindParametersSection 
          data={formData.windParameters}
          onChange={(data) => updateFormData('windParameters', data)}
        />
        
        <MembraneSection 
          data={formData.membrane}
          onChange={(data) => updateFormData('membrane', data)}
        />
        
        <InsulationSection 
          data={formData.insulation}
          onChange={(data) => updateFormData('insulation', data)}
        />
        
        <TakeoffSection 
          data={formData.takeoff}
          onChange={(data) => updateFormData('takeoff', data)}
        />
        
        <NotesSection 
          data={formData.notes}
          onChange={(data) => updateFormData('notes', data)}
        />

        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                Generate Your SOW
              </h3>
              <p className="text-slate-600">
                Create a professional PDF scope of work document
              </p>
            </div>
            <Button
              type="submit"
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate SOW
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>

      {generatedFile && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-1">
                SOW Generated Successfully!
              </h3>
              <p className="text-green-700">
                File: {generatedFile.filename} ({generatedFile.fileSizeKB} KB)
              </p>
            </div>
            <Button 
              onClick={() => {
                // In a real implementation, this would download the file
                console.log('Downloading:', generatedFile.outputPath);
                toast({
                  title: "Download Started",
                  description: "Your SOW PDF is being downloaded",
                });
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
