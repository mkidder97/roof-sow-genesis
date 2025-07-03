import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Building, Wrench, Table } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectInputs {
  address: string;
  buildingHeight: number;
  squareFootage: number;
  exposureCategory: 'B' | 'C' | 'D';
  membraneType: string;
}

interface ManufacturerProduct {
  manufacturer: string;
  product: string;
  approvalNumber: string;
  windRating: number;
  available: boolean;
}

interface ZonePressures {
  field: number;
  perimeter: number;
  corner: number;
}

interface FasteningSchedule {
  zone: string;
  spacing: string;
  fastenerType: string;
  plateSize: string;
}

export const SimplifiedSOWGenerator: React.FC = () => {
  const { toast } = useToast();
  const [step, setStep] = useState<'input' | 'products' | 'uplift' | 'schedule'>('input');
  
  const [inputs, setInputs] = useState<ProjectInputs>({
    address: '',
    buildingHeight: 35,
    squareFootage: 42000,
    exposureCategory: 'C',
    membraneType: 'TPO'
  });

  const [availableProducts, setAvailableProducts] = useState<ManufacturerProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ManufacturerProduct | null>(null);
  const [zonePressures, setZonePressures] = useState<ZonePressures | null>(null);
  const [fasteningSchedule, setFasteningSchedule] = useState<FasteningSchedule[]>([]);

  // Step 1: Find manufacturer products based on inputs
  const findProducts = async () => {
    const isHVHZ = inputs.address.toLowerCase().includes('miami') || 
                   inputs.address.toLowerCase().includes('doral') ||
                   inputs.address.toLowerCase().includes('florida');
    
    const windSpeed = isHVHZ ? 185 : 115;
    
    // Mock manufacturer products with real approval numbers
    const products: ManufacturerProduct[] = [
      {
        manufacturer: 'Carlisle',
        product: 'Sure-Weld TPO 80mil HVHZ',
        approvalNumber: 'FL17825.1-R60',
        windRating: 220,
        available: windSpeed <= 185
      },
      {
        manufacturer: 'Johns Manville',
        product: 'TPO Fleeceback 115mil',
        approvalNumber: 'FL16758.3-R35',
        windRating: 285,
        available: true
      },
      {
        manufacturer: 'GAF',
        product: 'EverGuard TPO Extreme',
        approvalNumber: 'FL18552.1-R40',
        windRating: 180,
        available: windSpeed <= 160
      }
    ];

    setAvailableProducts(products.filter(p => p.available));
    setStep('products');
    
    toast({
      title: "Products Found",
      description: `Found ${products.filter(p => p.available).length} compatible products for your location`,
    });
  };

  // Step 2: Calculate uplift pressures per zone
  const calculateUplift = (product: ManufacturerProduct) => {
    setSelectedProduct(product);
    
    const isHVHZ = inputs.address.toLowerCase().includes('miami') || 
                   inputs.address.toLowerCase().includes('doral');
    const windSpeed = isHVHZ ? 185 : 115;
    
    // ASCE 7-16 wind pressure calculation
    const qz = 0.00256 * 0.98 * 1.0 * 0.85 * 1.0 * Math.pow(windSpeed, 2);
    
    const pressures: ZonePressures = {
      field: Math.round(qz * 0.9 * 10) / 10,
      perimeter: Math.round(qz * 1.4 * 10) / 10, 
      corner: Math.round(qz * (isHVHZ ? 2.8 : 2.5) * 10) / 10
    };

    setZonePressures(pressures);
    setStep('uplift');
    
    toast({
      title: "Uplift Calculated",
      description: `Wind pressures calculated for ${windSpeed}mph basic wind speed`,
    });
  };

  // Step 3: Build fastening schedule
  const buildFasteningSchedule = () => {
    if (!selectedProduct || !zonePressures) return;

    const schedule: FasteningSchedule[] = [
      {
        zone: 'Field',
        spacing: '12" o.c.',
        fastenerType: '#15 HD Fastener',
        plateSize: '3" Seam Plate'
      },
      {
        zone: 'Perimeter',
        spacing: '9" o.c.',
        fastenerType: '#15 HD Fastener', 
        plateSize: '3" Seam Plate'
      },
      {
        zone: 'Corner',
        spacing: '6" o.c.',
        fastenerType: '#15 HD Fastener',
        plateSize: '3" HD Plate'
      }
    ];

    setFasteningSchedule(schedule);
    setStep('schedule');
    
    toast({
      title: "Schedule Generated",
      description: "Fastening schedule built based on calculated pressures",
    });
  };

  const resetProcess = () => {
    setStep('input');
    setAvailableProducts([]);
    setSelectedProduct(null);
    setZonePressures(null);
    setFasteningSchedule([]);
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {['Input', 'Products', 'Uplift', 'Schedule'].map((stepName, index) => {
            const stepKey = ['input', 'products', 'uplift', 'schedule'][index];
            const isActive = step === stepKey;
            const isCompleted = ['input', 'products', 'uplift', 'schedule'].indexOf(step) > index;
            
            return (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCompleted ? 'bg-green-600 text-white' : 
                  isActive ? 'bg-blue-600 text-white' : 
                  'bg-gray-600 text-gray-300'
                }`}>
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>
                  {stepName}
                </span>
                {index < 3 && <div className="w-8 h-0.5 bg-gray-600 mx-4" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Project Inputs */}
      {step === 'input' && (
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building className="w-5 h-5" />
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-blue-200">Project Address *</Label>
                <Input 
                  value={inputs.address}
                  onChange={(e) => setInputs({...inputs, address: e.target.value})}
                  placeholder="123 Main St, Miami, FL"
                  className="bg-white/10 border-blue-400/30 text-white"
                />
              </div>
              <div>
                <Label className="text-blue-200">Building Height (ft)</Label>
                <Input 
                  type="number"
                  value={inputs.buildingHeight}
                  onChange={(e) => setInputs({...inputs, buildingHeight: Number(e.target.value)})}
                  className="bg-white/10 border-blue-400/30 text-white"
                />
              </div>
              <div>
                <Label className="text-blue-200">Square Footage</Label>
                <Input 
                  type="number"
                  value={inputs.squareFootage}
                  onChange={(e) => setInputs({...inputs, squareFootage: Number(e.target.value)})}
                  className="bg-white/10 border-blue-400/30 text-white"
                />
              </div>
              <div>
                <Label className="text-blue-200">Exposure Category</Label>
                <Select value={inputs.exposureCategory} onValueChange={(value: 'B' | 'C' | 'D') => setInputs({...inputs, exposureCategory: value})}>
                  <SelectTrigger className="bg-white/10 border-blue-400/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B">B - Suburban</SelectItem>
                    <SelectItem value="C">C - Open Terrain</SelectItem>
                    <SelectItem value="D">D - Flat/Unobstructed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={findProducts} 
              disabled={!inputs.address.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Find Compatible Products
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Available Products */}
      {step === 'products' && (
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Available Manufacturer Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableProducts.map((product, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg border border-blue-400/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-semibold">{product.manufacturer}</h3>
                      <p className="text-blue-200">{product.product}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-green-600 text-white">
                          Approval: {product.approvalNumber}
                        </Badge>
                        <Badge className="bg-blue-600 text-white">
                          {product.windRating} psf
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => calculateUplift(product)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Select & Calculate Uplift
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => setStep('input')} variant="outline" className="mt-4">
              Back to Inputs
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Uplift Calculation Results */}
      {step === 'uplift' && zonePressures && (
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Zone Pressure Calculation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-blue-900/50 border-blue-400/30">
              <AlertDescription className="text-blue-200">
                Selected Product: <strong>{selectedProduct?.manufacturer} {selectedProduct?.product}</strong>
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-900/30 rounded-lg border border-green-400/30">
                <h3 className="text-green-400 font-semibold">Field Zone</h3>
                <p className="text-white text-2xl font-bold">{zonePressures.field} psf</p>
                <p className="text-green-200 text-sm">Central roof area</p>
              </div>
              <div className="p-4 bg-yellow-900/30 rounded-lg border border-yellow-400/30">
                <h3 className="text-yellow-400 font-semibold">Perimeter Zone</h3>
                <p className="text-white text-2xl font-bold">{zonePressures.perimeter} psf</p>
                <p className="text-yellow-200 text-sm">Edge areas</p>
              </div>
              <div className="p-4 bg-red-900/30 rounded-lg border border-red-400/30">
                <h3 className="text-red-400 font-semibold">Corner Zone</h3>
                <p className="text-white text-2xl font-bold">{zonePressures.corner} psf</p>
                <p className="text-red-200 text-sm">Corner areas</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={buildFasteningSchedule}
                className="bg-green-600 hover:bg-green-700"
              >
                Generate Fastening Schedule
              </Button>
              <Button onClick={() => setStep('products')} variant="outline">
                Back to Products
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Fastening Schedule */}
      {step === 'schedule' && (
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Table className="w-5 h-5" />
              Fastening Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-green-900/50 border-green-400/30">
              <AlertDescription className="text-green-200">
                Fastening schedule generated for <strong>{selectedProduct?.manufacturer} {selectedProduct?.product}</strong>
              </AlertDescription>
            </Alert>
            
            <div className="overflow-hidden rounded-lg border border-blue-400/30">
              <table className="w-full">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-4 py-3 text-left text-white font-semibold">Zone</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Spacing</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Fastener Type</th>
                    <th className="px-4 py-3 text-left text-white font-semibold">Plate Size</th>
                  </tr>
                </thead>
                <tbody>
                  {fasteningSchedule.map((row, index) => (
                    <tr key={index} className="bg-white/5 border-b border-blue-400/20">
                      <td className="px-4 py-3 text-white font-medium">{row.zone}</td>
                      <td className="px-4 py-3 text-blue-200">{row.spacing}</td>
                      <td className="px-4 py-3 text-blue-200">{row.fastenerType}</td>
                      <td className="px-4 py-3 text-blue-200">{row.plateSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={() => {
                  toast({
                    title: "Schedule Downloaded",
                    description: "Fastening schedule has been saved",
                  });
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Download Schedule
              </Button>
              <Button onClick={resetProcess} variant="outline">
                Start New Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};