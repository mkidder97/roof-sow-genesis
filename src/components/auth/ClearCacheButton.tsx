
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

export const ClearCacheButton: React.FC = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();

  const clearCache = async () => {
    try {
      // Sign out first
      await signOut();
      
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear Supabase session cache
      await supabase.auth.signOut({ scope: 'local' });
      
      // Clear browser cache for this origin (if supported)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      toast({
        title: "Cache Cleared",
        description: "All authentication data has been cleared. The page will reload.",
        variant: "default",
      });
      
      // Force reload after a short delay
      setTimeout(() => {
        window.location.href = '/auth';
      }, 1000);
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Cache Clear Failed",
        description: "There was an error clearing the cache. Try refreshing manually.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      onClick={clearCache}
      variant="outline"
      size="sm"
      className="flex items-center gap-2 text-red-600 border-red-400 hover:bg-red-50"
    >
      <Trash2 className="w-4 h-4" />
      Clear Cache & Reset
    </Button>
  );
};
