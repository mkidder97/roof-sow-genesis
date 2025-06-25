
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface KeyboardShortcuts {
  [key: string]: () => void;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const shortcuts: KeyboardShortcuts = {
    'ctrl+g': useCallback(() => {
      navigate('/sow-generation');
      toast({
        title: "Navigation",
        description: "Navigated to SOW Generation",
        variant: "default",
      });
    }, [navigate, toast]),
    
    'ctrl+d': useCallback(() => {
      navigate('/dashboard');
      toast({
        title: "Navigation", 
        description: "Navigated to Dashboard",
        variant: "default",
      });
    }, [navigate, toast]),
    
    'ctrl+i': useCallback(() => {
      navigate('/field-inspection/new');
      toast({
        title: "Navigation",
        description: "Started new field inspection",
        variant: "default",
      });
    }, [navigate, toast]),
    
    'ctrl+h': useCallback(() => {
      navigate('/field-inspector/dashboard');
      toast({
        title: "Navigation",
        description: "Navigated to Inspector Dashboard", 
        variant: "default",
      });
    }, [navigate, toast]),
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if no input elements are focused
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = `${event.ctrlKey ? 'ctrl+' : ''}${event.key.toLowerCase()}`;
      const shortcut = shortcuts[key];
      
      if (shortcut) {
        event.preventDefault();
        shortcut();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);

  const showShortcutsHelp = useCallback(() => {
    toast({
      title: "Keyboard Shortcuts",
      description: `
        Ctrl+G - SOW Generation
        Ctrl+D - Dashboard  
        Ctrl+I - New Inspection
        Ctrl+H - Inspector Dashboard
      `,
      variant: "default",
    });
  }, [toast]);

  return { showShortcutsHelp };
}

export function useGlobalShortcuts() {
  const { showShortcutsHelp } = useKeyboardShortcuts();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === '?') {
        event.preventDefault();
        showShortcutsHelp();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showShortcutsHelp]);
}
