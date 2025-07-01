import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import SOWGenerationPage from './pages/SOWGenerationPage';
import FieldInspectionPage from './pages/FieldInspectionPage';
import WindAnalysisPage from './pages/WindAnalysisPage';
import PricingPage from './pages/PricingPage';
import AccountPage from './pages/AccountPage';
import { Toaster } from '@/components/ui/toaster';
import GcpConfig from './pages/GcpConfig';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sow-generation" element={<SOWGenerationPage />} />
          <Route path="/field-inspection" element={<FieldInspectionPage />} />
          <Route path="/wind-analysis" element={<WindAnalysisPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/gcp-config" element={<GcpConfig />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
