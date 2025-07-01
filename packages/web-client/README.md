# Web Client Package

React/Vite frontend application for the roof SOW generation system.

## Overview

This package contains all client-side code including React components, hooks, contexts, and UI logic. It communicates with the API server and uses shared types from the `@roof-sow-genesis/shared` package.

## Structure

```
packages/web-client/
├── src/
│   ├── components/     # React components
│   ├── hooks/         # Custom React hooks  
│   ├── contexts/      # React contexts
│   ├── pages/         # Page components
│   ├── lib/           # Client-side utilities
│   ├── styles/        # Styling and themes
│   └── integrations/  # Third-party integrations
├── public/            # Static assets
├── index.html         # HTML entry point
├── vite.config.ts     # Vite configuration
└── package.json       # Dependencies and scripts
```

## Migration Plan

The following files should be moved from the root directory to this package:

### From Root `/src/` → `/packages/web-client/src/`
- `src/components/` → `packages/web-client/src/components/`
- `src/hooks/` → `packages/web-client/src/hooks/`
- `src/contexts/` → `packages/web-client/src/contexts/`
- `src/pages/` → `packages/web-client/src/pages/`
- `src/lib/` → `packages/web-client/src/lib/`
- `src/styles/` → `packages/web-client/src/styles/`
- `src/integrations/` → `packages/web-client/src/integrations/`

### Configuration Files
- `index.html` → `packages/web-client/index.html`
- `vite.config.ts` → `packages/web-client/vite.config.ts`
- `tsconfig.json` → `packages/web-client/tsconfig.json`
- `tsconfig.app.json` → `packages/web-client/tsconfig.app.json`
- `tsconfig.node.json` → `packages/web-client/tsconfig.node.json`
- `tailwind.config.ts` → `packages/web-client/tailwind.config.ts`
- `postcss.config.js` → `packages/web-client/postcss.config.js`
- `eslint.config.js` → `packages/web-client/eslint.config.js`
- `components.json` → `packages/web-client/components.json`

### Assets
- `public/` → `packages/web-client/public/`

## Development

```bash
# From workspace root
npm run dev:client

# Or from this package
cd packages/web-client
npm run dev
```

## Build

```bash
# From workspace root
npm run build:client

# Or from this package  
cd packages/web-client
npm run build
```

## Dependencies

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI components
- React Hook Form
- Tanstack Query
- Socket.io client
- Shared types from `@roof-sow-genesis/shared`
