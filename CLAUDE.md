# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This is a Graffiticode language implementation (L0165) for creating spreadsheet-based assessments. The codebase is a monorepo with two packages:

- **packages/api**: Express.js server that compiles L0165 code and serves the application
- **packages/app**: React component library built with Vite that provides spreadsheet UI components

### Core Components

**API Server (packages/api)**:
- Express server running on port 50165 (configurable via PORT env var)
- Compiler pipeline that transforms L0165 language code into executable spreadsheet configurations
- Authentication integration with Graffiticode auth service
- Static file serving for the built app

**React Library (packages/app)**:
- Reusable spreadsheet components using ProseMirror for rich text editing
- Form components including TableEditor, TextEditor, FormulaBar
- Storybook integration for component development
- Exports as both ES module and UMD bundle

### L0165 Language

L0165 is a domain-specific language for defining spreadsheet assessments with these key functions:
- `cells`: Define cell content and assessment rules
- `rows`: Configure row properties and assessment ordering
- `columns`: Set column widths and justification
- `params`: Define parameter templates for cell population

## Development Commands

**Root level (monorepo)**:
```bash
npm run build          # Build both API and app packages
npm run dev            # Start API server in development mode
npm run start          # Start API server in production mode
npm run lint           # Lint test files
npm run pack           # Package the app for distribution
```

**API package (packages/api)**:
```bash
npm run dev            # Start with Firestore emulator and local auth
npm run build-lexicon  # Generate lexicon.js from source
npm run build-spec     # Generate spec.html from markdown
npm run lint           # Lint API source code
```

**App package (packages/app)**:
```bash
npm run dev            # Start Vite dev server
npm run build          # Build library for distribution
npm run storybook      # Launch Storybook on port 6006
npm run lint           # Lint TypeScript/React code
```

## Development Environment

- Uses Firebase Firestore emulator on 127.0.0.1:8080 for local development
- Auth service runs on local port 4100 during development
- API serves both compiled application and static assets from dist/ and public/
- Lexicon is auto-generated from compiler source during build process

## Testing

Tests use Jest framework configured at the root level. Test files are ignored in packages/ directories and run from the root test/ directory.