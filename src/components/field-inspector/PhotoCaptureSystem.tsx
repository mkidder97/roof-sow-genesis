import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, MapPin, Clock, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PhotoMetadata {
  id: string;
  url: string;
  category: 'overview' | 'condition' | 'detail' | 'measurement';
  area: string;
  notes: string;
  timestamp: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  thumbnailUrl?: string;
}

interface PhotoCaptureSystemProps {
  onPhotoCapture?: (photoUrl: any) => void;
  onClose: () => void;
  onPhotosAdded?: (photos: PhotoMetadata[]) => void;
  inspectionId?: string;
}

const PhotoCaptureSystem: React.FC<PhotoCaptureSystemProps> = ({ 
  onPhotoCapture,
  onClose,
  onPhotosAdded, 
  inspectionId 
}) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PhotoMetadata['category']>('overview');
  const [currentArea, setCurrentArea] = useState('');
  const [gpsEnabled, setGpsEnabled] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: 'overview', label: 'Overview', color: 'bg-blue-500' },
    { id: 'condition', label: 'Condition', color: 'bg-yellow-500' },
    { id: 'detail', label: 'Detail', color: 'bg-green-500' },
    { id: 'measurement', label: 'Measurement', color: 'bg-purple-500' }
  ];

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      const img = document.createElement('img');
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas to blob conversion failed'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      
      img.onerror = () => {
        reject(new Error('Image load failed'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      const img = document.createElement('img');
      
      img.onload = () => {
        const size = 150;
        canvas.width = size;
        canvas.height = size;
        
        const scale = Math.max(size / img.width, size / img.height);
        const x = (size - img.width * scale) / 2;
        const y = (size - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.onerror = () => {
        reject(new Error('Image load failed'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadPhoto = async (file: File): Promise<{ url: string; thumbnailUrl: string }> => {
    if (!user) throw new Error('User not authenticated');

    const compressedFile = await compressImage(file);
    const thumbnailDataUrl = await createThumbnail(file);
    
    const fileName = `${user.id}/${inspectionId || 'temp'}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
    
    const { data: uploadData, error } = await supabase.storage
      .from('inspection-photos')
      .upload(fileName, compressedFile);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('inspection-photos')
      .getPublicUrl(uploadData.path);

    return {
      url: urlData.publicUrl,
      thumbnailUrl: thumbnailDataUrl
    };
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: PhotoMetadata[] = [];
    
    try {
      let gpsCoordinates;
      if (gpsEnabled) {
        try {
          const position = await getCurrentLocation();
          gpsCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
        } catch (error) {
          console.warn('Could not get GPS coordinates:', error);
        }
      }

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
          const { url, thumbnailUrl } = await uploadPhoto(file);
          
          const photoMetadata: PhotoMetadata = {
            id: `photo-${Date.now()}-${i}`,
            url,
            thumbnailUrl,
            category: selectedCategory,
            area: currentArea || 'General',
            notes: '',
            timestamp: new Date().toISOString(),
            gpsCoordinates
          };
          
          newPhotos.push(photoMetadata);
          
          // Call the legacy onPhotoCapture if provided
          if (onPhotoCapture) {
            onPhotoCapture(url);
          }
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
          console.error('Upload error:', error);
        }
      }

      if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos]);
        onPhotosAdded?.(newPhotos);
        toast.success(`${newPhotos.length} photo(s) added successfully`);
      }
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  const updatePhotoNotes = (photoId: string, notes: string) => {
    setPhotos(prev => prev.map(p => 
      p.id === photoId ? { ...p, notes } : p
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Photo Capture System</h2>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Photo Capture Controls */}
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Photo Capture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="text-blue-200 text-sm font-medium mb-2 block">
                  Photo Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id as PhotoMetadata['category'])}
                      className={`p-3 rounded-lg text-white font-medium transition-all ${
                        selectedCategory === category.id
                          ? `${category.color} scale-105`
                          : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Area Input */}
              <div>
                <label className="text-blue-200 text-sm font-medium mb-2 block">
                  Roof Area/Location
                </label>
                <input
                  type="text"
                  value={currentArea}
                  onChange={(e) => setCurrentArea(e.target.value)}
                  placeholder="e.g., North Section, HVAC Area, Main Roof"
                  className="w-full p-3 bg-white/20 border border-blue-400/30 rounded-lg text-white placeholder-blue-200"
                />
              </div>

              {/* GPS Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-blue-200 text-sm font-medium">Include GPS Coordinates</span>
                <button
                  onClick={() => setGpsEnabled(!gpsEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    gpsEnabled ? 'bg-green-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      gpsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Capture Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 h-12"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Take Photo
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  variant="outline"
                  className="border-blue-400 text-blue-200 hover:bg-blue-600 h-12"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload
                </Button>
              </div>

              {uploading && (
                <div className="text-center text-blue-200">
                  <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Uploading photos...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Captured Photos ({photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square bg-white/5 rounded-lg overflow-hidden">
                        <img
                          src={photo.thumbnailUrl || photo.url}
                          alt={`${photo.category} - ${photo.area}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Photo Metadata */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-between p-2">
                        <div className="flex justify-between items-start">
                          <Badge className={`text-xs ${categories.find(c => c.id === photo.category)?.color || 'bg-gray-500'}`}>
                            {photo.category}
                          </Badge>
                          <button
                            onClick={() => removePhoto(photo.id)}
                            className="bg-red-500 hover:bg-red-600 rounded-full p-1"
                          >
                            <X className="w-3 h-3 text-white" />
                          </button>
                        </div>
                        
                        <div className="text-white text-xs space-y-1">
                          <div className="font-medium">{photo.area}</div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(photo.timestamp).toLocaleTimeString()}
                          </div>
                          {photo.gpsCoordinates && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              GPS
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Notes Input */}
                      <textarea
                        value={photo.notes}
                        onChange={(e) => updatePhotoNotes(photo.id, e.target.value)}
                        placeholder="Add notes..."
                        className="mt-2 w-full p-2 text-xs bg-white/10 border border-blue-400/30 rounded text-white placeholder-blue-200"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            style={{ display: 'none' }}
          />
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default PhotoCaptureSystem;
