
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Calendar, 
  Building, 
  Ruler, 
  Camera, 
  FileText,
  Star,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface InspectionDetailsProps {
  inspection: FieldInspection;
  onEdit?: () => void;
  onGenerateSOW?: () => void;
}

const InspectionDetails: React.FC<InspectionDetailsProps> = ({ 
  inspection, 
  onEdit, 
  onGenerateSOW 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'Under Review':
        return 'bg-blue-500';
      case 'Approved':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency':
        return 'bg-red-500';
      case 'Expedited':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {inspection.project_name}
          </h1>
          <div className="flex items-center gap-4 text-blue-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {inspection.project_address}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(inspection.inspection_date).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Badge className={`${getStatusColor(inspection.status)} text-white`}>
            {inspection.status}
          </Badge>
          <Badge className={`${getPriorityColor(inspection.priority_level)} text-white`}>
            {inspection.priority_level}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onEdit && (
          <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
            <FileText className="w-4 h-4 mr-2" />
            Edit Inspection
          </Button>
        )}
        
        {inspection.status === 'Completed' && onGenerateSOW && (
          <Button 
            onClick={onGenerateSOW}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Generate SOW
          </Button>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Info */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building className="w-5 h-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-200">Inspector:</span>
                <p className="text-white">{inspection.inspector_name}</p>
              </div>
              <div>
                <span className="text-blue-200">Customer:</span>
                <p className="text-white">{inspection.customer_name || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-blue-200">Phone:</span>
                <p className="text-white">{inspection.customer_phone || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-blue-200">Stories:</span>
                <p className="text-white">{inspection.number_of_stories || 1}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Building Specs */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Building Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-200">Height:</span>
                <p className="text-white">{inspection.building_height ? `${inspection.building_height} ft` : 'Not specified'}</p>
              </div>
              <div>
                <span className="text-blue-200">Square Footage:</span>
                <p className="text-white">{inspection.square_footage ? inspection.square_footage.toLocaleString() : 'Not specified'}</p>
              </div>
              <div>
                <span className="text-blue-200">Length:</span>
                <p className="text-white">{inspection.building_length ? `${inspection.building_length} ft` : 'Not specified'}</p>
              </div>
              <div>
                <span className="text-blue-200">Width:</span>
                <p className="text-white">{inspection.building_width ? `${inspection.building_width} ft` : 'Not specified'}</p>
              </div>
              <div>
                <span className="text-blue-200">Deck Type:</span>
                <p className="text-white">{inspection.deck_type || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-blue-200">Roof Slope:</span>
                <p className="text-white">{inspection.roof_slope || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roof System */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">Roof System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-200">Membrane Type:</span>
                <p className="text-white">{inspection.existing_membrane_type || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-blue-200">Membrane Condition:</span>
                <p className="text-white">
                  {inspection.existing_membrane_condition ? `${inspection.existing_membrane_condition}/10` : 'Not rated'}
                </p>
              </div>
              <div>
                <span className="text-blue-200">Roof Age:</span>
                <p className="text-white">{inspection.roof_age_years ? `${inspection.roof_age_years} years` : 'Not specified'}</p>
              </div>
              <div>
                <span className="text-blue-200">Insulation Type:</span>
                <p className="text-white">{inspection.insulation_type || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-blue-200">Insulation Condition:</span>
                <p className="text-white">{inspection.insulation_condition || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-blue-200">Cover Board:</span>
                <p className="text-white">{inspection.cover_board_type || 'Not specified'}</p>
              </div>
            </div>
            
            {/* Insulation Layers */}
            {inspection.insulation_layers && inspection.insulation_layers.length > 0 && (
              <div>
                <span className="text-blue-200 text-sm">Insulation Layers:</span>
                <div className="mt-1 space-y-1">
                  {inspection.insulation_layers.map((layer, index) => (
                    <div key={layer.id || index} className="text-white text-sm bg-white/5 rounded p-2">
                      {layer.type} - {layer.thickness}"
                      {layer.description && <span className="text-blue-200"> ({layer.description})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white">Equipment & Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-200">Skylights:</span>
                <p className="text-white">{inspection.skylights || 0}</p>
              </div>
              <div>
                <span className="text-blue-200">Access Method:</span>
                <p className="text-white">{inspection.access_method?.replace('_', ' ') || 'Not specified'}</p>
              </div>
            </div>

            {/* HVAC Units */}
            {inspection.hvac_units && inspection.hvac_units.length > 0 && (
              <div>
                <span className="text-blue-200 text-sm">HVAC Units:</span>
                <div className="mt-1 space-y-1">
                  {inspection.hvac_units.map((unit, index) => (
                    <div key={index} className="text-white text-sm bg-white/5 rounded p-2">
                      {unit.type} (Count: {unit.count}) - Condition: {unit.condition}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Roof Drains */}
            {inspection.roof_drains && inspection.roof_drains.length > 0 && (
              <div>
                <span className="text-blue-200 text-sm">Roof Drains:</span>
                <div className="mt-1 space-y-1">
                  {inspection.roof_drains.map((drain, index) => (
                    <div key={index} className="text-white text-sm bg-white/5 rounded p-2">
                      {drain.type} (Count: {drain.count}) - Condition: {drain.condition}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drainage Options */}
            {inspection.drainage_options && inspection.drainage_options.length > 0 && (
              <div>
                <span className="text-blue-200 text-sm">Drainage Options:</span>
                <div className="mt-1 space-y-1">
                  {inspection.drainage_options.map((option, index) => (
                    <div key={option.id || index} className="text-white text-sm bg-white/5 rounded p-2">
                      {option.type.replace('_', ' ')} - 
                      {option.count && ` Count: ${option.count}`}
                      {option.linear_feet && ` Linear Feet: ${option.linear_feet}`}
                      {option.condition && ` - Condition: ${option.condition}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Penetrations */}
            {inspection.penetrations && inspection.penetrations.length > 0 && (
              <div>
                <span className="text-blue-200 text-sm">Penetrations:</span>
                <div className="mt-1 space-y-1">
                  {inspection.penetrations.map((penetration, index) => (
                    <div key={index} className="text-white text-sm bg-white/5 rounded p-2">
                      {penetration.type} (Count: {penetration.count})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interior Protection & Conditions */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Interior Protection & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-200">Protection Needed:</span>
                <p className="text-white">{inspection.interior_protection_needed ? 'Yes' : 'No'}</p>
              </div>
              {inspection.interior_protection_needed && (
                <div>
                  <span className="text-blue-200">Protection Sq Ft:</span>
                  <p className="text-white">{inspection.interior_protection_sqft || 0}</p>
                </div>
              )}
              <div>
                <span className="text-blue-200">Conduit Attached:</span>
                <p className="text-white">{inspection.conduit_attached ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-blue-200">Upgraded Lighting:</span>
                <p className="text-white">{inspection.upgraded_lighting ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-blue-200">Fall Protection:</span>
                <p className="text-white">{inspection.interior_fall_protection ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Star className="w-5 h-5" />
              Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-blue-200">Overall Condition Rating:</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= (inspection.overall_condition || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-400'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-white">
                  {inspection.overall_condition || 0}/5
                </span>
              </div>
            </div>

            {inspection.notes && (
              <div>
                <span className="text-blue-200">Notes:</span>
                <p className="text-white mt-1 bg-white/5 rounded p-3">
                  {inspection.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        {inspection.photos && inspection.photos.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Photos ({inspection.photos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {inspection.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Inspection photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(photo, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">View Full Size</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timestamps */}
      <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
        <CardContent className="p-4">
          <div className="flex justify-between items-center text-sm text-blue-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Created: {new Date(inspection.created_at || '').toLocaleString()}
              </div>
              {inspection.updated_at && (
                <div>
                  Updated: {new Date(inspection.updated_at).toLocaleString()}
                </div>
              )}
            </div>
            {inspection.completed_at && (
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle className="w-4 h-4" />
                Completed: {new Date(inspection.completed_at).toLocaleString()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionDetails;
