
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, CheckCircle, RefreshCw, Flag, AlertCircle } from 'lucide-react';
import { SelfHealingAction } from '@/types/engineering';

interface SelfHealingInspectorProps {
  actions: SelfHealingAction[];
}

export const SelfHealingInspector: React.FC<SelfHealingInspectorProps> = ({ actions }) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return <Badge variant="default" className="bg-green-600">High ({Math.round(confidence * 100)}%)</Badge>;
    if (confidence >= 0.5) return <Badge variant="secondary" className="bg-yellow-600">Medium ({Math.round(confidence * 100)}%)</Badge>;
    return <Badge variant="destructive">Low ({Math.round(confidence * 100)}%)</Badge>;
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <Badge variant="destructive">High Impact</Badge>;
      case 'medium': return <Badge variant="secondary">Medium Impact</Badge>;
      case 'low': return <Badge variant="outline">Low Impact</Badge>;
      default: return <Badge variant="outline">{impact}</Badge>;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'missing_field': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'auto_correction': return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'fallback_selection': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'low_confidence': return <Flag className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-blue-600" />
          Self-Healing Summary
          <Badge variant="outline">{actions.length} corrections</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {actions.map((action, index) => (
            <AccordionItem key={index} value={`action-${index}`}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3 w-full">
                  {getActionIcon(action.type)}
                  <div className="flex-1">
                    <span className="font-medium">{action.field}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getConfidenceBadge(action.confidence)}
                      {getImpactBadge(action.impact)}
                      {action.reviewRequired && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Review Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm text-gray-700">Original Value</h5>
                      <p className="text-sm bg-red-50 p-2 rounded border">
                        {action.originalValue !== undefined ? String(action.originalValue) : 'Not provided'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm text-gray-700">Corrected Value</h5>
                      <p className="text-sm bg-green-50 p-2 rounded border font-medium">
                        {String(action.correctedValue)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-gray-700">Reason for Correction</h5>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border">
                      {action.reason}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};
