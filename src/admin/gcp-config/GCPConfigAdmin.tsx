
import React, { useState } from 'react';
import GCPConfigList from './GCPConfigList';
import GCPConfigDetail from './GCPConfigDetail';
import GCPConfigForm from './GCPConfigForm';

type View = 'list' | 'detail' | 'create' | 'edit';

interface ViewState {
  view: View;
  selectedConfig?: any;
  configId?: string;
}

const GCPConfigAdmin = () => {
  const [viewState, setViewState] = useState<ViewState>({ view: 'list' });

  const handleViewDetail = (configId: string) => {
    setViewState({ view: 'detail', configId });
  };

  const handleCreateNew = () => {
    setViewState({ view: 'create' });
  };

  const handleEdit = (config: any) => {
    setViewState({ view: 'edit', selectedConfig: config });
  };

  const handleBackToList = () => {
    setViewState({ view: 'list' });
  };

  const handleSave = () => {
    setViewState({ view: 'list' });
  };

  const renderCurrentView = () => {
    switch (viewState.view) {
      case 'detail':
        return (
          <GCPConfigDetail
            configId={viewState.configId!}
            onBack={handleBackToList}
            onEdit={handleEdit}
          />
        );
      
      case 'create':
        return (
          <GCPConfigForm
            onBack={handleBackToList}
            onSave={handleSave}
          />
        );
      
      case 'edit':
        return (
          <GCPConfigForm
            config={viewState.selectedConfig}
            onBack={handleBackToList}
            onSave={handleSave}
          />
        );
      
      default:
        return (
          <GCPConfigList
            onViewDetail={handleViewDetail}
            onCreateNew={handleCreateNew}
            onEdit={handleEdit}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default GCPConfigAdmin;
