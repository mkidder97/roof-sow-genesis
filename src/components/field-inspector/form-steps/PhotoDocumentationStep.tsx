
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, X, Eye, Loader2 } from 'lucide-react';
import { FieldInspection } from '@/types/fieldInspection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PhotoDocumentationStepProps {
  data: Partial<FieldInspection>;
  onChange: (updates: Partial<FieldInspection>) => void;
}

const PhotoDocumentationStep: React.FC<PhotoDocumentationStepProps> = ({ data, onChange }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploading, setUploading] = useState<string[]>([]);

  const requiredPhotos = [
    'Overall roof view',
    'Problem areas (if any)',
    'Main equipment',
    'Drainage system'
  ];

  const optionalPhotos = [
    'Detail shots',
    'Access points',
    'Unique features',
    'Before/after (if applicable)'
  ];

  const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadPhoto = async (file: File): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setUploading(prev => [...prev, fileId]);
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);
      
      const fileName = `${user.id}/${fileId}-${file.name}`;
      
      const { data: uploadData, error } = await supabase.storage
        .from('inspection-photos')
        .upload(fileName, compressedFile, {
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(prev => ({ ...prev, [fileId]: percent }));
          }
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('inspection-photos')
        .getPublicUrl(uploadData.path);

      return urlData.publicUrl;
    } finally {
      setUploading(prev => prev.filter(id => id !== fileId));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newPhotos: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large. Maximum size is 10MB`);
        continue;
      }

      try {
        const photoUrl = await uploadPhoto(file);
        newPhotos.push(photoUrl);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
        console.error('Upload error:', error);
      }
    }

    if (newPhotos.length > 0) {
      onChange({ photos: [...(data.photos || []), ...newPhotos] });
    }
  };

  const removePhoto = async (photoUrl: string, index: number) => {
    try {
      // Extract file path from URL to delete from storage
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;
      
      await supabase.storage
        .from('inspection-photos')
        .remove([filePath]);

      const updatedPhotos = (data.photos || []).filter((_, i) => i !== index);
      onChange({ photos: updatedPhotos });
      toast.success('Photo removed successfully');
    } catch (error) {
      toast.error('Failed to remove photo');
      console.error('Remove photo error:', error);
    }
  };

  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const openFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={openCamera}
          className="bg-blue-600 hover:bg-blue-700 flex-1"
        >
          <Camera className="w-4 h-4 mr-2" />
          Take Photo
        </Button>
        
        <Button
          onClick={openFileSelect}
          variant="outline"
          className="border-blue-400 text-blue-200 hover:bg-blue-800 flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload from Gallery
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
      />

      {/* Upload Progress */}
      {uploading.length > 0 && (
        <Card className="bg-white/5 border-blue-400/20">
          <CardContent className="p-4">
            <div className="space-y-2">
              {uploading.map(fileId => (
                <div key={fileId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">Uploading...</span>
                    <span className="text-blue-200">{Math.round(uploadProgress[fileId] || 0)}%</span>
                  </div>
                  <Progress value={uploadProgress[fileId] || 0} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="text-green-300 text-lg">Required Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {requiredPhotos.map((photo, index) => (
                <li key={index} className="flex items-center text-green-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3" />
                  {photo}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-blue-300 text-lg">Optional Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {optionalPhotos.map((photo, index) => (
                <li key={index} className="flex items-center text-blue-200">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3" />
                  {photo}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Photo Gallery */}
      {data.photos && data.photos.length > 0 && (
        <Card className="bg-white/5 border-blue-400/20">
          <CardHeader>
            <CardTitle className="text-white">
              Uploaded Photos ({data.photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.photos.map((photoUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photoUrl}
                    alt={`Inspection photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(photoUrl, '_blank')}
                      className="border-white/20 text-white hover:bg-white/20"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removePhoto(photoUrl, index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photo Tips */}
      <div className="bg-purple-500/20 rounded-lg p-4">
        <p className="text-purple-200 text-sm">
          <strong>Photo Tips:</strong><br />
          • Take clear, well-lit photos<br />
          • Include multiple angles of problem areas<br />
          • Photos will be compressed for faster upload<br />
          • Maximum file size: 10MB per photo<br />
          • All photos are stored securely and linked to this inspection
        </p>
      </div>
    </div>
  );
};

export default PhotoDocumentationStep;
