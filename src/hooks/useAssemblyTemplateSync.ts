import { useState, useCallback, useEffect } from 'react';
import { RoofLayer } from '@/types/roofingTypes';
import { AssemblyTemplateEngine, TemplateCompatibility, AssemblyValidation } from '@/engines/assemblyTemplateEngine';

export interface AssemblyTemplateSyncState {
  templateCompatibility: TemplateCompatibility | null;
  assemblyValidation: AssemblyValidation | null;
  syncMode: 'template-to-assembly' | 'assembly-to-template' | 'manual';
  autoSyncEnabled: boolean;
  isAnalyzing: boolean;
  lastSyncTimestamp: number;
}

export interface AssemblyTemplateSyncActions {
  syncTemplateToAssembly: (membraneType?: string, insulationType?: string, deckType?: string, projectType?: 'recover' | 'tearoff' | 'new') => RoofLayer[];
  analyzeAssemblyCompatibility: (layers: RoofLayer[]) => void;
  setAutoSyncEnabled: (enabled: boolean) => void;
  setSyncMode: (mode: 'template-to-assembly' | 'assembly-to-template' | 'manual') => void;
  resetSync: () => void;
  validateAssembly: (layers: RoofLayer[]) => AssemblyValidation;
}

export interface UseAssemblyTemplateSyncProps {
  onSyncComplete?: (layers: RoofLayer[], compatibility: TemplateCompatibility | null) => void;
  onValidationChange?: (validation: AssemblyValidation | null) => void;
  autoSyncDelay?: number;
}

export const useAssemblyTemplateSync = ({
  onSyncComplete,
  onValidationChange,
  autoSyncDelay = 500
}: UseAssemblyTemplateSyncProps = {}): [AssemblyTemplateSyncState, AssemblyTemplateSyncActions] => {
  
  const [state, setState] = useState<AssemblyTemplateSyncState>({
    templateCompatibility: null,
    assemblyValidation: null,
    syncMode: 'manual',
    autoSyncEnabled: true,
    isAnalyzing: false,
    lastSyncTimestamp: 0
  });

  // Template → Assembly sync function
  const syncTemplateToAssembly = useCallback((
    membraneType?: string, 
    insulationType?: string, 
    deckType?: string, 
    projectType: 'recover' | 'tearoff' | 'new' = 'tearoff'
  ): RoofLayer[] => {
    if (!membraneType && !insulationType && !deckType) {
      return [];
    }

    setState(prev => ({ ...prev, isAnalyzing: true, syncMode: 'template-to-assembly' }));

    try {
      const newLayers = AssemblyTemplateEngine.getTemplateAssembly(
        membraneType,
        insulationType,
        deckType,
        projectType
      );

      // Analyze the generated assembly
      const compatibility = AssemblyTemplateEngine.getCompatibleTemplates(newLayers);
      const validation = AssemblyTemplateEngine.validateAssembly(newLayers);

      setState(prev => ({
        ...prev,
        templateCompatibility: compatibility,
        assemblyValidation: validation,
        isAnalyzing: false,
        lastSyncTimestamp: Date.now()
      }));

      // Trigger callbacks
      onSyncComplete?.(newLayers, compatibility);
      onValidationChange?.(validation);

      console.log('🔄 Template → Assembly sync completed:', {
        layers: newLayers,
        compatibility,
        validation
      });

      return newLayers;
    } catch (error) {
      console.error('Template sync error:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
      return [];
    }
  }, [onSyncComplete, onValidationChange]);

  // Assembly → Template analysis function
  const analyzeAssemblyCompatibility = useCallback((layers: RoofLayer[]) => {
    if (layers.length === 0) {
      setState(prev => ({
        ...prev,
        templateCompatibility: null,
        assemblyValidation: null,
        syncMode: 'manual'
      }));
      return;
    }

    setState(prev => ({ ...prev, isAnalyzing: true, syncMode: 'assembly-to-template' }));

    try {
      const compatibility = AssemblyTemplateEngine.getCompatibleTemplates(layers);
      const validation = AssemblyTemplateEngine.validateAssembly(layers);

      setState(prev => ({
        ...prev,
        templateCompatibility: compatibility,
        assemblyValidation: validation,
        isAnalyzing: false,
        lastSyncTimestamp: Date.now()
      }));

      // Trigger callbacks
      onValidationChange?.(validation);

      console.log('🔍 Assembly → Template analysis completed:', {
        compatibility,
        validation
      });
    } catch (error) {
      console.error('Assembly analysis error:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, [onValidationChange]);

  // Validate assembly without changing sync state
  const validateAssembly = useCallback((layers: RoofLayer[]): AssemblyValidation => {
    return AssemblyTemplateEngine.validateAssembly(layers);
  }, []);

  // Control functions
  const setAutoSyncEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, autoSyncEnabled: enabled }));
    console.log('🔧 Auto-sync mode:', enabled ? 'enabled' : 'disabled');
  }, []);

  const setSyncMode = useCallback((mode: 'template-to-assembly' | 'assembly-to-template' | 'manual') => {
    setState(prev => ({ ...prev, syncMode: mode }));
    console.log('🔧 Sync mode changed to:', mode);
  }, []);

  const resetSync = useCallback(() => {
    setState({
      templateCompatibility: null,
      assemblyValidation: null,
      syncMode: 'manual',
      autoSyncEnabled: true,
      isAnalyzing: false,
      lastSyncTimestamp: 0
    });
    console.log('🔄 Sync state reset');
  }, []);

  const actions: AssemblyTemplateSyncActions = {
    syncTemplateToAssembly,
    analyzeAssemblyCompatibility,
    setAutoSyncEnabled,
    setSyncMode,
    resetSync,
    validateAssembly
  };

  return [state, actions];
};

// Utility function for debounced auto-sync
export const useDebounceSync = (
  syncFunction: () => void,
  delay: number,
  dependencies: any[]
) => {
  useEffect(() => {
    const timeoutId = setTimeout(syncFunction, delay);
    return () => clearTimeout(timeoutId);
  }, dependencies);
};
