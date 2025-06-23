# Frontend-Backend Integration Setup Guide

This guide walks you through connecting your Lovable UI frontend to your SOW generation backend running on port 3001.

## Quick Setup

### 1. **Start Your Backend Server**
```bash
cd server
npm run start:enhanced
```

Your backend should be running on `http://localhost:3001` with the following endpoints:
- 🎯 **Main SOW Generation**: `POST /api/sow/debug-sow`
- 🏥 **Health Check**: `GET /health`
- 📊 **Status**: `GET /api/status`
- 📖 **Documentation**: `GET /api/docs`

### 2. **Set Up Environment Variables**
```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` file:
```env
VITE_API_URL=http://localhost:3001
VITE_DEBUG_MODE=false
```

### 3. **Start Your Frontend**
```bash
# From root directory
npm run dev
```

Your frontend will be available at `http://localhost:5173`

### 4. **Test the Connection**
1. Navigate to the Dashboard → Backend Test tab
2. Click "Test All Endpoints" to verify connectivity
3. Check that all endpoints show green ✓ status

## What's Integrated

### ✅ **API Configuration** (`src/lib/api.ts`)
- Dynamic backend URL configuration
- File upload support for takeoff documents
- Error handling and retry logic
- TypeScript interfaces for requests/responses

### ✅ **React Hooks** (`src/hooks/useSOWGeneration.ts`)
- `useSOWGeneration` - Main SOW generation with progress tracking
- `useSOWDebug` - Debug mode for development
- `useEngineDebug` - Engine-specific debugging
- `useTemplateOperations` - Template management
- Backend health monitoring

### ✅ **Updated SOW Generation Page**
- Real-time backend connection status
- Progress tracking during generation
- File upload integration
- Debug mode toggle
- Error handling and user feedback

### ✅ **Backend Testing Dashboard**
- Live connection monitoring
- Endpoint testing
- Health status display
- Setup instructions

## How It Works

### **1. Project Input Flow**
```
User Input → SOWInputForm → ProjectData → API Request
```

### **2. SOW Generation Flow**
```
ProjectData + File → useSOWGeneration hook → Backend API → PDF Response
```

### **3. Backend Communication**
```typescript
// Main generation endpoint
POST /api/sow/debug-sow
{
  projectName: string,
  projectAddress: string,
  buildingHeight: number,
  takeoffFile?: File,
  // ... other project data
}

// Response
{
  success: boolean,
  data: {
    sow: string,
    pdf: string, // base64 encoded
    engineeringSummary: object
  }
}
```

## Features

### **🔄 Real-time Status Monitoring**
- Automatic backend health checks every 30 seconds
- Connection status indicators throughout the UI
- Detailed endpoint testing

### **📤 File Upload Support**
- Takeoff PDF/CSV/Excel file uploads
- Form data encoding for multipart requests
- File size and type validation

### **🐛 Debug Mode**
- Toggle debug mode for development
- Detailed API response inspection
- Engine-specific debugging capabilities

### **⚡ Progress Tracking**
- Real-time generation progress
- Status messages during processing
- Error handling with user-friendly messages

### **📱 Responsive UI**
- Works on desktop and mobile
- Loading states and progress indicators
- Accessible error messages

## Troubleshooting

### **Backend Not Responding**
```bash
# Check if backend is running
curl http://localhost:3001/health

# If not running, start it:
cd server
npm run start:enhanced
```

### **CORS Issues**
Your backend (`server/index-enhanced.ts`) should already have CORS configured:
```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

### **File Upload Issues**
- Ensure `multer` is properly configured in backend
- Check file size limits (default: 50MB)
- Verify file types are supported

### **Environment Variables**
```bash
# Check if .env is loaded
echo $VITE_API_URL

# Should output: http://localhost:3001
```

## API Endpoints Reference

### **Main Generation**
- `POST /api/sow/debug-sow` - Main SOW generation with file upload
- `POST /api/debug-sow-enhanced` - Enhanced debug without file
- `POST /api/debug-engine-trace` - Engine-specific debugging

### **Templates**
- `POST /api/render-template` - Render specific template
- `GET /api/template-map` - Get available templates

### **System**
- `GET /health` - Backend health check
- `GET /api/status` - Detailed system status
- `GET /api/docs` - API documentation

## Development Workflow

### **1. Development Mode**
```bash
# Terminal 1: Start backend
cd server
npm run start:enhanced

# Terminal 2: Start frontend
npm run dev
```

### **2. Testing New Features**
1. Use Dashboard → Backend Test to verify connection
2. Enable Debug Mode in SOW Generation
3. Test with sample project data
4. Review debug output for troubleshooting

### **3. Production Deployment**
1. Update `VITE_API_URL` in production environment
2. Ensure backend CORS allows production domain
3. Test file upload limits and timeouts

## Security Considerations

### **Environment Variables**
- Never commit `.env` files to git
- Use different API URLs for dev/prod
- Secure backend endpoints in production

### **File Uploads**
- Validate file types and sizes
- Scan uploaded files for security
- Limit upload frequency per user

### **API Security**
- Implement rate limiting
- Add authentication tokens
- Validate all input data

## Next Steps

1. **✅ Backend Connected** - Your frontend now communicates with the backend
2. **🔄 Test Full Workflow** - Try generating a complete SOW
3. **🐛 Debug Issues** - Use the debug mode for troubleshooting
4. **📈 Monitor Performance** - Check generation times and success rates
5. **🚀 Deploy** - Set up production deployment

## Support

If you encounter issues:

1. Check the Backend Test tab in Dashboard
2. Review browser console for errors
3. Verify backend logs for server-side issues
4. Test individual API endpoints with curl/Postman

Your Lovable UI frontend is now fully integrated with your SOW generation backend! 🎉
