
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FloatingCameraButtonProps {
  onPhotosAdded: (photos: string[]) => void;
  disabled?: boolean;
}

const FloatingCameraButton: React.FC<FloatingCameraButtonProps> = ({ 
  onPhotosAdded, 
  disabled = false 
}) => {
  const { user } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

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

    const compressedFile = await compressImage(file);
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
    
    const { data: uploadData, error } = await supabase.storage
      .from('inspection-photos')
      .upload(fileName, compressedFile);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('inspection-photos')
      .getPublicUrl(uploadData.path);

    return urlData.publicUrl;
  };

  const handleCameraCapture = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: string[] = [];
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Maximum size is 10MB`);
          continue;
        }

        try {
          const photoUrl = await uploadPhoto(file);
          newPhotos.push(photoUrl);
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
          console.error('Upload error:', error);
        }
      }

      if (newPhotos.length > 0) {
        onPhotosAdded(newPhotos);
        toast.success(`${newPhotos.length} photo(s) added successfully`);
      }
    } finally {
      setUploading(false);
    }
  };

  const openCamera = () => {
    if (cameraInputRef.current && !disabled) {
      cameraInputRef.current.click();
    }
  };

  return (
    <>
      <Button
        onClick={openCamera}
        disabled={disabled || uploading}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-200 hover:scale-110"
        size="icon"
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Camera className="w-6 h-6" />
        )}
      </Button>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => handleCameraCapture(e.target.files)}
        style={{ display: 'none' }}
      />
    </>
  );
};

export default FloatingCameraButton;
