
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';

interface PhotoDocumentationStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
  readOnly?: boolean;
}

const PhotoDocumentationStep: React.FC<PhotoDocumentationStepProps> = ({
  data,
  onChange,
  readOnly = false
}) => {
  const photos = data.photos || [];

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // In a real app, you'd upload these to a storage service
      // For now, we'll just create placeholder URLs
      const newPhotos = Array.from(files).map((file, index) => 
        URL.createObjectURL(file)
      );
      onChange({ photos: [...photos, ...newPhotos] });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Photo Documentation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('photo-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos
            </Button>
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        )}

        {photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative">
                <img
                  src={photo}
                  alt={`Inspection photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded border"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No photos uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhotoDocumentationStep;
