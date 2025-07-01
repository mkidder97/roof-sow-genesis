
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Database, FileText } from "lucide-react";

interface AdminDashboardProps {
  onNavigateToGCPConfig: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToGCPConfig }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage system configurations and data</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onNavigateToGCPConfig}>
            <CardHeader className="text-center">
              <Database className="h-12 w-12 mx-auto text-blue-600 mb-2" />
              <CardTitle>GCP Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center mb-4">
                Manage GCP values for different roof types and zones
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Manage GCP Config
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Settings className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <CardTitle className="text-gray-500">System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center mb-4">
                Configure system-wide settings and preferences
              </p>
              <Button disabled className="w-full" variant="outline">
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <CardTitle className="text-gray-500">Report Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center mb-4">
                Manage SOW and report templates
              </p>
              <Button disabled className="w-full" variant="outline">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
