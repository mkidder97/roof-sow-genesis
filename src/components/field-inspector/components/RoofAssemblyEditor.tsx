
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, GripVertical, Edit, Trash2, Move } from 'lucide-react';

interface RoofLayer {
  id: string;
  type: 'membrane' | 'insulation' | 'deck' | 'barrier' | 'coverboard';
  description: string;
  attachment: 'mechanically_attached' | 'adhered' | 'ballasted' | 'welded';
  thickness: string;
  material?: string;
}

interface RoofAssemblyEditorProps {
  layers: RoofLayer[];
  onLayersChange: (layers: RoofLayer[]) => void;
  isRecover: boolean;
  onRecoverChange: (isRecover: boolean) => void;
  recoverType?: string;
  onRecoverTypeChange: (type: string) => void;
  yearInstalled?: number;
  onYearInstalledChange: (year: number) => void;
  originalType?: string;
  onOriginalTypeChange: (type: string) => void;
  readOnly?: boolean;
}

const RoofAssemblyEditor: React.FC<RoofAssemblyEditorProps> = ({
  layers,
  onLayersChange,
  isRecover,
  onRecoverChange,
  recoverType,
  onRecoverTypeChange,
  yearInstalled,
  onYearInstalledChange,
  originalType,
  onOriginalTypeChange,
  readOnly = false
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newLayers = [...layers];
    const draggedLayer = newLayers[draggedIndex];
    newLayers.splice(draggedIndex, 1);
    newLayers.splice(dropIndex, 0, draggedLayer);

    onLayersChange(newLayers);
    setDraggedIndex(null);
  };

  const addLayer = () => {
    const newLayer: RoofLayer = {
      id: `layer_${Date.now()}`,
      type: 'insulation',
      description: 'New Layer',
      attachment: 'mechanically_attached',
      thickness: ''
    };
    onLayersChange([...layers, newLayer]);
  };

  const updateLayer = (index: number, updates: Partial<RoofLayer>) => {
    const newLayers = [...layers];
    newLayers[index] = { ...newLayers[index], ...updates };
    onLayersChange(newLayers);
  };

  const removeLayer = (index: number) => {
    const newLayers = layers.filter((_, i) => i !== index);
    onLayersChange(newLayers);
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'membrane': return '≡';
      case 'insulation': return '≡';
      case 'deck': return '≡';
      case 'barrier': return '≡';
      case 'coverboard': return '≡';
      default: return '≡';
    }
  };

  const getAttachmentBadgeColor = (attachment: string) => {
    switch (attachment) {
      case 'mechanically_attached': return 'bg-blue-100 text-blue-800';
      case 'adhered': return 'bg-green-100 text-green-800';
      case 'ballasted': return 'bg-purple-100 text-purple-800';
      case 'welded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roof Assembly Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Layer Stack */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-600">
            <span>Layer</span>
            <span>Description</span>
            <span>Attachment</span>
            <span>Thickness</span>
          </div>
          
          <div className="space-y-1">
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                draggable={!readOnly}
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`grid grid-cols-4 gap-4 p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors ${
                  draggedIndex === index ? 'opacity-50' : ''
                } ${!readOnly ? 'cursor-move' : ''}`}
              >
                <div className="flex items-center gap-2">
                  {!readOnly && <GripVertical className="h-4 w-4 text-gray-400" />}
                  <span className="text-lg font-mono">{getLayerIcon(layer.type)}</span>
                  <Select
                    value={layer.type}
                    onValueChange={(value) => updateLayer(index, { type: value as RoofLayer['type'] })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="membrane">Membrane</SelectItem>
                      <SelectItem value="insulation">Insulation</SelectItem>
                      <SelectItem value="coverboard">Coverboard</SelectItem>
                      <SelectItem value="barrier">Barrier</SelectItem>
                      <SelectItem value="deck">Deck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Input
                  value={layer.description}
                  onChange={(e) => updateLayer(index, { description: e.target.value })}
                  placeholder="Layer description"
                  readOnly={readOnly}
                />

                <div className="flex items-center gap-2">
                  <Select
                    value={layer.attachment}
                    onValueChange={(value) => updateLayer(index, { attachment: value as RoofLayer['attachment'] })}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mechanically_attached">Mechanically Attached</SelectItem>
                      <SelectItem value="adhered">Adhered</SelectItem>
                      <SelectItem value="ballasted">Ballasted</SelectItem>
                      <SelectItem value="welded">Welded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={layer.thickness}
                    onChange={(e) => updateLayer(index, { thickness: e.target.value })}
                    placeholder="Thickness"
                    readOnly={readOnly}
                  />
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLayer(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!readOnly && (
            <Button
              onClick={addLayer}
              variant="outline"
              className="w-full mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Layer
            </Button>
          )}
        </div>

        <Separator />

        {/* Recover Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="text-base font-medium">Recover:</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recover"
                  checked={isRecover}
                  onChange={() => onRecoverChange(true)}
                  disabled={readOnly}
                  className="w-4 h-4"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="recover"
                  checked={!isRecover}
                  onChange={() => onRecoverChange(false)}
                  disabled={readOnly}
                  className="w-4 h-4"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {isRecover && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recover-type">Recover Type</Label>
                <Select
                  value={recoverType || ''}
                  onValueChange={onRecoverTypeChange}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recover type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct_adhered">Direct Adhered</SelectItem>
                    <SelectItem value="mechanically_attached">Mechanically Attached</SelectItem>
                    <SelectItem value="ballasted">Ballasted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year-installed">Year Originally Installed</Label>
                <Input
                  id="year-installed"
                  type="number"
                  value={yearInstalled || ''}
                  onChange={(e) => onYearInstalledChange(parseInt(e.target.value) || 0)}
                  placeholder="e.g., 2014"
                  readOnly={readOnly}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="original-type">Original Type</Label>
                <Select
                  value={originalType || ''}
                  onValueChange={onOriginalTypeChange}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select original type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TPO">TPO</SelectItem>
                    <SelectItem value="EPDM">EPDM</SelectItem>
                    <SelectItem value="PVC">PVC</SelectItem>
                    <SelectItem value="Modified Bitumen">Modified Bitumen</SelectItem>
                    <SelectItem value="Built-Up Roof">Built-Up Roof</SelectItem>
                    <SelectItem value="Metal">Metal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Assembly Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Assembly Stack (Top to Bottom)</h4>
          <div className="space-y-1">
            {layers.map((layer, index) => (
              <div key={layer.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{layer.description}</span>
                <div className="flex items-center gap-2">
                  <Badge className={getAttachmentBadgeColor(layer.attachment)}>
                    {layer.attachment.replace('_', ' ')}
                  </Badge>
                  {layer.thickness && (
                    <span className="text-gray-600">{layer.thickness}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoofAssemblyEditor;
