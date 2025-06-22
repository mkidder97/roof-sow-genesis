
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Code, ChevronDown, Zap, TestTube } from 'lucide-react';

interface DevModePanelProps {
  isDevMode: boolean;
  onToggleDevMode: () => void;
  onAutoFill: () => void;
  rawData?: any;
}

export const DevModePanel: React.FC<DevModePanelProps> = ({
  isDevMode,
  onToggleDevMode,
  onAutoFill,
  rawData
}) => {
  const [showRawData, setShowRawData] = useState(false);

  if (!isDevMode) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-purple-600" />
            Developer Mode
            <Badge variant="outline" className="text-purple-700 border-purple-300">
              Testing Tools
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleDevMode}
            className="text-purple-600"
          >
            Exit Dev Mode
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onAutoFill}
              className="border-purple-300 text-purple-700 hover:bg-purple-100"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Auto-Fill Test Data
            </Button>
          </div>

          {/* Raw Data Display */}
          {rawData && (
            <Collapsible open={showRawData} onOpenChange={setShowRawData}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0">
                  <span className="font-medium text-purple-700">Raw JSON Output</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showRawData ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 p-4 bg-gray-900 rounded-lg">
                  <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(rawData, null, 2)}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
