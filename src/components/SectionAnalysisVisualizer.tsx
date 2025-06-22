
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, X, FileText, AlertTriangle, Info } from 'lucide-react';
import { SectionAnalysis } from '@/types/engineering';

interface SectionAnalysisVisualizerProps {
  analysis: SectionAnalysis;
}

export const SectionAnalysisVisualizer: React.FC<SectionAnalysisVisualizerProps> = ({ analysis }) => {
  if (!analysis) {
    return null;
  }

  const { includedSections, excludedSections, confidenceScore } = analysis;

  return (
    <Card className="border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Section Analysis
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-600">
              {includedSections.length} included
            </Badge>
            <Badge variant="secondary">
              {excludedSections.length} excluded
            </Badge>
            <Badge variant="outline">
              {Math.round(confidenceScore * 100)}% confidence
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Included Sections */}
          {includedSections.length > 0 && (
            <div>
              <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Included Sections
              </h4>
              <Accordion type="multiple" className="w-full">
                {includedSections.map((section, index) => (
                  <AccordionItem key={section.id} value={`included-${index}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3 w-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <div className="flex-1">
                          <span className="font-medium">{section.title}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="default" className="bg-green-600 text-xs">Included</Badge>
                            {section.priority && (
                              <Badge variant="outline" className="text-xs">Priority {section.priority}</Badge>
                            )}
                            {section.warnings && section.warnings.length > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {section.warnings.length} warnings
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-4">
                        <div>
                          <h5 className="font-medium text-sm text-gray-700 mb-2">Rationale</h5>
                          <p className="text-sm text-gray-600 bg-green-50 p-3 rounded border">
                            {section.rationale}
                          </p>
                        </div>
                        {section.dependencies && section.dependencies.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm text-gray-700 mb-2">Dependencies</h5>
                            <div className="flex flex-wrap gap-2">
                              {section.dependencies.map((dep, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  <Info className="h-3 w-3 mr-1" />
                                  {dep}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {section.warnings && section.warnings.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm text-gray-700 mb-2">Warnings</h5>
                            <div className="space-y-2">
                              {section.warnings.map((warning, i) => (
                                <p key={i} className="text-sm text-orange-600 bg-orange-50 p-2 rounded border flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  {warning}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        {section.content && (
                          <div>
                            <h5 className="font-medium text-sm text-gray-700 mb-2">Section Content Preview</h5>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border font-mono">
                              {section.content.substring(0, 200)}...
                            </p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}

          {/* Excluded Sections */}
          {excludedSections.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <X className="h-4 w-4" />
                Excluded Sections
              </h4>
              <Accordion type="multiple" className="w-full">
                {excludedSections.map((section, index) => (
                  <AccordionItem key={section.id} value={`excluded-${index}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3 w-full">
                        <X className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <span className="font-medium text-gray-700">{section.title}</span>
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs">Excluded</Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pt-4">
                        <h5 className="font-medium text-sm text-gray-700 mb-2">Reason for Exclusion</h5>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                          {section.rationale}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
