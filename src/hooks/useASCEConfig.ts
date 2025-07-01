
import { useState, useEffect } from 'react';
import { ASCERequirements, PartialASCERequirements } from '@/types/asceRequirements';

export { ASCERequirements, PartialASCERequirements } from '@/types/asceRequirements';

export function useASCEConfig() {
  const [config, setConfig] = useState<PartialASCERequirements>({});
  
  const updateConfig = (updates: Partial<PartialASCERequirements>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  return {
    config,
    updateConfig,
    setConfig,
  };
}
