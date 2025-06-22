# Quick Start: SOW Generator with Supabase Integration

This guide will get you up and running with the SOW Generator's new Supabase database integration in minutes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Git for cloning the repository

## Setup Steps

### 1. Clone and Install

```bash
git clone https://github.com/mkidder97/roof-sow-genesis.git
cd roof-sow-genesis/server
npm install
```

### 2. Supabase Setup

1. **Create Supabase Project**:
   - Go to https://supabase.com
   - Create a new project
   - Wait for project initialization

2. **Get Your Credentials**:
   - Go to Project Settings → API
   - Copy your Project URL
   - Copy your Service Role Secret Key (not the anon key!)

3. **Run Database Migration**:
   ```bash
   # Option A: Using Supabase CLI (recommended)
   npm install -g supabase
   supabase login
   supabase link --project-ref your-project-ref
   supabase db push
   
   # Option B: Manual SQL execution
   # Copy the SQL from supabase/migrations/001_create_sow_tables.sql
   # Paste and execute in Supabase SQL Editor
   ```

### 3. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env file with your credentials
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
```

### 4. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm run build
npm start

# Or use the Supabase-integrated server directly
npx tsx server/index-supabase.ts
```

## Verify Installation

### 1. Check Health Status

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "3.1.0 - Complete Logic Engine with Supabase Integration",
  "database": {
    "connected": true,
    "status": "ok"
  },
  "supabase": {
    "connected": true,
    "status": "ok"
  }
}
```

### 2. Test SOW Generation with Database Persistence

```bash
curl -X POST http://localhost:3001/api/generate-sow \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Test Building",
    "address": "123 Main St, Dallas, TX",
    "companyName": "Test Company",
    "squareFootage": 10000,
    "buildingHeight": 25,
    "membraneThickness": "60mil",
    "projectType": "recover",
    "deckType": "steel"
  }'
```

Expected response:
```json
{
  "success": true,
  "projectId": "uuid-of-created-project",
  "sowOutputId": "uuid-of-sow-output",
  "isNewProject": true,
  "filename": "SOW_Test_Building_20250622.pdf",
  "metadata": {
    "database": {
      "projectId": "uuid",
      "sowOutputId": "uuid",
      "createdAt": "2025-06-22T...",
      "isNewProject": true
    }
  }
}
```

### 3. Test Project Retrieval

```bash
# Get all projects
curl http://localhost:3001/api/projects

# Get specific project (use projectId from previous response)
curl http://localhost:3001/api/projects/your-project-uuid

# Get specific SOW output (use sowOutputId from previous response)
curl http://localhost:3001/api/sow/your-sow-output-uuid
```

## Testing the Complete Flow

### 1. Generate First SOW

```bash
curl -X POST http://localhost:3001/api/generate-sow \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Miami Office Complex",
    "address": "2650 NW 89th Ct, Doral, FL 33172",
    "companyName": "ABC Roofing",
    "squareFootage": 50000,
    "buildingHeight": 30,
    "membraneThickness": "80mil",
    "projectType": "tearoff",
    "deckType": "steel",
    "numberOfDrains": 8,
    "numberOfPenetrations": 25
  }'
```

Note the `projectId` in the response.

### 2. Generate Second SOW for Same Project

```bash
# Use same projectName and address - should update existing project
curl -X POST http://localhost:3001/api/generate-sow \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Miami Office Complex",
    "address": "2650 NW 89th Ct, Doral, FL 33172",
    "companyName": "ABC Roofing",
    "squareFootage": 50000,
    "buildingHeight": 30,
    "membraneThickness": "60mil",
    "projectType": "recover",
    "deckType": "steel"
  }'
```

This should return `"isNewProject": false` and the same `projectId`.

### 3. View Project History

```bash
# Get the project with all SOW outputs
curl http://localhost:3001/api/projects/your-project-id-here
```

You should see both SOW outputs in the project's history.

## Debug Mode Testing

```bash
# Test debug mode with database save
curl -X POST http://localhost:3001/api/debug-sow \
  -H "Content-Type: application/json" \
  -d '{
    "saveToDatabase": true,
    "projectName": "Debug Test Building",
    "address": "456 Debug Ave, Test City, TX"
  }'

