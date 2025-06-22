# 🏠 TPO Roof SOW Generator - Frontend

A modern React frontend for generating TPO roofing Scope of Work (SOW) documents.

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Backend URL
```bash
# Copy environment template
cp .env.example .env

# Edit .env file to set your backend URL
# For local development: VITE_API_URL=http://localhost:3001
# For production: VITE_API_URL=https://your-backend.fly.dev
```

### 3. Start Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:8080`

## 🔧 Configuration

### Environment Variables
- `VITE_API_URL`: Backend API base URL (defaults to `http://localhost:3001` in development)

### Backend Requirements
Your backend must provide these endpoints:
- `POST /api/generate-sow` - Generate SOW document
- `GET /health` - Health check

## 🧪 Testing Integration

### 1. Test Backend Connection
Click the "Test Connection" button in the UI or use browser console:
```javascript
fetch('http://localhost:3001/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend reachable:', d))
  .catch(e => console.error('❌ Backend not reachable:', e));
```

### 2. Test SOW Generation
Fill out the form with test data:
```json
{
  "projectName": "Test Roof Project",
  "address": "1505 Wallace Rd, Carrollton, TX 75006",
  "companyName": "Test Company",
  "squareFootage": 154400,
  "buildingHeight": 30,
  "buildingDimensions": { "length": 400, "width": 386 },
  "projectType": "recover",
  "membraneThickness": "60",
  "membraneColor": "White"
}
```

## 🐛 Troubleshooting

### "Cannot connect to backend server"
1. Ensure your backend is running on the correct port
2. Check the `VITE_API_URL` in your `.env` file
3. Verify CORS is properly configured on your backend
4. Use the "Test Connection" button to debug

### "Generation Failed"
1. Check browser console for detailed error messages
2. Enable debug mode to see request payload
3. Verify your backend `/api/generate-sow` endpoint is working

### CORS Issues
Your backend needs to allow requests from `http://localhost:8080`:
```javascript
// Express.js example
app.use(cors({
  origin: ['http://localhost:8080', 'https://your-frontend.vercel.app']
}));
```

## 📦 Build & Deploy

### Development Build
```bash
npm run build:dev
```

### Production Build
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Connect your repository
2. Set environment variable: `VITE_API_URL=https://your-backend.fly.dev`
3. Deploy

## 🛠 Tech Stack
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Radix UI** components
- **React Query** for API state management
- **React Router** for navigation

## 📝 API Payload Structure

The frontend sends this payload to `POST /api/generate-sow`:
```typescript
interface SOWPayload {
  projectName: string;
  address: string;
  companyName: string;
  squareFootage: number;
  buildingHeight: number;
  buildingDimensions: {
    length: number;
    width: number;
  };
  projectType: string;
  membraneThickness: string;
  membraneColor: string;
}
```

Expected response:
```typescript
interface SOWResponse {
  success: boolean;
  filename?: string;
  outputPath?: string;
  fileSize?: number;
  generationTime?: number;
  metadata?: {
    projectName: string;
    template: string;
    windPressure: string;
  };
  error?: string;
}
```
