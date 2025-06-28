import { useState, useEffect, useMemo } from 'react';

export function useOptimizedQueries() {
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchGenerations = async () => {
    // Simulated data fetching
    setLoading(true);
    setTimeout(() => {
      const mockData = [
        { id: '1', project_name: 'Project A', generation_status: 'completed', pdf_url: '/sow1.pdf' },
        { id: '2', project_name: 'Project B', generation_status: 'processing', pdf_url: null },
        { id: '3', project_name: 'Project C', generation_status: 'failed', pdf_url: null },
        { id: '4', project_name: 'Project D', generation_status: 'completed', pdf_url: '/sow2.pdf' }
      ];
      setGenerations(mockData);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    fetchGenerations();
  }, []);

  const processedGenerations = useMemo(() => {
    return generations.map(gen => ({
      ...gen,
      // Fix the status comparison
      isCompleted: gen.generation_status === 'completed',
      canDownload: gen.generation_status === 'completed' && !!gen.pdf_url
    }));
  }, [generations]);

  return {
    generations,
    loading,
    error,
    processedGenerations
  };
}
