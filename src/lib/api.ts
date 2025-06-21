
import type { SOWData } from '@/types/sow';

export const generateSOW = async (data: SOWData) => {
  console.log('Sending SOW data to backend:', data);
  
  // Mock API call for demonstration
  // In production, this would be a real API endpoint
  const response = await new Promise<any>((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        filename: `${data.projectMetadata.projectName.toLowerCase().replace(/\s+/g, '-')}-sow-${Date.now()}.pdf`,
        outputPath: `/SRC_PDF/generated/${data.projectMetadata.projectName.toLowerCase().replace(/\s+/g, '-')}-sow-${Date.now()}.pdf`,
        fileSizeKB: Math.floor(Math.random() * 500) + 100,
        generationTime: Math.floor(Math.random() * 3000) + 1000,
      });
    }, 2000);
  });

  if (!response.success) {
    throw new Error('Failed to generate SOW');
  }

  return response;
};

// Example implementation for real backend integration:
/*
export const generateSOW = async (data: SOWData) => {
  const response = await fetch('/api/generate-sow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to generate SOW');
  }

  return response.json();
};
*/
