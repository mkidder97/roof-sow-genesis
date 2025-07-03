
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster"
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import Testimonials from "./pages/Testimonials";
import Team from "./pages/Team";
import Pricing from "./pages/Pricing";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";
import Maintenance from "./pages/Maintenance";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import FieldInspector from "./pages/FieldInspector";
import InspectorDashboard from "./components/field-inspector/InspectorDashboard";
import { FieldInspectionForm } from "./components/field-inspector/FieldInspectionForm";
import InspectionDetailsPage from "./pages/InspectionDetailsPage";
import SOWGeneration from "./pages/SOWGeneration";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toaster />
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/team" element={<Team />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/coming-soon" element={<ComingSoon />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            {/* Protected Engineer Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredPermission="engineer">
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/sow-generation" element={
              <ProtectedRoute requiredPermission="engineer">
                <SOWGeneration />
              </ProtectedRoute>
            } />

            {/* Protected Inspector Routes */}
            <Route path="/field-inspector" element={
              <ProtectedRoute requiredPermission="inspector">
                <FieldInspector />
              </ProtectedRoute>
            } />
            
            <Route path="/field-inspector/dashboard" element={
              <ProtectedRoute requiredPermission="inspector">
                <InspectorDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/field-inspection/new" element={
              <ProtectedRoute requiredPermission="inspector">
                <FieldInspectionForm />
              </ProtectedRoute>
            } />
            
            <Route path="/field-inspection/:id" element={
              <ProtectedRoute requiredPermission="inspector">
                <InspectionDetailsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/field-inspection/:id/edit" element={
              <ProtectedRoute requiredPermission="inspector">
                <FieldInspectionForm />
              </ProtectedRoute>
            } />
          </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
