
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import type { ProjectMetadata } from '@/types/sow';

interface ProjectMetadataSectionProps {
  data: ProjectMetadata;
  onChange: (data: Partial<ProjectMetadata>) => void;
}

export const ProjectMetadataSection: React.FC<ProjectMetadataSectionProps> = ({ data, onChange }) => {
  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border-l-4 border-l-orange-500">
      <CardHeader className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-b border-orange-500/30">
        <CardTitle className="flex items-center gap-3 text-orange-100 text-lg">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Building2 className="h-5 w-5 text-orange-400" />
          </div>
          Project Metadata
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="projectName" className="text-sm font-medium text-slate-700">
              Project Name *
            </Label>
            <Input
              id="projectName"
              value={data.projectName}
              onChange={(e) => onChange({ projectName: e.target.value })}
              placeholder="Enter project name"
              className="mt-1"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="companyName" className="text-sm font-medium text-slate-700">
              Company Name
            </Label>
            <Input
              id="companyName"
              value={data.companyName}
              onChange={(e) => onChange({ companyName: e.target.value })}
              placeholder="Enter company name"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address" className="text-sm font-medium text-slate-700">
            Address *
          </Label>
          <Input
            id="address"
            value={data.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="Enter project address"
            className="mt-1"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="squareFootage" className="text-sm font-medium text-slate-700">
              Square Footage
            </Label>
            <Input
              id="squareFootage"
              type="number"
              value={data.squareFootage || ''}
              onChange={(e) => onChange({ squareFootage: Number(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Project Type
            </Label>
            <Select value={data.projectType} onValueChange={(value) => onChange({ projectType: value as any })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Recover">Recover</SelectItem>
                <SelectItem value="Tear-Off">Tear-Off</SelectItem>
                <SelectItem value="Replacement">Replacement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Deck Type
            </Label>
            <Select value={data.deckType} onValueChange={(value) => onChange({ deckType: value as any })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Steel">Steel</SelectItem>
                <SelectItem value="Wood">Wood</SelectItem>
                <SelectItem value="Concrete">Concrete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="buildingHeight" className="text-sm font-medium text-slate-700">
              Building Height (ft)
            </Label>
            <Input
              id="buildingHeight"
              type="number"
              value={data.buildingHeight || ''}
              onChange={(e) => onChange({ buildingHeight: Number(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="length" className="text-sm font-medium text-slate-700">
              Length (ft)
            </Label>
            <Input
              id="length"
              type="number"
              value={data.length || ''}
              onChange={(e) => onChange({ length: Number(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="width" className="text-sm font-medium text-slate-700">
              Width (ft)
            </Label>
            <Input
              id="width"
              type="number"
              value={data.width || ''}
              onChange={(e) => onChange({ width: Number(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
