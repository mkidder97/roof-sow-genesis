import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Wind, 
  MapPin, 
  Wrench, 
  ChevronDown, 
  CheckCircle, 
  AlertCircle,
  Info,
  Zap,
  Building,
  FileText
} from 'lucide-react';

interface EngineeringSummaryData {
  jurisdiction: {
    city: string;
    county: string;
    state: string;
    codeCycle: string;
    asceVersion: string;
    hvhz: boolean;
  };
  windAnalysis: {
    windSpeed: string;
    exposure: string;
    elevation: string;
    zonePressures: {
      zone1Field: string;
      zone1Perimeter: string;
      zone2Perimeter: string;
      zone3Corner: string;
    };
  };
  systemSelection: {
    selectedTemplate: string;
    rationale: string;
    rejectedManufacturers: string[];
    approvalSource: string[];
  };
  attachmentSpec: {
    fieldSpacing: string;
    perimeterSpacing: string;
    cornerSpacing: string;
    penetrationDepth: string;
    notes: string;
  };
}

interface EngineeringSummaryPanelProps {
  data: EngineeringSummaryData;
  isOpen: boolean;
  onToggle: () => void;
}

export const EngineeringSummaryPanel: React.FC<EngineeringSummaryPanelProps> = ({
  data,
  isOpen,
  onToggle
}) => {
  const getHVHZBadge = (hvhz: boolean) => {
    return hvhz ? (
      <Badge className="bg-tesla-error/20 text-tesla-error border-tesla-error/30">
        <AlertCircle className="w-3 h-3 mr-1" />
        HVHZ Required
      </Badge>
    ) : (
      <Badge className="bg-tesla-success/20 text-tesla-success border-tesla-success/30">
        <CheckCircle className="w-3 h-3 mr-1" />
        Non-HVHZ
      </Badge>
    );
  };

  const getWindSeverityColor = (pressure: string) => {
    const value = Math.abs(parseFloat(pressure.replace(/[^\d.-]/g, '')));
    if (value > 40) return 'text-tesla-error';
    if (value > 25) return 'text-tesla-warning';
    return 'text-tesla-success';
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="tesla-glass-card border-tesla-blue/30">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between w-full cursor-pointer p-6 hover:bg-tesla-surface/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 tesla-glass-card rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-tesla-blue" />
              </div>
              <div>
                <h3 className="tesla-h3 text-tesla-blue">Engineering Decision Summary</h3>
                <p className="tesla-small text-tesla-text-muted">
                  Complete rationale for template selection, wind analysis, and attachment specifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-tesla-blue/20 text-tesla-blue border-tesla-blue/30">
                <FileText className="w-3 h-3 mr-1" />
                Audit Trail
              </Badge>
              <ChevronDown className={`h-5 w-5 text-tesla-text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-6">
            
            {/* Jurisdiction Analysis */}
            <div className="tesla-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-5 w-5 text-tesla-success" />
                <h4 className="tesla-h4">Jurisdiction Analysis</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="tesla-body text-tesla-text-secondary">Location:</span>
                    <span className="tesla-body font-medium">{data.jurisdiction.city}, {data.jurisdiction.county}, {data.jurisdiction.state}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="tesla-body text-tesla-text-secondary">Building Code:</span>
                    <span className="tesla-body font-medium">{data.jurisdiction.codeCycle}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="tesla-body text-tesla-text-secondary">ASCE Standard:</span>
                    <span className="tesla-body font-medium">{data.jurisdiction.asceVersion}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="tesla-body text-tesla-text-secondary">Wind Zone:</span>
                    {getHVHZBadge(data.jurisdiction.hvhz)}
                  </div>
                  <div className="tesla-glass-card p-4 bg-tesla-blue/5">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-tesla-blue mt-0.5 flex-shrink-0" />
                      <p className="tesla-small text-tesla-text-secondary">
                        {data.jurisdiction.hvhz 
                          ? `${data.jurisdiction.county} is designated as a High Velocity Hurricane Zone, requiring enhanced wind resistance and NOA approvals.`
                          : `${data.jurisdiction.county} enforces ${data.jurisdiction.codeCycle} with ${data.jurisdiction.asceVersion} wind standards for non-HVHZ applications.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Wind Analysis */}
            <div className="tesla-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wind className="h-5 w-5 text-tesla-warning" />
                <h4 className="tesla-h4">Wind Load Analysis</h4>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="tesla-glass-card p-4">
                      <div className="tesla-small text-tesla-text-muted mb-1">Design Wind Speed</div>
                      <div className="tesla-h4 text-tesla-warning">{data.windAnalysis.windSpeed}</div>
                    </div>
                    <div className="tesla-glass-card p-4">
                      <div className="tesla-small text-tesla-text-muted mb-1">Exposure Category</div>
                      <div className="tesla-h4">{data.windAnalysis.exposure}</div>
                    </div>
                  </div>
                  <div className="tesla-glass-card p-4">
                    <div className="tesla-small text-tesla-text-muted mb-1">Building Elevation</div>
                    <div className="tesla-body font-medium">{data.windAnalysis.elevation}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h5 className="tesla-body font-semibold text-tesla-text-primary mb-3">Zone Uplift Pressures</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="tesla-small text-tesla-text-secondary">Zone 1 (Field):</span>
                      <span className={`tesla-body font-mono ${getWindSeverityColor(data.windAnalysis.zonePressures.zone1Field)}`}>
                        {data.windAnalysis.zonePressures.zone1Field}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="tesla-small text-tesla-text-secondary">Zone 1 (Inner Perimeter):</span>
                      <span className={`tesla-body font-mono ${getWindSeverityColor(data.windAnalysis.zonePressures.zone1Perimeter)}`}>
                        {data.windAnalysis.zonePressures.zone1Perimeter}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="tesla-small text-tesla-text-secondary">Zone 2 (Outer Perimeter):</span>
                      <span className={`tesla-body font-mono ${getWindSeverityColor(data.windAnalysis.zonePressures.zone2Perimeter)}`}>
                        {data.windAnalysis.zonePressures.zone2Perimeter}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="tesla-small text-tesla-text-secondary">Zone 3 (Corner):</span>
                      <span className={`tesla-body font-mono font-semibold ${getWindSeverityColor(data.windAnalysis.zonePressures.zone3Corner)}`}>
                        {data.windAnalysis.zonePressures.zone3Corner}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Selection */}
            <div className="tesla-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Building className="h-5 w-5 text-tesla-blue" />
                <h4 className="tesla-h4">System Selection Logic</h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="tesla-small text-tesla-text-muted mb-2">Selected Template</div>
                  <div className="tesla-body font-semibold text-tesla-blue mb-2">{data.systemSelection.selectedTemplate}</div>
                  <div className="tesla-glass-card p-4 bg-tesla-success/5">
                    <p className="tesla-body text-tesla-text-secondary">{data.systemSelection.rationale}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="tesla-small text-tesla-text-muted mb-2">Approval Sources</div>
                    <div className="space-y-1">
                      {data.systemSelection.approvalSource.map((approval, index) => (
                        <Badge key={index} className="bg-tesla-success/20 text-tesla-success border-tesla-success/30 mr-2 mb-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {approval}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {data.systemSelection.rejectedManufacturers.length > 0 && (
                    <div>
                      <div className="tesla-small text-tesla-text-muted mb-2">Filtered Manufacturers</div>
                      <div className="space-y-1">
                        {data.systemSelection.rejectedManufacturers.slice(0, 3).map((manufacturer, index) => (
                          <div key={index} className="tesla-small text-tesla-text-muted">
                            • {manufacturer}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attachment Specifications */}
            <div className="tesla-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Wrench className="h-5 w-5 text-tesla-warning" />
                <h4 className="tesla-h4">Fastening Specifications</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="tesla-glass-card p-4">
                  <div className="tesla-small text-tesla-text-muted mb-1">Field Spacing</div>
                  <div className="tesla-body font-semibold">{data.attachmentSpec.fieldSpacing}</div>
                </div>
                <div className="tesla-glass-card p-4">
                  <div className="tesla-small text-tesla-text-muted mb-1">Perimeter Spacing</div>
                  <div className="tesla-body font-semibold">{data.attachmentSpec.perimeterSpacing}</div>
                </div>
                <div className="tesla-glass-card p-4">
                  <div className="tesla-small text-tesla-text-muted mb-1">Corner Spacing</div>
                  <div className="tesla-body font-semibold">{data.attachmentSpec.cornerSpacing}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="tesla-small text-tesla-text-muted mb-1">Penetration Depth</div>
                  <div className="tesla-body font-medium">{data.attachmentSpec.penetrationDepth}</div>
                </div>
                
                <div className="tesla-glass-card p-4 bg-tesla-warning/5">
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-tesla-warning mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="tesla-small font-semibold text-tesla-warning mb-1">Engineering Notes</div>
                      <p className="tesla-small text-tesla-text-secondary">{data.attachmentSpec.notes}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};