
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Edit, FileText, Calendar, MapPin, User, Phone, Building, Loader2, Camera, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const InspectionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { inspections, loading } = useFieldInspections();

  const inspection = inspections.find(i => i.id === id);

  const generateSOWFromInspection = () => {
    if (!inspection) return;

    const sowData = {
      projectName: inspection.project_name,
      projectAddress: inspection.project_address,
      buildingHeight: inspection.building_height,
      squareFootage: inspection.square_footage,
      deckType: inspection.deck_type,
      membraneType: inspection.existing_membrane_type,
      membraneThickness: '60mil', // Default
      projectType: 'recover', // Default based on inspection
      exposureCategory: 'C', // Default
      customNotes: [
        ...(inspection.special_requirements ? [inspection.special_requirements] : []),
        ...(inspection.notes ? [inspection.notes] : []),
        `Field inspection completed by ${inspection.inspector_name} on ${format(new Date(inspection.inspection_date), 'MMM dd, yyyy')}`,
        `Overall roof condition: ${inspection.overall_condition || 'N/A'}/10`,
        `Priority level: ${inspection.priority_level}`,
        `Weather conditions during inspection: ${inspection.weather_conditions || 'N/A'}`,
      ].filter(Boolean),
    };

    navigate('/sow-generation', { 
      state: { prefilledData: sowData, fromInspection: inspection.id }
    });
    
    toast.success('Inspection data loaded into SOW Generator');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-500';
      case 'Completed': return 'bg-green-500';
      case 'Under Review': return 'bg-blue-500';
      case 'Approved': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency': return 'bg-red-500';
      case 'Expedited': return 'bg-orange-500';
      case 'Standard': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getConditionLabel = (value: number) => {
    if (value <= 2) return 'Critical';
    if (value <= 4) return 'Poor';
    if (value <= 6) return 'Fair';
    if (value <= 8) return 'Good';
    return 'Excellent';
  };

  const getConditionColor = (value: number) => {
    if (value <= 2) return 'text-red-500';
    if (value <= 4) return 'text-red-400';
    if (value <= 6) return 'text-yellow-400';
    if (value <= 8) return 'text-blue-400';
    return 'text-green-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          Loading inspection...
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-red-400/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Inspection Not Found</h2>
            <p className="text-red-200 mb-4">The inspection you're looking for doesn't exist or you don't have permission to view it.</p>
            <Button onClick={() => navigate('/field-inspector')} className="bg-blue-600 hover:bg-blue-700">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/field-inspector')}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{inspection.project_name}</h1>
              <p className="text-blue-200">Inspection Details</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {inspection.status === 'Draft' && (
              <Button
                onClick={() => navigate(`/field-inspection/${inspection.id}/edit`)}
                variant="outline"
                className="border-blue-400 text-blue-200 hover:bg-blue-800"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            
            {inspection.status === 'Completed' && (
              <Button
                onClick={generateSOWFromInspection}
                className="bg-green-600 hover:bg-green-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate SOW
              </Button>
            )}
          </div>
        </div>

        {/* Status and Priority Badges */}
        <div className="flex gap-2 mb-6">
          <Badge className={`${getStatusColor(inspection.status)} text-white`}>
            {inspection.status}
          </Badge>
          <Badge className={`${getPriorityColor(inspection.priority_level)} text-white`}>
            {inspection.priority_level}
          </Badge>
          {inspection.sow_generated && (
            <Badge className="bg-purple-500 text-white">
              SOW Generated
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Information */}
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Project Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center text-blue-200 mb-1">
                      <MapPin className="w-4 h-4 mr-2" />
                      Address
                    </div>
                    <p className="text-white">{inspection.project_address}</p>
                  </div>
                  
                  {inspection.customer_name && (
                    <div>
                      <div className="flex items-center text-blue-200 mb-1">
                        <User className="w-4 h-4 mr-2" />
                        Customer
                      </div>
                      <p className="text-white">{inspection.customer_name}</p>
                    </div>
                  )}
                  
                  {inspection.customer_phone && (
                    <div>
                      <div className="flex items-center text-blue-200 mb-1">
                        <Phone className="w-4 h-4 mr-2" />
                        Phone
                      </div>
                      <p className="text-white">{inspection.customer_phone}</p>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center text-blue-200 mb-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      Inspection Date
                    </div>
                    <p className="text-white">{format(new Date(inspection.inspection_date), 'MMMM dd, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Building Specifications */}
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white">Building Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {inspection.square_footage && (
                    <div>
                      <span className="text-blue-200 block">Square Footage</span>
                      <span className="text-white font-medium">{inspection.square_footage.toLocaleString()} sq ft</span>
                    </div>
                  )}
                  
                  {inspection.building_height && (
                    <div>
                      <span className="text-blue-200 block">Height</span>
                      <span className="text-white font-medium">{inspection.building_height} ft</span>
                    </div>
                  )}
                  
                  {inspection.number_of_stories && (
                    <div>
                      <span className="text-blue-200 block">Stories</span>
                      <span className="text-white font-medium">{inspection.number_of_stories}</span>
                    </div>
                  )}
                  
                  {inspection.roof_slope && (
                    <div>
                      <span className="text-blue-200 block">Roof Slope</span>
                      <span className="text-white font-medium">{inspection.roof_slope}</span>
                    </div>
                  )}
                  
                  {inspection.building_length && inspection.building_width && (
                    <div>
                      <span className="text-blue-200 block">Dimensions</span>
                      <span className="text-white font-medium">{inspection.building_length} x {inspection.building_width} ft</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Roof Assessment */}
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white">Roof Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inspection.deck_type && (
                      <div>
                        <span className="text-blue-200 block">Deck Type</span>
                        <span className="text-white font-medium">{inspection.deck_type}</span>
                      </div>
                    )}
                    
                    {inspection.existing_membrane_type && (
                      <div>
                        <span className="text-blue-200 block">Membrane Type</span>
                        <span className="text-white font-medium">{inspection.existing_membrane_type}</span>
                      </div>
                    )}
                    
                    {inspection.insulation_type && (
                      <div>
                        <span className="text-blue-200 block">Insulation Type</span>
                        <span className="text-white font-medium">{inspection.insulation_type}</span>
                      </div>
                    )}
                    
                    {inspection.roof_age_years && (
                      <div>
                        <span className="text-blue-200 block">Roof Age</span>
                        <span className="text-white font-medium">{inspection.roof_age_years} years</span>
                      </div>
                    )}
                  </div>
                  
                  {inspection.existing_membrane_condition && (
                    <div>
                      <span className="text-blue-200 block mb-2">Membrane Condition</span>
                      <div className="flex items-center gap-4">
                        <span className={`font-medium ${getConditionColor(inspection.existing_membrane_condition)}`}>
                          {inspection.existing_membrane_condition}/10 - {getConditionLabel(inspection.existing_membrane_condition)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {inspection.overall_condition && (
                    <div>
                      <span className="text-blue-200 block mb-2">Overall Condition</span>
                      <div className="flex items-center gap-4">
                        <span className={`font-medium ${getConditionColor(inspection.overall_condition)}`}>
                          {inspection.overall_condition}/10 - {getConditionLabel(inspection.overall_condition)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Equipment & Features */}
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Equipment & Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span className="text-blue-200 block">Skylights</span>
                    <span className="text-white font-medium">{inspection.skylights || 0}</span>
                  </div>
                  
                  <div>
                    <span className="text-blue-200 block">Roof Hatches</span>
                    <span className="text-white font-medium">{inspection.roof_hatches || 0}</span>
                  </div>
                  
                  <div>
                    <span className="text-blue-200 block">HVAC Units</span>
                    <span className="text-white font-medium">{inspection.hvac_units?.length || 0}</span>
                  </div>
                  
                  <div>
                    <span className="text-blue-200 block">Roof Drains</span>
                    <span className="text-white font-medium">{inspection.roof_drains?.length || 0}</span>
                  </div>
                </div>

                {/* Equipment Details */}
                {(inspection.hvac_units && inspection.hvac_units.length > 0) && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2">HVAC Units Details</h4>
                    <div className="space-y-2">
                      {inspection.hvac_units.map((unit, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-blue-200">{unit.type}</span>
                          <span className="text-white">{unit.count} units - {unit.condition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(inspection.roof_drains && inspection.roof_drains.length > 0) && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2">Roof Drains Details</h4>
                    <div className="space-y-2">
                      {inspection.roof_drains.map((drain, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-blue-200">{drain.type}</span>
                          <span className="text-white">{drain.count} drains - {drain.condition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Inspector Info */}
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white">Inspector</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-blue-200 block">Name</span>
                    <span className="text-white">{inspection.inspector_name}</span>
                  </div>
                  <div>
                    <span className="text-blue-200 block">Date Created</span>
                    <span className="text-white">{format(new Date(inspection.created_at || ''), 'MMM dd, yyyy h:mm a')}</span>
                  </div>
                  {inspection.completed_at && (
                    <div>
                      <span className="text-blue-200 block">Completed</span>
                      <span className="text-white">{format(new Date(inspection.completed_at), 'MMM dd, yyyy h:mm a')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Weather & Priority */}
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white">Assessment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-blue-200 block">Priority Level</span>
                    <Badge className={`${getPriorityColor(inspection.priority_level)} text-white mt-1`}>
                      {inspection.priority_level}
                    </Badge>
                  </div>
                  
                  {inspection.weather_conditions && (
                    <div>
                      <span className="text-blue-200 block">Weather Conditions</span>
                      <span className="text-white">{inspection.weather_conditions}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Photos */}
            {inspection.photos && inspection.photos.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Photos ({inspection.photos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {inspection.photos.slice(0, 4).map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Inspection photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(photo, '_blank')}
                      />
                    ))}
                  </div>
                  {inspection.photos.length > 4 && (
                    <p className="text-blue-200 text-sm mt-2 text-center">
                      +{inspection.photos.length - 4} more photos
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {(inspection.special_requirements || inspection.notes) && (
          <div className="mt-6">
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white">Notes & Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspection.special_requirements && (
                  <div>
                    <h4 className="text-blue-200 font-medium mb-2">Special Requirements</h4>
                    <p className="text-white whitespace-pre-wrap">{inspection.special_requirements}</p>
                  </div>
                )}
                
                {inspection.notes && (
                  <div>
                    <h4 className="text-blue-200 font-medium mb-2">Additional Notes</h4>
                    <p className="text-white whitespace-pre-wrap">{inspection.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectionDetails;