# Test debug mode without database save
curl -X POST http://localhost:3001/api/debug-sow \
  -H "Content-Type: application/json" \
  -d '{
    "saveToDatabase": false
  }'
```

## User Authentication Testing

```bash
# Test with user ID header
curl -X POST http://localhost:3001/api/generate-sow \
  -H "Content-Type: application/json" \
  -H "x-user-id: 123e4567-e89b-12d3-a456-426614174000" \
  -d '{
    "projectName": "User Test Building",
    "address": "789 User St, Auth City, TX",
    "squareFootage": 15000
  }'

# Test with user ID in body
curl -X POST http://localhost:3001/api/generate-sow \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "projectName": "Body Auth Test",
    "address": "321 Body Ave, ID City, TX",
    "squareFootage": 20000
  }'
```

## Troubleshooting

### Database Connection Issues

1. **Check Supabase Status**:
   ```bash
   curl http://localhost:3001/health
   ```

2. **Verify Environment Variables**:
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Check Supabase Project**:
   - Ensure project is not paused
   - Verify API keys are correct
   - Check if database migration ran successfully

### Common Issues

1. **"Table 'projects' doesn't exist"**:
   - Run the database migration
   - Check Supabase SQL Editor for table creation

2. **"Row Level Security policy violation"**:
   - Ensure RLS policies are created
   - Check user authentication headers

3. **"Connection refused"**:
   - Verify SUPABASE_URL is correct
   - Check network connectivity
   - Ensure project is active in Supabase dashboard

### Verify Database Schema

```sql
-- Run in Supabase SQL Editor to verify tables exist
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('projects', 'sow_outputs')
ORDER BY table_name, ordinal_position;
```

## Development Workflow

### 1. Start Development Server

```bash
npm run dev
```

### 2. Make Changes

The server will auto-reload on file changes.

### 3. Test Changes

Use the curl commands above to test your changes.

### 4. View Data in Supabase

- Go to your Supabase project dashboard
- Navigate to Table Editor
- View `projects` and `sow_outputs` tables
- Inspect the JSONB data structure

## Production Deployment

### 1. Environment Variables

Set these in your production environment:

```bash
SUPABASE_URL=your-production-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-production-service-key
NODE_ENV=production
PORT=3001
```

### 2. Database Setup

```bash
# Run migration on production Supabase project
supabase db push --project-ref your-production-project-ref
```

### 3. Start Production Server

```bash
npm run build
npm start
```

## Next Steps

1. **Frontend Integration**: Update your frontend to use the new database-aware endpoints
2. **User Authentication**: Integrate with Supabase Auth for real user management
3. **File Storage**: Consider using Supabase Storage for PDF files
4. **Analytics**: Query the JSONB engineering summaries for project analytics
5. **Dashboards**: Build project management dashboards using the new APIs

## API Reference

### Core Endpoints

- `POST /api/generate-sow` - Generate SOW with database persistence
- `GET /api/projects` - Get all user projects
- `GET /api/projects/:id` - Get project with SOW history
- `GET /api/sow/:id` - Get SOW output with metadata
- `POST /api/debug-sow` - Debug SOW generation
- `GET /health` - System health check

### Authentication

- Header: `x-user-id: uuid`
- Body: `{ "userId": "uuid" }`
- Fallback: Test user for development

### Response Format

All responses follow this structure:
```json
{
  "success": boolean,
  "projectId": "uuid",
  "sowOutputId": "uuid", 
  "isNewProject": boolean,
  "metadata": {
    "database": {
      "projectId": "uuid",
      "sowOutputId": "uuid",
      "createdAt": "timestamp",
      "isNewProject": boolean
    }
  }
}
```

You're now ready to use the SOW Generator with full Supabase integration! 🚀
