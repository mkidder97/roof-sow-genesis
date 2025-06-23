
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, AlertTriangle, Clock } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'safety' | 'structure' | 'equipment' | 'documentation';
  required: boolean;
  completed: boolean;
  notes?: string;
  priority: 'high' | 'medium' | 'low';
}

interface InspectionChecklistSystemProps {
  projectType: 'recover' | 'tearoff' | 'new_construction';
  onProgress: (progress: number) => void;
  onValidationChange: (isValid: boolean) => void;
}

const InspectionChecklistSystem: React.FC<InspectionChecklistSystemProps> = ({
  projectType,
  onProgress,
  onValidationChange
}) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Generate dynamic checklist based on project type
  useEffect(() => {
    const generateChecklist = (): ChecklistItem[] => {
      const baseItems: ChecklistItem[] = [
        // Safety Items (Always Required)
        {
          id: 'safety-1',
          title: 'Fall Protection Assessment',
          description: 'Evaluate roof access safety and fall protection requirements',
          category: 'safety',
          required: true,
          completed: false,
          priority: 'high'
        },
        {
          id: 'safety-2',
          title: 'Electrical Hazards Check',
          description: 'Identify and document electrical equipment and lines',
          category: 'safety',
          required: true,
          completed: false,
          priority: 'high'
        },
        {
          id: 'safety-3',
          title: 'Weather Conditions',
          description: 'Document current weather and forecast impact',
          category: 'safety',
          required: true,
          completed: false,
          priority: 'medium'
        },

        // Structure Items
        {
          id: 'structure-1',
          title: 'Deck Type and Condition',
          description: 'Identify deck material and assess structural integrity',
          category: 'structure',
          required: true,
          completed: false,
          priority: 'high'
        },
        {
          id: 'structure-2',
          title: 'Building Dimensions',
          description: 'Measure and record building length, width, and height',
          category: 'structure',
          required: true,
          completed: false,
          priority: 'high'
        },
        {
          id: 'structure-3',
          title: 'Roof Slope Assessment',
          description: 'Determine roof slope and drainage patterns',
          category: 'structure',
          required: true,
          completed: false,
          priority: 'medium'
        },
        {
          id: 'structure-4',
          title: 'Parapet Heights',
          description: 'Measure parapet heights around building perimeter',
          category: 'structure',
          required: false,
          completed: false,
          priority: 'medium'
        },

        // Equipment Items
        {
          id: 'equipment-1',
          title: 'HVAC Unit Survey',
          description: 'Count, measure, and assess condition of HVAC equipment',
          category: 'equipment',
          required: true,
          completed: false,
          priority: 'high'
        },
        {
          id: 'equipment-2',
          title: 'Drain Inventory',
          description: 'Locate and assess all roof drains and scuppers',
          category: 'equipment',
          required: true,
          completed: false,
          priority: 'high'
        },
        {
          id: 'equipment-3',
          title: 'Penetration Survey',
          description: 'Document all roof penetrations and their conditions',
          category: 'equipment',
          required: true,
          completed: false,
          priority: 'medium'
        },
        {
          id: 'equipment-4',
          title: 'Skylight Assessment',
          description: 'Inventory and assess condition of skylights',
          category: 'equipment',
          required: false,
          completed: false,
          priority: 'low'
        },

        // Documentation Items
        {
          id: 'documentation-1',
          title: 'Overall Photo Documentation',
          description: 'Capture comprehensive roof overview photos',
          category: 'documentation',
          required: true,
          completed: false,
          priority: 'high'
        },
        {
          id: 'documentation-2',
          title: 'Detail Photography',
          description: 'Document specific conditions and problem areas',
          category: 'documentation',
          required: true,
          completed: false,
          priority: 'medium'
        },
        {
          id: 'documentation-3',
          title: 'Customer Interview',
          description: 'Discuss project requirements and concerns with customer',
          category: 'documentation',
          required: false,
          completed: false,
          priority: 'medium'
        }
      ];

      // Add project-type specific items
      if (projectType === 'tearoff') {
        baseItems.push(
          {
            id: 'tearoff-1',
            title: 'Existing Membrane Assessment',
            description: 'Evaluate existing membrane for complete removal requirements',
            category: 'structure',
            required: true,
            completed: false,
            priority: 'high'
          },
          {
            id: 'tearoff-2',
            title: 'Substrate Inspection',
            description: 'Assess deck condition for potential repairs',
            category: 'structure',
            required: true,
            completed: false,
            priority: 'high'
          }
        );
      }

      if (projectType === 'recover') {
        baseItems.push(
          {
            id: 'recover-1',
            title: 'Existing Membrane Condition',
            description: 'Rate existing membrane condition (1-10 scale)',
            category: 'structure',
            required: true,
            completed: false,
            priority: 'high'
          },
          {
            id: 'recover-2',
            title: 'Insulation Assessment',
            description: 'Evaluate existing insulation condition and R-value',
            category: 'structure',
            required: true,
            completed: false,
            priority: 'medium'
          }
        );
      }

      return baseItems;
    };

    setChecklist(generateChecklist());
  }, [projectType]);

  // Calculate progress and validation
  useEffect(() => {
    const totalItems = checklist.length;
    const completedItems = checklist.filter(item => item.completed).length;
    const requiredItems = checklist.filter(item => item.required);
    const completedRequiredItems = requiredItems.filter(item => item.completed);
    
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const isValid = completedRequiredItems.length === requiredItems.length;
    
    onProgress(progress);
    onValidationChange(isValid);
  }, [checklist, onProgress, onValidationChange]);

  const toggleItem = (itemId: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const updateNotes = (itemId: string, notes: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === itemId ? { ...item, notes } : item
    ));
  };

  const categories = [
    { id: 'all', label: 'All Items', color: 'bg-blue-500' },
    { id: 'safety', label: 'Safety', color: 'bg-red-500' },
    { id: 'structure', label: 'Structure', color: 'bg-green-500' },
    { id: 'equipment', label: 'Equipment', color: 'bg-purple-500' },
    { id: 'documentation', label: 'Documentation', color: 'bg-yellow-500' }
  ];

  const filteredChecklist = selectedCategory === 'all' 
    ? checklist 
    : checklist.filter(item => item.category === selectedCategory);

  const getCompletionStats = () => {
    const total = checklist.length;
    const completed = checklist.filter(item => item.completed).length;
    const required = checklist.filter(item => item.required).length;
    const completedRequired = checklist.filter(item => item.required && item.completed).length;
    
    return { total, completed, required, completedRequired };
  };

  const stats = getCompletionStats();
  const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span>Inspection Progress</span>
            <Badge className={stats.completedRequired === stats.required ? 'bg-green-500' : 'bg-yellow-500'}>
              {stats.completedRequired}/{stats.required} Required
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-blue-200 mb-2">
              <span>Overall Progress</span>
              <span>{stats.completed}/{stats.total} items</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{Math.round(progressPercentage)}%</div>
              <div className="text-blue-200">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{stats.total - stats.completed}</div>
              <div className="text-blue-200">Remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-all ${
              selectedCategory === category.id
                ? `${category.color} scale-105`
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {filteredChecklist.map((item) => (
          <Card 
            key={item.id} 
            className={`bg-white/10 backdrop-blur-md border-blue-400/30 transition-all ${
              item.completed ? 'bg-green-500/20 border-green-400/50' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleItem(item.id)}
                  className={`mt-1 transition-colors ${
                    item.completed ? 'text-green-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.completed ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${item.completed ? 'text-green-100 line-through' : 'text-white'}`}>
                      {item.title}
                    </h3>
                    
                    <div className="flex gap-1">
                      {item.required && (
                        <Badge className="bg-red-500 text-white text-xs">Required</Badge>
                      )}
                      
                      {item.priority === 'high' && (
                        <Badge className="bg-orange-500 text-white text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          High
                        </Badge>
                      )}
                      
                      <Badge className={`text-xs ${
                        categories.find(c => c.id === item.category)?.color || 'bg-gray-500'
                      }`}>
                        {item.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-blue-200 text-sm mb-3">{item.description}</p>
                  
                  <textarea
                    value={item.notes || ''}
                    onChange={(e) => updateNotes(item.id, e.target.value)}
                    placeholder="Add notes or observations..."
                    className="w-full p-2 text-sm bg-white/10 border border-blue-400/30 rounded text-white placeholder-blue-200"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Validation Alert */}
      {stats.completedRequired < stats.required && (
        <Card className="bg-orange-500/20 border-orange-400/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-orange-200">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <div className="font-medium">Required Items Incomplete</div>
                <div className="text-sm">
                  Complete {stats.required - stats.completedRequired} more required items before handoff
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InspectionChecklistSystem;
