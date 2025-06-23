
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import SOWGeneration from "./pages/SOWGeneration";
import NotFound from "./pages/NotFound";

// Import Field Inspector Components
import InspectorDashboard from "./components/field-inspector/InspectorDashboard";
import FieldInspectionForm from "./components/field-inspector/FieldInspectionForm";
import InspectionDetailsPage from "./pages/InspectionDetailsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/sow-generation" element={<SOWGeneration />} />
            
            {/* Field Inspector Routes */}
            <Route path="/field-inspector" element={<InspectorDashboard />} />
            <Route path="/field-inspection/new" element={<FieldInspectionForm />} />
            <Route path="/field-inspection/:id" element={<InspectionDetailsPage />} />
            <Route path="/field-inspection/:id/edit" element={<FieldInspectionForm />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
