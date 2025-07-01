
import React from 'react';
import { useParams } from 'react-router-dom';
import { GCPConfigForm } from '@/components/gcp-config/GCPConfigForm';

const GCPConfigFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  return (
    <div className="container mx-auto px-4 py-8">
      <GCPConfigForm isEdit={isEdit} />
    </div>
  );
};

export default GCPConfigFormPage;
