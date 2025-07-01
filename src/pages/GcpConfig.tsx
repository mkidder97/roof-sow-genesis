
import React from 'react';
import { GcpConfigManager } from '@/components/admin/GcpConfigManager';

const GcpConfig: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">GCₚ Configuration Management</h1>
          <p className="text-muted-foreground mt-2">
            Configure wind pressure coefficients for different roof types and zones used in ASCE 7 calculations.
          </p>
        </div>
        <GcpConfigManager />
      </div>
    </div>
  );
};

export default GcpConfig;
