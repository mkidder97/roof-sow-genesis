
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

const FieldInspectionView = () => {
  const { id } = useParams();
  
  if (!id) {
    return <Navigate to="/field-inspector/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Field Inspection View</h1>
        <p className="text-xl">Viewing inspection: {id}</p>
      </div>
    </div>
  );
};

export default FieldInspectionView;
