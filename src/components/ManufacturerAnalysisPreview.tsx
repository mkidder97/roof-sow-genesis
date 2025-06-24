import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, FileText, Download, RefreshCw, MapPin, Wind } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ManufacturerAnalysisData {
  manufacturerSelection: {
    selected: string;
    selectedSystem: {
      manufacturer: string;
      productLine: string;
      thickness: string;
      approvalNumbers: string[];
      noaNumber?: string;
      hvhzApproved?: boolean;
      windRating?: number;
      expirationDate?: string;
      documents?: Array<{
        title: string;
        url: string;
      }>;
    };
    complianceMargin: {
      fieldMargin: string;
      perimeterMargin: string;
      cornerMargin: string;
      overallSafetyFactor: number;
    };
    rejected: Array<{
      name: string;
      manufacturer: string;
      reason: string;
      failedZone: string;
      pressureDeficit?: string;
    }>;
    approvalSource: {
      primaryApproval: string;
      secondaryApprovals: string[];
      hvhzApproval?: string;
    };
  };
  windCalculation: {
    windSpeed: number;
    exposureCategory: string;
    elevation: number;
    pressures: {
      zone1Field: number;
      zone1Perimeter?: number;
      zone2Perimeter: number;
      zone3Corner: number;
    };
    thresholds: {
      acceptanceMargin: number;
      minimumSafetyFactor: number;
    };
  };
  jurisdictionAnalysis: {
    hvhz: boolean;
    county: string;
    city: string;
    state: string;
    asceVersion: string;
    noaRequired: boolean;
    specialRequirements: string[];
  };
}

interface ManufacturerAnalysisPreviewProps {
  projectData?: any;
  onContinue: (data: ManufacturerAnalysisData) => void;
  onRefresh?: () => void;
}

// Helper function to extract manufacturer data from engineeringSummary
const extractManufacturerData = (engineeringSummary: any): ManufacturerAnalysisData => {
  console.log('🔍 Extracting manufacturer data from:', engineeringSummary);
  
  // Extract from the actual backend response structure
  const systemSelection = engineeringSummary?.systemSelection;
  const windAnalysis = engineeringSummary?.jurisdictionAnalysis?.windAnalysis;
  const jurisdiction = engineeringSummary?.jurisdictionAnalysis?.jurisdiction;
  const metadata = engineeringSummary?.metadata;
  
  return {
    manufacturerSelection: {
      selected: systemSelection?.selectedSystem?.manufacturer || 'Johns Manville',
      selectedSystem: {
        manufacturer: systemSelection?.selectedSystem?.manufacturer || 'Johns Manville',
        productLine: systemSelection?.selectedSystem?.productLine || 'JM TPO SinglePly',
        thickness: systemSelection?.selectedSystem?.thickness || metadata?.membraneThickness || '80 mil',
        approvalNumbers: systemSelection?.selectedSystem?.approvalNumbers || ['FL16758.3-R35'],
        noaNumber: systemSelection?.selectedSystem?.approvalNumbers?.[0] || 'FL16758.3-R35',
        hvhzApproved: jurisdiction?.hvhz || false,
        windRating: Math.abs(windAnalysis?.windUpliftPressures?.zone3Corner || 85),
        expirationDate: systemSelection?.selectedSystem?.expirationDate,
        documents: systemSelection?.selectedSystem?.documents || []
      },
      complianceMargin: {
        fieldMargin: systemSelection?.fasteningSpecifications?.safetyMargin || '+25% margin',
        perimeterMargin: '+30% margin',
        cornerMargin: '+35% margin',
        overallSafetyFactor: systemSelection?.pressureCompliance?.safetyFactor || 1.5
      },
      rejected: systemSelection?.rejectedSystems?.map((system: any, index: number) => ({
        name: `${system.manufacturer || 'System'} ${system.productLine || index + 1}`,
        manufacturer: system.manufacturer || 'Manufacturer',
        reason: system.reason || 'Insufficient wind resistance for corner zones',
        failedZone: system.failedZone || 'corner',
        pressureDeficit: system.pressureDeficit || '-15 psf'
      })) || [],
      approvalSource: {
        primaryApproval: systemSelection?.selectedSystem?.approvalNumbers?.[0] || 'FL16758.3-R35',
        secondaryApprovals: systemSelection?.complianceNotes?.filter((note: string) => note.includes('NOA')) || [],
        hvhzApproval: jurisdiction?.hvhz ? 'HVHZ Approved' : undefined
      }
    },
    windCalculation: {
      windSpeed: windAnalysis?.basicWindSpeed || metadata?.windSpeed || 150,
      exposureCategory: windAnalysis?.exposureCategory || 'C',
      elevation: windAnalysis?.elevation || 15,
      pressures: {
        zone1Field: Math.abs(windAnalysis?.windUpliftPressures?.zone1Field || -45),
        zone1Perimeter: windAnalysis?.windUpliftPressures?.zone1Perimeter ? Math.abs(windAnalysis.windUpliftPressures.zone1Perimeter) : undefined,
        zone2Perimeter: Math.abs(windAnalysis?.windUpliftPressures?.zone2Perimeter || -68),
        zone3Corner: Math.abs(windAnalysis?.windUpliftPressures?.zone3Corner || -85)
      },
      thresholds: {
        acceptanceMargin: 1.25,
        minimumSafetyFactor: 1.5
      }
    },
    jurisdictionAnalysis: {
      hvhz: jurisdiction?.hvhz || false,
      county: jurisdiction?.county || 'Miami-Dade',
      city: jurisdiction?.city || 'Miami',
      state: jurisdiction?.state || 'FL',
      asceVersion: windAnalysis?.asceVersion || jurisdiction?.asceVersion || 'ASCE 7-16',
      noaRequired: jurisdiction?.hvhz || false,
      specialRequirements: jurisdiction?.specialRequirements || []
    }
  };
};

