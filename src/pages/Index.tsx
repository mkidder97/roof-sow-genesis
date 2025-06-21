
import React from 'react';
import { SOWInputForm } from '@/components/SOWInputForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="relative">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-slate-800 mb-3">
                TPO Roof SOW Generator
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Professional scope of work generation for TPO roofing projects
              </p>
            </div>
            <SOWInputForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
