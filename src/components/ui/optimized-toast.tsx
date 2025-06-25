
import React, { memo } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastIcon = memo<{ variant?: string }>(({ variant }) => {
  switch (variant) {
    case 'default':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'destructive':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
});

ToastIcon.displayName = 'ToastIcon';

export const OptimizedToaster = memo(() => {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant as any} {...props}>
            <div className="flex items-start space-x-3">
              <ToastIcon variant={variant as string} />
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
});

OptimizedToaster.displayName = 'OptimizedToaster';
