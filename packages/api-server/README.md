# API Server Package

Express.js backend server for the roof SOW generation system.

## Overview

This package contains all server-side code including Express routes, business logic, PDF generation, manufacturer scraping, and database integrations. It uses shared types from the `@roof-sow-genesis/shared` package.

## Structure

```
packages/api-server/
├── src/
│   ├── routes/         # Express route handlers
│   ├── core/           # Core business logic
│   ├── logic/          # SOW generation logic
│   ├── lib/            # Server utilities
│   ├── types/          # Server-specific types
│   ├── data/           # Data and templates
│   ├── templates/      # SOW templates
│   ├── scrapers/       # Manufacturer scrapers
│   ├── manufacturer/   # Manufacturer integrations
│   └── index.ts        # Server entry point
├── .env.example        # Environment variables template
└── package.json        # Dependencies and scripts
```

## Migration Plan

The following files should be moved from the current locations to this package:

### From `/server/` → `/packages/api-server/src/`
- `server/routes/` → `packages/api-server/src/routes/`
- `server/core/` → `packages/api-server/src/core/`
- `server/logic/` → `packages/api-server/src/logic/`
- `server/lib/` → `packages/api-server/src/lib/`
- `server/types/` → `packages/api-server/src/types/`
- `server/data/` → `packages/api-server/src/data/`
- `server/templates/` → `packages/api-server/src/templates/`
- `server/scrapers/` → `packages/api-server/src/scrapers/`
- `server/manufacturer/` → `packages/api-server/src/manufacturer/`
- `server/index*.ts` → `packages/api-server/src/` (choose main entry point)

### From `/backend/` → `/packages/api-server/`
- `backend/Dockerfile` → `packages/api-server/Dockerfile`
- Any other backend-specific files

### Configuration Files
- `server/package.json` → `packages/api-server/package.json` (already created)
- `server/tsconfig.json` → `packages/api-server/tsconfig.json` (already created)
- `server/.env*` → `packages/api-server/.env*`
- `server/railway.json` → `packages/api-server/railway.json`

## Entry Points

The server package has multiple entry points for different deployment scenarios:

- `src/index-production.ts` - Production server (recommended)
- `src/index-professional.ts` - Professional features
- `src/index-enhanced.ts` - Enhanced features  
- `src/index-supabase.ts` - Supabase integration
- `src/index-realtime-integrated.ts` - Real-time features
- `src/index.ts` - Legacy entry point

Choose the appropriate entry point for your deployment and update the package.json main field.

## Development

```bash
# From workspace root
npm run dev:server

# Or from this package
cd packages/api-server
npm run dev
```

## Build

```bash
# From workspace root
npm run build:server

# Or from this package
cd packages/api-server
npm run build
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default: 3001)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- Additional environment variables as needed

## Dependencies

- Express.js with TypeScript
- Supabase client
- Puppeteer for PDF generation
- Socket.io for real-time features
- Cheerio for web scraping
- Canvas and Sharp for image processing
- Shared types from `@roof-sow-genesis/shared`

## API Endpoints

- `POST /api/sow/generate` - Generate SOW document
- `GET /api/sow/status/:id` - Check generation status
- `GET /api/health` - Health check
- Additional endpoints as documented
