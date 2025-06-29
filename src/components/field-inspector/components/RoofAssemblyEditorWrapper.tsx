import React, { useState } from 'react';
import { RoofLayer } from '@/types/roofingTypes';
import RoofAssemblyEditor from './RoofAssemblyEditor';

interface RoofAssemblyEditorWrapperProps {
  layers: RoofLayer[];
  onChange: (layers: RoofLayer[]) => void;
  projectType?: 'recover' | 'tearoff' | 'new';
  onProjectTypeChange?: (type: 'recover' | 'tearoff' | 'new') => void;
  readOnly?: boolean;
}

export const RoofAssemblyEditorWrapper: React.FC<RoofAssemblyEditorWrapperProps> = ({
  layers,
  onChange,
  projectType = 'tearoff',
  onProjectTypeChange,
  readOnly = false
}) => {
  // Convert projectType to recover boolean for the existing component
  const isRecover = projectType === 'recover';
  
  // Handle project type changes
  const handleRecoverChange = (newIsRecover: boolean) => {
    if (onProjectTypeChange) {
      onProjectTypeChange(newIsRecover ? 'recover' : 'tearoff');
    }
  };

  // State for recover-specific fields
  const [recoverType, setRecoverType] = useState<string>('direct_adhered');
  const [yearInstalled, setYearInstalled] = useState<number>(2020);
  const [originalType, setOriginalType] = useState<string>('TPO');

  return (
    <RoofAssemblyEditor
      layers={layers}
      onLayersChange={onChange}
      isRecover={isRecover}
      onRecoverChange={handleRecoverChange}
      recoverType={recoverType}
      onRecoverTypeChange={setRecoverType}
      yearInstalled={yearInstalled}
      onYearInstalledChange={setYearInstalled}
      originalType={originalType}
      onOriginalTypeChange={setOriginalType}
      readOnly={readOnly}
    />
  );
};

// Export as named export for easy import
export { RoofAssemblyEditorWrapper as RoofAssemblyEditor };
