
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Database, AlertTriangle, TrendingUp, Archive } from 'lucide-react';
import { useDatabaseHealth, usePerformanceMetrics, useAuditLog, refreshDashboardMetrics, archiveOldSOWs } from '@/hooks/useDatabaseHealth';
import { toast } from '@/hooks/use-toast';

const DatabaseHealthDashboard: React.FC = () => {
  const { data: health, isLoading: healthLoading, error: healthError } = useDatabaseHealth();
  const { data: performanceMetrics, isLoading: metricsLoading } = usePerformanceMetrics();
  const { data: auditLog, isLoading: auditLoading } = useAuditLog();

  const handleRefreshMetrics = async () => {
    try {
      await refreshDashboardMetrics();
      toast({
        title: "Success",
        description: "Dashboard metrics refreshed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh dashboard metrics",
        variant: "destructive",
      });
    }
  };

  const handleArchiveSOWs = async () => {
    try {
      const archivedCount = await archiveOldSOWs();
      toast({
        title: "Success",
        description: `Archived ${archivedCount} old SOW records`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive old SOWs",
        variant: "destructive",
      });
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (healthLoading) {
    return <div className="p-6">Loading database health...</div>;
  }

  if (healthError) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span>Database health check failed</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Database Health & Performance</h2>
        <div className="flex gap-2">
          <Button onClick={handleRefreshMetrics} variant="outline" size="sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh Metrics
          </Button>
          <Button onClick={handleArchiveSOWs} variant="outline" size="sm">
            <Archive className="w-4 h-4 mr-2" />
            Archive Old SOWs
          </Button>
        </div>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.active_connections || 0}</div>
            <Badge variant={health?.active_connections > 20 ? "destructive" : "default"}>
              {health?.active_connections > 20 ? "High" : "Normal"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Slow Queries</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.slow_queries || 0}</div>
            <Badge variant={health?.slow_queries > 0 ? "destructive" : "default"}>
              {health?.slow_queries > 0 ? "Issues" : "Good"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.database_size ? formatBytes(health.database_size) : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="default">Online</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="tables">Table Sizes</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div>Loading performance metrics...</div>
              ) : (
                <div className="space-y-2">
                  {performanceMetrics?.slice(0, 10).map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <span className="font-medium">{metric.metric_name}</span>
                        <div className="text-sm text-gray-600">
                          {new Date(metric.recorded_at).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline">{metric.metric_value}</Badge>
                    </div>
                  )) || <div>No performance metrics available</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div>Loading audit log...</div>
              ) : (
                <div className="space-y-2">
                  {auditLog?.slice(0, 20).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <Badge variant="outline">{entry.action}</Badge>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(entry.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm">
                        {entry.details && Object.keys(entry.details).length > 0 && (
                          <pre className="text-xs bg-gray-100 p-1 rounded">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  )) || <div>No audit log entries available</div>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Table Sizes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {health?.table_sizes ? (
                  Object.entries(health.table_sizes).map(([tableName, size]) => (
                    <div key={tableName} className="flex items-center justify-between py-2 border-b">
                      <span className="font-medium">{tableName}</span>
                      <Badge variant="outline">{formatBytes(size as number)}</Badge>
                    </div>
                  ))
                ) : (
                  <div>No table size information available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseHealthDashboard;