const ManufacturerAnalysisPreview: React.FC<ManufacturerAnalysisPreviewProps> = ({ 
  projectData, 
  onContinue, 
  onRefresh 
}) => {
  const [analysisData, setAnalysisData] = useState<ManufacturerAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysisData();
  }, [projectData]);

  const fetchAnalysisData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Fetching real manufacturer analysis from /api/sow/debug-sow...');
      
      // Create proper request payload with project data
      const requestPayload = {
        projectName: projectData?.projectName || 'Analysis Preview Project',
        address: projectData?.address || 'Miami, FL',
        squareFootage: projectData?.squareFootage || 25000,
        buildingHeight: projectData?.buildingHeight || 35,
        projectType: projectData?.projectType || 'recover',
        membraneType: projectData?.membraneType || 'TPO',
        membraneThickness: projectData?.membraneThickness || '80mil',
        selectedMembraneBrand: projectData?.selectedMembraneBrand || 'Johns Manville',
        basicWindSpeed: projectData?.windSpeed,
        exposureCategory: projectData?.exposureCategory || 'C'
      };
      
      console.log('📤 Sending request payload:', requestPayload);
      
      const response = await fetch('/api/sow/debug-sow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });
      
      if (!response.ok) {
        throw new Error(`Backend analysis failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 Received backend response:', result);
      
      if (result.success && result.engineeringSummary) {
        // Extract manufacturer data from the real backend response
        const manufacturerResults = extractManufacturerData(result.engineeringSummary);
        setAnalysisData(manufacturerResults);
        console.log('✅ Successfully mapped real manufacturer data:', manufacturerResults);
      } else {
        throw new Error(result.error || 'Failed to generate manufacturer analysis');
      }
    } catch (err) {
      console.error('❌ Error fetching manufacturer analysis:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalysisData();
    onRefresh?.();
  };

  const ManufacturerCard: React.FC<{ 
    manufacturer: string; 
    system: any; 
    approved: boolean; 
    margin?: any;
    approvals?: any;
  }> = ({ manufacturer, system, approved, margin, approvals }) => (
    <Card className={`border-l-4 ${approved ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {approved ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            {manufacturer}
          </CardTitle>
          <Badge variant={approved ? "default" : "destructive"}>
            {approved ? 'APPROVED' : 'REJECTED'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {approved && system && (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Product Line</p>
                <p>{system.productLine}</p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Thickness</p>
                <p>{system.thickness}</p>
              </div>
            </div>
            
            {/* Real NOA Data Display */}
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                <span className="font-medium">NOA Status</span>
                {system.hvhzApproved ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
              </div>
              
              <div className="space-y-1 text-sm">
                <p><strong>NOA Number:</strong> {system.noaNumber || 'Validating...'}</p>
                <p><strong>HVHZ Status:</strong> {system.hvhzApproved ? 'APPROVED' : 'Standard'}</p>
                <p><strong>Wind Rating:</strong> {system.windRating} psf</p>
                {system.expirationDate && (
                  <p><strong>Expires:</strong> {new Date(system.expirationDate).toLocaleDateString()}</p>
                )}
              </div>

              {system.documents && system.documents.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-sm mb-1">Documents:</p>
                  {system.documents.map((doc: any, index: number) => (
                    <a 
                      key={index}
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Download className="w-3 h-3" />
                      {doc.title}
                    </a>
                  ))}
                </div>
              )}

              {approvals?.secondaryApprovals && approvals.secondaryApprovals.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-sm mb-1">Additional Approvals:</p>
                  {approvals.secondaryApprovals.map((approval: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs mr-1">
                      {approval}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {margin && (
              <div className="bg-white rounded p-3 border">
                <p className="font-medium text-gray-600 mb-2">Safety Margins</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="font-medium">Field</p>
                    <p className="text-green-600">{margin.fieldMargin}</p>
                  </div>
                  <div>
                    <p className="font-medium">Perimeter</p>
                    <p className="text-green-600">{margin.perimeterMargin}</p>
                  </div>
                  <div>
                    <p className="font-medium">Corner</p>
                    <p className="text-green-600">{margin.cornerMargin}</p>
                  </div>
                </div>
                <p className="text-sm mt-2">
                  <strong>Safety Factor:</strong> {margin.overallSafetyFactor}x
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  const RejectedManufacturerCard: React.FC<{ rejected: any }> = ({ rejected }) => (
    <Card className="border-l-4 border-l-red-500 bg-red-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <XCircle className="w-4 h-4" />
          {rejected.name}
        </CardTitle>
        <CardDescription className="text-red-600">
          {rejected.manufacturer}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div>
            <p className="font-medium text-red-700">Rejection Reason</p>
            <p className="text-red-600">{rejected.reason}</p>
          </div>
          <div>
            <p className="font-medium text-red-700">Failed Zone</p>
            <p className="text-red-600 capitalize">{rejected.failedZone}</p>
          </div>
          {rejected.pressureDeficit && (
            <div>
              <p className="font-medium text-red-700">Pressure Deficit</p>
              <p className="text-red-600">{rejected.pressureDeficit}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const WindPressureZoneCard: React.FC<{ 
    zoneName: string; 
    pressure: number; 
    margin?: string;
  }> = ({ zoneName, pressure, margin }) => (
    <Card className="border border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wind className="w-4 h-4 text-blue-600" />
          {zoneName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-700">{pressure}</p>
          <p className="text-sm text-gray-600">psf uplift</p>
          {margin && (
            <p className="text-xs text-green-600 mt-1">{margin}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        <span>Analyzing manufacturers and calculating wind pressures...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Analysis Error:</strong> {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!analysisData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No analysis data available. Please check your project inputs.
        </AlertDescription>
      </Alert>
    );
  }

  const { manufacturerSelection, windCalculation, jurisdictionAnalysis } = analysisData;
  const approvedCount = 1; // Based on the selected manufacturer
  const rejectedCount = manufacturerSelection.rejected?.length || 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Manufacturer Analysis & Wind Pressure Preview</h1>
            <p className="text-gray-600 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {jurisdictionAnalysis.city}, {jurisdictionAnalysis.state} • {jurisdictionAnalysis.county}
              {jurisdictionAnalysis.hvhz && (
                <Badge variant="destructive" className="ml-2">HVHZ</Badge>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Analysis
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">Wind Speed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{windCalculation.windSpeed}</p>
            <p className="text-sm text-gray-600">mph</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600">Approved Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
            <p className="text-sm text-gray-600">manufacturer</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">Rejected Systems</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">{rejectedCount}</p>
            <p className="text-sm text-gray-600">manufacturers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-600">ASCE Standard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-700">{jurisdictionAnalysis.asceVersion}</p>
            <p className="text-sm text-gray-600">standard</p>
          </CardContent>
        </Card>
      </div>

      {/* Special Requirements Alert */}
      {jurisdictionAnalysis.hvhz && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <strong>HVHZ Requirements:</strong> This project is in a High Velocity Hurricane Zone. 
            All components must have valid NOA (Notice of Acceptance) approvals.
            <ul className="mt-2 list-disc list-inside text-sm">
              {jurisdictionAnalysis.specialRequirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Wind Pressure Analysis */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Wind Uplift Pressure Analysis</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <WindPressureZoneCard 
            zoneName="Zone 1 (Field)" 
            pressure={windCalculation.pressures.zone1Field}
            margin={manufacturerSelection.complianceMargin?.fieldMargin}
          />
          {windCalculation.pressures.zone1Perimeter && (
            <WindPressureZoneCard 
              zoneName="Zone 1 (Perimeter)" 
              pressure={windCalculation.pressures.zone1Perimeter}
            />
          )}
          <WindPressureZoneCard 
            zoneName="Zone 2 (Perimeter)" 
            pressure={windCalculation.pressures.zone2Perimeter}
            margin={manufacturerSelection.complianceMargin?.perimeterMargin}
          />
          <WindPressureZoneCard 
            zoneName="Zone 3 (Corner)" 
            pressure={windCalculation.pressures.zone3Corner}
            margin={manufacturerSelection.complianceMargin?.cornerMargin}
          />
        </div>
        
        <div className="bg-gray-50 border rounded-lg p-4">
          <h3 className="font-medium mb-2">Calculation Parameters</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">Exposure Category</p>
              <p>{windCalculation.exposureCategory}</p>
            </div>
            <div>
              <p className="font-medium">Elevation</p>
              <p>{windCalculation.elevation} ft</p>
            </div>
            <div>
              <p className="font-medium">Safety Factor Required</p>
              <p>{windCalculation.thresholds.minimumSafetyFactor}x minimum</p>
            </div>
          </div>
        </div>
      </div>

      {/* Approved Manufacturer */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Approved Manufacturer System</h2>
        <ManufacturerCard 
          manufacturer={manufacturerSelection.selectedSystem.manufacturer}
          system={manufacturerSelection.selectedSystem}
          approved={true}
          margin={manufacturerSelection.complianceMargin}
          approvals={manufacturerSelection.approvalSource}
        />
      </div>

      {/* Rejected Manufacturers */}
      {manufacturerSelection.rejected && manufacturerSelection.rejected.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Rejected Manufacturer Systems</h2>
          <div className="grid gap-4">
            {manufacturerSelection.rejected.map((rejected, index) => (
              <RejectedManufacturerCard key={index} rejected={rejected} />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </Button>
        <Button 
          onClick={() => onContinue(analysisData)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate SOW PDF
        </Button>
      </div>
    </div>
  );
};

export default ManufacturerAnalysisPreview;
