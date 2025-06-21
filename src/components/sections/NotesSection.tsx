
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';
import type { Notes } from '@/types/sow';

interface NotesSectionProps {
  data: Notes;
  onChange: (data: Partial<Notes>) => void;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ data, onChange }) => {
  return (
    <Card className="border-l-4 border-l-rose-500">
      <CardHeader className="bg-gradient-to-r from-rose-50 to-rose-100">
        <CardTitle className="flex items-center gap-2 text-rose-800">
          <FileText className="h-5 w-5" />
          Notes & Custom Sections
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div>
          <Label htmlFor="contractorName" className="text-sm font-medium text-slate-700">
            Contractor / Installer Name
          </Label>
          <Input
            id="contractorName"
            value={data.contractorName}
            onChange={(e) => onChange({ contractorName: e.target.value })}
            placeholder="Enter contractor name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="addendaNotes" className="text-sm font-medium text-slate-700">
            Addenda Notes
          </Label>
          <Textarea
            id="addendaNotes"
            value={data.addendaNotes}
            onChange={(e) => onChange({ addendaNotes: e.target.value })}
            placeholder="Enter any additional project notes or specifications..."
            className="mt-1 min-h-[100px]"
          />
        </div>

        <div>
          <Label htmlFor="warrantyNotes" className="text-sm font-medium text-slate-700">
            Warranty Notes
          </Label>
          <Textarea
            id="warrantyNotes"
            value={data.warrantyNotes}
            onChange={(e) => onChange({ warrantyNotes: e.target.value })}
            placeholder="Enter warranty-specific notes and requirements..."
            className="mt-1 min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  );
};
