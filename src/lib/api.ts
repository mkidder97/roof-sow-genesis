// src/lib/api.ts - API configuration for connecting to your backend

const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'https://your-production-backend.com' 
  : 'http://localhost:3001';

export const API_ENDPOINTS = {
  // FIXED: Point to the actual working endpoint from enhanced server
  generateSOW: `${API_BASE_URL}/api/sow/debug-sow`,
  downloadSOW: `${API_BASE_URL}/api/sow/download`,
  getSOWStatus: `${API_BASE_URL}/api/sow/status`,
  listSOWs: `${API_BASE_URL}/api/sow/list`,
  deleteSOW: `${API_BASE_URL}/api/sow`,
  
  // Debug and Development (existing)
  debugSOW: `${API_BASE_URL}/api/sow/debug-sow`,
  debugEngine: `${API_BASE_URL}/api/debug-engine-trace`,
  
  // Template System (existing)
  renderTemplate: `${API_BASE_URL}/api/render-template`,
  templateMap: `${API_BASE_URL}/api/template-map`,
  
  // System Status
  health: `${API_BASE_URL}/health`,
  status: `${API_BASE_URL}/api/status`,
  docs: `${API_BASE_URL}/api/docs`,
  
  // Draft Management
  saveDraft: `${API_BASE_URL}/api/drafts/save`,
  loadDraft: `${API_BASE_URL}/api/drafts`,
  listDrafts: `${API_BASE_URL}/api/drafts/list`,
  deleteDraft: `${API_BASE_URL}/api/drafts`,
  calculateSquareFootage: `${API_BASE_URL}/api/drafts/calculate-sqft`,
  
  // Legacy endpoints (still supported)
  generateSOWLegacy: `${API_BASE_URL}/api/generate-sow`,
  debugSOWLegacy