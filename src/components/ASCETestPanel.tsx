
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useASCEAutoSuggest } from '@/hooks/useASCEAutoSuggest';
import { useASCEConfig } from '@/hooks/useASCEConfig';

const ASCETestPanel: React.FC = () => {
  const [testLocation, setTestLocation] = useState({ city: '', state: '', county: '' });
  const { suggestion, isLoading } = useASCEAutoSuggest(testLocation);
  const { getRecommendedASCEVersion } = useASCEConfig();

  const runMiamiTest = () => {
    setTestLocation({ city: 'Miami', state: 'FL', county: 'Miami-Dade' });
  };

  const runDallasTest = () => {
    setTestLocation({ city: 'Dallas', state: 'TX', county: 'Dallas' });
  };

  const clearTest = () => {
    setTestLocation({ city: '', state: '', county: '' });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>ASCE Auto-Suggestion Test Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button onClick={runMiamiTest} variant="outline">
            Test Miami, FL
          </Button>
          <Button onClick={runDallasTest} variant="outline">
            Test Dallas, TX
          </Button>
          <Button onClick={clearTest} variant="outline">
            Clear
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            placeholder="City"
            value={testLocation.city}
            onChange={(e) => setTestLocation(prev => ({ ...prev, city: e.target.value }))}
          />
          <Input
            placeholder="State"
            value={testLocation.state}
            onChange={(e) => setTestLocation(prev => ({ ...prev, state: e.target.value }))}
          />
          <Input
            placeholder="County"
            value={testLocation.county}
            onChange={(e) => setTestLocation(prev => ({ ...prev, county: e.target.value }))}
          />
        </div>

        {isLoading && (
          <div className="text-center py-4">
            Loading ASCE suggestions...
          </div>
        )}

        {suggestion && !isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>ASCE Version:</strong> {suggestion.suggestion.version}
              </div>
              <div>
                <strong>Wind Speed:</strong> {suggestion.suggestion.wind_speed} mph
              </div>
              <div>
                <strong>Exposure Category:</strong> {suggestion.suggestion.exposure_category}
              </div>
              <div>
                <strong>Building Classification:</strong> {suggestion.suggestion.building_classification}
              </div>
            </div>

            <div className="flex gap-2">
              <Badge variant={suggestion.confidence === 'high' ? 'default' : 
                           suggestion.confidence === 'medium' ? 'secondary' : 'outline'}>
                {suggestion.confidence} confidence
              </Badge>
              <Badge variant="outline">
                {suggestion.source}
              </Badge>
              {suggestion.suggestion.hvhz_applicable && (
                <Badge variant="destructive">
                  HVHZ Zone
                </Badge>
              )}
            </div>

            <div>
              <strong>Reasoning:</strong>
              <ul className="list-disc pl-6 mt-2">
                {suggestion.reasoning.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
            </div>

            {suggestion.special_notes && (
              <div>
                <strong>Special Notes:</strong>
                <ul className="list-disc pl-6 mt-2">
                  {suggestion.special_notes.map((note, index) => (
                    <li key={index} className="text-orange-600">{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Test Results Expected:</h3>
          <ul className="space-y-1 text-sm">
            <li><strong>Miami, FL:</strong> ASCE 7-16, 180 mph, Exposure C, HVHZ warning</li>
            <li><strong>Dallas, TX:</strong> ASCE 7-22, 115 mph, Exposure C</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ASCETestPanel;
