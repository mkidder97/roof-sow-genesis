
import { useState, useCallback } from 'react';
import { saveDraft as apiSaveDraft, loadDraft as apiLoadDraft, listDrafts as apiListDrafts, deleteDraft as apiDeleteDraft, DraftData, DraftResponse, DraftListResponse } from '@/lib/api';
import { toast } from 'sonner';

export const useDraftManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  const saveDraft = useCallback(async (draftData: DraftData): Promise<string | null> => {
    try {
      setIsLoading(true);
      const response = await apiSaveDraft(draftData);
      
      if (response.success && response.draftId) {
        setCurrentDraftId(response.draftId);
        toast.success('Draft saved successfully');
        return response.draftId;
      } else {
        throw new Error(response.error || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Failed to save draft: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDraft = useCallback(async (draftId: string): Promise<DraftData | null> => {
    try {
      setIsLoading(true);
      const response = await apiLoadDraft(draftId);
      
      if (response.success && response.draft) {
        setCurrentDraftId(draftId);
        toast.success('Draft loaded successfully');
        return response.draft;
      } else {
        throw new Error(response.error || 'Failed to load draft');
      }
    } catch (error) {
      console.error('Load draft error:', error);
      toast.error('Failed to load draft: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listDrafts = useCallback(async (): Promise<DraftData[]> => {
    try {
      setIsLoading(true);
      const response = await apiListDrafts();
      
      if (response.success && response.drafts) {
        setDrafts(response.drafts);
        return response.drafts;
      } else {
        throw new Error(response.error || 'Failed to list drafts');
      }
    } catch (error) {
      console.error('List drafts error:', error);
      toast.error('Failed to load drafts: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDraft = useCallback(async (draftId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await apiDeleteDraft(draftId);
      
      if (response.success) {
        setDrafts(prev => prev.filter(draft => draft.id !== draftId));
        if (currentDraftId === draftId) {
          setCurrentDraftId(null);
        }
        toast.success('Draft deleted successfully');
        return true;
      } else {
        throw new Error(response.error || 'Failed to delete draft');
      }
    } catch (error) {
      console.error('Delete draft error:', error);
      toast.error('Failed to delete draft: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentDraftId]);

  return {
    isLoading,
    drafts,
    currentDraftId,
    saveDraft,
    loadDraft,
    listDrafts,
    deleteDraft,
  };
};
