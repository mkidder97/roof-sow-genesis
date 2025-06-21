
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield } from 'lucide-react';
import type { Membrane } from '@/types/sow';

interface MembraneSectionProps {
  data: Membrane;
  onChange: (data: Partial<Membrane>) => void;
}

export const MembraneSection: React.FC<MembraneSectionProps> = ({ data, onChange }) => {
  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border-l-4 border-l-violet-500">
      <CardHeader className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border-b border-violet-500/30">
        <CardTitle className="flex items-center gap-3 text-violet-100 text-lg">
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <Shield className="h-5 w-5 text-violet-400" />
          </div>
          Membrane & Attachment
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="manufacturer" className="text-sm font-medium text-slate-700">
              Manufacturer
            </Label>
            <Input
              id="manufacturer"
              value={data.manufacturer}
              onChange={(e) => onChange({ manufacturer: e.target.value })}
              placeholder="e.g., GAF, Firestone, Johns Manville"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="productName" className="text-sm font-medium text-slate-700">
              Product Name
            </Label>
            <Input
              id="productName"
              value={data.productName}
              onChange={(e) => onChange({ productName: e.target.value })}
              placeholder="Enter product name"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Membrane Type
            </Label>
            <Select value={data.membraneType} onValueChange={(value) => onChange({ membraneType: value as any })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TPO">TPO</SelectItem>
                <SelectItem value="PVC">PVC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Thickness (mil)
            </Label>
            <Select value={data.thickness.toString()} onValueChange={(value) => onChange({ thickness: Number(value) as any })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45 mil</SelectItem>
                <SelectItem value="60">60 mil</SelectItem>
                <SelectItem value="80">80 mil</SelectItem>
                <SelectItem value="115">115 mil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Warranty Term
            </Label>
            <Select value={data.warrantyTerm.toString()} onValueChange={(value) => onChange({ warrantyTerm: Number(value) as any })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20 years</SelectItem>
                <SelectItem value="25">25 years</SelectItem>
                <SelectItem value="30">30 years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700">
            Attachment Method
          </Label>
          <Select value={data.attachmentMethod} onValueChange={(value) => onChange({ attachmentMethod: value as any })}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Induction Welded">Induction Welded</SelectItem>
              <SelectItem value="Fully Adhered">Fully Adhered</SelectItem>
              <SelectItem value="Mechanically Attached">Mechanically Attached</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
