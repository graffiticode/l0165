# GraffitiCode L0165 - React Form Library

## Commands
- **Build**: `npm run build` (TypeScript compile + Vite build)
- **Dev**: `npm run dev` (Vite dev server)
- **Lint**: `npm run lint` (ESLint with TypeScript)
- **Preview**: `npm run preview` (Preview built library)
- **Pack**: `npm run pack` (Build and create npm package)

## Architecture
- **Package**: `@graffiticode/l0165` - React library for interactive spreadsheet-like forms
- **Entry Point**: `packages/app/lib/index.ts` exports Form, View, scoreCells, getCellsValidation
- **Main Components**: Form (packages/app/form/Form.tsx), View (packages/app/view.jsx - state management)
- **API Server**: Express.js server in `packages/api/` for compiling L0165 language and form processing
- **Build**: Vite library mode, outputs ESM/UMD to dist/ with TypeScript declarations
- **Dependencies**: React, ProseMirror (rich text), SWR (data fetching), Tailwind CSS

## Code Style
- **TypeScript**: ES2020 target, strict disabled, JSX react-jsx transform
- **Files**: Source in packages/app/lib/, TypeScript .ts/.tsx, some legacy .jsx files
- **Imports**: ESM modules, React hooks patterns, SWR for server state
- **Styling**: Tailwind CSS utility classes, content scanned from lib/**
- **Exports**: Named exports from index files, external React/ReactDOM/Tailwind
- **State**: Functional components with hooks, SWR for API calls, message passing for iframe communication
