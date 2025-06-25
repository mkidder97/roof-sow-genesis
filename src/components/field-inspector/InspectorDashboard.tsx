
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFieldInspections } from '@/hooks/useFieldInspections';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, ClipboardCheck, Calendar, MapPin, User, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import RoleBasedNavigation from '@/components/navigation/RoleBasedNavigation';
import Breadcrumb from '@/components/navigation/Breadcrumb';

const InspectorDashboard = () => {
  const { user } = useAuth();
  const { inspections, loading, error } = useFieldInspections();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Draft' | 'Completed' | 'Under Review' | 'Approved'>('all');

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = inspection.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inspection.project_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (inspection.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inspection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: inspections.length,
    pending: inspections.filter(i => i.status === 'Draft').length,
    completed: inspections.filter(i => i.status === 'Completed').length,
    thisWeek: inspections.filter(i => {
      const inspectionDate = new Date(i.created_at || '');
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return inspectionDate >= weekAgo;
    }).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-500';
      case 'Completed': return 'bg-green-500';
      case 'Under Review': return 'bg-blue-500';
      case 'Approved': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Emergency': return 'bg-red-500';
      case 'Expedited': return 'bg-orange-500';
      case 'Standard': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <RoleBasedNavigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-white text-xl flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading inspections...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      <RoleBasedNavigation />
      <Breadcrumb />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Field Inspector Dashboard</h1>
          <p className="text-blue-200">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-blue-200 text-sm">Total Inspections</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
              <div className="text-blue-200 text-sm">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-blue-200 text-sm">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.thisWeek}</div>
              <div className="text-blue-200 text-sm">This Week</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Button
            onClick={() => navigate('/field-inspection/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg h-auto"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Inspection
          </Button>
          
          {/* Ready for SOW Badge */}
          {inspections.filter(i => i.status === 'Completed' && !i.sow_generated).length > 0 && (
            <Button
              onClick={() => navigate('/dashboard', { state: { tab: 'ready-sow' } })}
              variant="outline"
              className="border-green-400 text-green-200 hover:bg-green-600 px-8 py-3 text-lg h-auto"
              size="lg"
            >
              <FileText className="w-5 h-5 mr-2" />
              {inspections.filter(i => i.status === 'Completed' && !i.sow_generated).length} Ready for SOW
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by project name, address, or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/20 border-blue-400/30 text-white placeholder-blue-200"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-48 bg-white/20 border-blue-400/30 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Inspections List */}
        <div className="space-y-4">
          {filteredInspections.length === 0 ? (
            <Card className="bg-white/10 backdrop-blur-md border-blue-400/30">
              <CardContent className="p-8 text-center">
                <ClipboardCheck className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {inspections.length === 0 ? 'No inspections yet' : 'No matching inspections'}
                </h3>
                <p className="text-blue-200 mb-4">
                  {inspections.length === 0 
                    ? 'Start by creating your first field inspection'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {inspections.length === 0 && (
                  <Button 
                    onClick={() => navigate('/field-inspection/new')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Inspection
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredInspections.map((inspection) => (
              <Card 
                key={inspection.id} 
                className="bg-white/10 backdrop-blur-md border-blue-400/30 hover:bg-white/20 transition-all cursor-pointer"
                onClick={() => navigate(`/field-inspection/${inspection.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-white">{inspection.project_name}</h3>
                        <div className="flex gap-2 flex-wrap">
                          <Badge className={`${getPriorityColor(inspection.priority_level)} text-white text-xs`}>
                            {inspection.priority_level}
                          </Badge>
                          <Badge className={`${getStatusColor(inspection.status)} text-white text-xs`}>
                            {inspection.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-blue-200 text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {inspection.project_address}
                      </div>
                      
                      {inspection.customer_name && (
                        <div className="flex items-center text-blue-200 text-sm">
                          <User className="w-4 h-4 mr-1" />
                          {inspection.customer_name}
                        </div>
                      )}
                      
                      <div className="flex items-center text-blue-200 text-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(new Date(inspection.inspection_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {inspection.square_footage && (
                        <div className="text-white font-medium">
                          {inspection.square_footage.toLocaleString()} sq ft
                        </div>
                      )}
                      <div className="text-blue-200 text-sm">
                        {format(new Date(inspection.created_at || ''), 'MMM dd, h:mm a')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InspectorDashboard;
