
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading...", 
  className = "" 
}) => {
  return (
    <div className={`flex items-center justify-center p-8 text-gray-600 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      <span>{message}</span>
    </div>
  );
};
