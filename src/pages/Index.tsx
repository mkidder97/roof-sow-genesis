import React from 'react';
import { SOWInputForm } from '@/components/SOWInputForm';
import '@/styles/tesla-ui.css';

const Index = () => {
  return (
    <div className="tesla-dark min-h-screen tesla-scrollbar">
      {/* Tesla-Style Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-tesla-bg-primary via-tesla-bg-secondary to-tesla-bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.05),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_80%,rgba(245,158,11,0.05),transparent_50%)]"></div>
      </div>

      {/* Tesla-Style Header */}
      <header className="relative z-10 tesla-glass-card mx-4 mt-4 mb-8">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            {/* Tesla-Style Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 tesla-glass-card mb-6 tesla-glow">
              <svg 
                className="w-10 h-10 text-tesla-blue" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                style={{ filter: 'drop-shadow(0 0 10px currentColor)' }}
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            
            {/* Tesla-Style Typography */}
            <h1 className="tesla-h1 mb-4 tesla-animate-in">
              TPO Roof SOW Generator
            </h1>
            <p className="tesla-body max-w-3xl mx-auto tesla-animate-in" style={{ animationDelay: '0.2s' }}>
              Professional scope of work generation for TPO roofing projects with AI-powered PDF parsing and intelligent field automation
            </p>
            
            {/* Tesla-Style Status Indicators */}
            <div className="flex justify-center gap-4 mt-6">
              <div className="tesla-status success">
                <div className="w-2 h-2 bg-tesla-success rounded-full tesla-pulse"></div>
                System Active
              </div>
              <div className="tesla-status success">
                <div className="w-2 h-2 bg-tesla-blue rounded-full tesla-pulse"></div>
                PDF Parser Ready
              </div>
              <div className="tesla-status success">
                <div className="w-2 h-2 bg-tesla-warning rounded-full tesla-pulse"></div>
                Wind Analysis Online
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="container mx-auto px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            {/* Tesla-Style Progress Bar */}
            <div className="tesla-glass-card p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="tesla-h3">Project Configuration</h3>
                <div className="tesla-progress-ring">
                  <span>0%</span>
                </div>
              </div>
              <div className="w-full bg-tesla-surface rounded-full h-2">
                <div className="bg-gradient-to-r from-tesla-blue to-tesla-blue-light h-2 rounded-full transition-all duration-500" style={{ width: '0%' }}></div>
              </div>
              <div className="flex justify-between text-tesla-small text-tesla-text-muted mt-2">
                <span>Project Info</span>
                <span>Building Specs</span>
                <span>Insulation</span>
                <span>Features</span>
                <span>Review</span>
              </div>
            </div>

            {/* Tesla-Style Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="tesla-glass-card p-6 text-center tesla-animate-in">
                <div className="tesla-h2 text-tesla-blue mb-2">∞</div>
                <div className="tesla-small text-tesla-text-secondary">Projects Generated</div>
              </div>
              <div className="tesla-glass-card p-6 text-center tesla-animate-in" style={{ animationDelay: '0.1s' }}>
                <div className="tesla-h2 text-tesla-success mb-2">99.9%</div>
                <div className="tesla-small text-tesla-text-secondary">Accuracy Rate</div>
              </div>
              <div className="tesla-glass-card p-6 text-center tesla-animate-in" style={{ animationDelay: '0.2s' }}>
                <div className="tesla-h2 text-tesla-warning mb-2">&lt;30s</div>
                <div className="tesla-small text-tesla-text-secondary">Avg Generation</div>
              </div>
              <div className="tesla-glass-card p-6 text-center tesla-animate-in" style={{ animationDelay: '0.3s' }}>
                <div className="tesla-h2 text-tesla-text-primary mb-2">24/7</div>
                <div className="tesla-small text-tesla-text-secondary">Availability</div>
              </div>
            </div>

            {/* Main Form */}
            <div className="tesla-animate-in" style={{ animationDelay: '0.4s' }}>
              <SOWInputForm />
            </div>
          </div>
        </div>
      </main>

      {/* Tesla-Style Footer */}
      <footer className="relative z-10 tesla-glass-card mx-4 mb-4 mt-8">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="tesla-small text-tesla-text-muted">
              © 2025 TPO Roof SOW Generator • Professional Edition
            </div>
            <div className="flex items-center gap-4">
              <div className="tesla-status success">
                <div className="w-2 h-2 bg-tesla-success rounded-full"></div>
                All Systems Operational
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
