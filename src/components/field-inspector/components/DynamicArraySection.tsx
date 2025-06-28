import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { FieldInspectionErrorBoundary } from './FieldInspectionErrorBoundary';

interface DynamicArraySectionProps<T> {
  title: string;
  items: T[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  readOnly?: boolean;
  minItems?: number;
  addButtonText?: string;
  emptyMessage?: string;
}

export function DynamicArraySection<T extends { id: string }>({
  title,
  items,
  onAdd,
  onRemove,
  renderItem,
  readOnly = false,
  minItems = 1,
  addButtonText = "Add Item",
  emptyMessage = "No items added yet"
}: DynamicArraySectionProps<T>) {
  return (
    <FieldInspectionErrorBoundary>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {!readOnly && (
            <Button onClick={onAdd} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              {addButtonText}
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="relative">
                <div className="p-4 border rounded-lg bg-gray-50">
                  {renderItem(item, index)}
                  
                  {!readOnly && items.length > minItems && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onRemove(item.id)}
                      className="absolute top-2 right-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FieldInspectionErrorBoundary>
  );
}