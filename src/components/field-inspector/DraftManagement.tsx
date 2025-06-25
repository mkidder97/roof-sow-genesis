
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Trash2, Calendar, MapPin } from 'lucide-react';
import { useDraftManagement } from '@/hooks/useDraftManagement';
import { DraftData } from '@/lib/api';
import { toast } from 'sonner';

interface DraftManagementProps {
  onLoadDraft: (draftData: DraftData) => void;
  disabled?: boolean;
}

const DraftManagement: React.FC<DraftManagementProps> = ({ onLoadDraft, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, drafts, listDrafts, deleteDraft } = useDraftManagement();

  useEffect(() => {
    if (isOpen) {
      listDrafts();
    }
  }, [isOpen, listDrafts]);

  const handleLoadDraft = (draft: DraftData) => {
    onLoadDraft(draft);
    setIsOpen(false);
    toast.success(`Loaded draft: ${draft.projectName || 'Untitled Project'}`);
  };

  const handleDeleteDraft = async (draftId: string, projectName?: string) => {
    if (window.confirm(`Are you sure you want to delete "${projectName || 'this draft'}"?`)) {
      await deleteDraft(draftId);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className="border-blue-400 text-blue-200 hover:bg-blue-800/20"
        >
          <FileText className="w-4 h-4 mr-2" />
          Load Draft
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] bg-gray-900 border-blue-400/30">
        <DialogHeader>
          <DialogTitle className="text-white">Load Saved Draft</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <span className="ml-2 text-blue-200">Loading drafts...</span>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No saved drafts found</p>
              <p className="text-gray-500 text-sm mt-2">Start creating an inspection to save your first draft</p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <Card key={draft.id} className="bg-white/10 border-blue-400/30 hover:bg-white/15 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold">
                            {draft.projectName || 'Untitled Project'}
                          </h3>
                          <Badge variant="secondary" className="bg-blue-500/20 text-blue-200">
                            Draft
                          </Badge>
                        </div>
                        
                        {draft.projectAddress && (
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300 text-sm">{draft.projectAddress}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Modified: {formatDate(draft.lastModified)}</span>
                          </div>
                          
                          {draft.squareFootage && (
                            <span>{draft.squareFootage.toLocaleString()} sq ft</span>
                          )}
                          
                          {draft.buildingHeight && (
                            <span>{draft.buildingHeight} ft height</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleLoadDraft(draft)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Load
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDraft(draft.id!, draft.projectName)}
                          className="border-red-400 text-red-300 hover:bg-red-800/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DraftManagement;
