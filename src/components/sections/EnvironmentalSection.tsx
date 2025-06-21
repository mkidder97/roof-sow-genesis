
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Environmental } from '@/types/sow';

interface EnvironmentalSectionProps {
  data: Environmental;
  onChange: (data: Partial<Environmental>) => void;
  address: string;
}

export const EnvironmentalSection: React.FC<EnvironmentalSectionProps> = ({ data, onChange, address }) => {
  const { toast } = useToast();
  const [isGeocoding, setIsGeocoding] = React.useState(false);

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    
    setIsGeocoding(true);
    try {
      console.log('Geocoding address:', address);
      
      // Mock geocoding for demo - in production, use a real geocoding service
      setTimeout(() => {
        const mockData = {
          city: 'Austin',
          state: 'TX',
          zip: '78701',
          jurisdiction: 'City of Austin',
          elevation: 489,
        };
        
        onChange(mockData);
        toast({
          title: "Location Data Retrieved",
          description: `Found: ${mockData.city}, ${mockData.state}`,
        });
        setIsGeocoding(false);
      }, 1500);
      
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Geocoding Failed",
        description: "Could not retrieve location data",
        variant: "destructive",
      });
      setIsGeocoding(false);
    }
  };

  useEffect(() => {
    if (address && address.length > 10 && !data.city) {
      const debounce = setTimeout(() => {
        geocodeAddress(address);
      }, 2000);
      
      return () => clearTimeout(debounce);
    }
  }, [address]);

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <MapPin className="h-5 w-5" />
          Environmental & Code Information
          {isGeocoding && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="city" className="text-sm font-medium text-slate-700">
              City
            </Label>
            <Input
              id="city"
              value={data.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="Auto-filled"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="state" className="text-sm font-medium text-slate-700">
              State
            </Label>
            <Input
              id="state"
              value={data.state}
              onChange={(e) => onChange({ state: e.target.value })}
              placeholder="Auto-filled"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="zip" className="text-sm font-medium text-slate-700">
              ZIP Code
            </Label>
            <Input
              id="zip"
              value={data.zip}
              onChange={(e) => onChange({ zip: e.target.value })}
              placeholder="Auto-filled"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="elevation" className="text-sm font-medium text-slate-700">
              Elevation (ft)
            </Label>
            <Input
              id="elevation"
              type="number"
              value={data.elevation || ''}
              onChange={(e) => onChange({ elevation: Number(e.target.value) })}
              placeholder="Auto-filled"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="jurisdiction" className="text-sm font-medium text-slate-700">
            Jurisdiction
          </Label>
          <Input
            id="jurisdiction"
            value={data.jurisdiction}
            onChange={(e) => onChange({ jurisdiction: e.target.value })}
            placeholder="Building jurisdiction"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-slate-700">
              Exposure Category
            </Label>
            <Select value={data.exposureCategory} onValueChange={(value) => onChange({ exposureCategory: value as any })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="B">Category B</SelectItem>
                <SelectItem value="C">Category C</SelectItem>
                <SelectItem value="D">Category D</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm font-medium text-slate-700">
              ASCE Version
            </Label>
            <Select value={data.asceVersion} onValueChange={(value) => onChange({ asceVersion: value as any })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7-10">ASCE 7-10</SelectItem>
                <SelectItem value="7-16">ASCE 7-16</SelectItem>
                <SelectItem value="7-22">ASCE 7-22</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2 pt-6">
            <Checkbox
              id="hvhzZone"
              checked={data.hvhzZone}
              onCheckedChange={(checked) => onChange({ hvhzZone: checked as boolean })}
            />
            <Label htmlFor="hvhzZone" className="text-sm font-medium text-slate-700">
              HVHZ Zone
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
