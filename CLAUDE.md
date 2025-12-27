# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
pnpm dev      # Start development server on localhost:3000
pnpm build    # Production build
pnpm start    # Run production server
pnpm lint     # Run ESLint
```

## Environment Setup

Requires `.env.local` with:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/core
```

## Architecture Overview

This is a **Next.js 16** frontend for a multi-tenant organization management platform, designed to mirror a Django backend's modular structure.

### Modular Organization Pattern

The codebase is organized by business module (core, hr, accounting, etc.). Each module follows this structure:
- Routes: `app/{module}/`
- Components: `components/{module}/`
- Services: `lib/services/{module}/`
- Types: `lib/types/{module}/`

### Key Directories

- **`components/ui/`** - Reusable shadcn/ui-based components (Button, Input, Card, Alert, Badge, Select)
- **`components/core/`** - Core module components (auth layouts, organization forms, dashboard layouts)
- **`lib/api/`** - API client with JWT token management and automatic refresh
- **`lib/services/`** - Service layer abstracting API calls
- **`lib/types/`** - TypeScript interfaces organized by module

### Import Conventions

Always import from index files, not direct file paths:

```typescript
// Correct
import { Button, Input } from '@/components/ui';
import { authService, organizationService } from '@/lib/services/core';
import type { Organization, AdminUser } from '@/lib/types/core';

// Avoid
import { Button } from '@/components/ui/button';
```

### API Client Pattern

The API client (`lib/api/client.ts`) handles:
- JWT token storage in localStorage
- Automatic token refresh on 401 errors
- Generic typed responses with `ApiError` class
- Native Fetch API (no external HTTP library)

Public endpoints use `apiClient.fetchPublic()`, protected endpoints use `apiClient.fetch()`.

### Component Patterns

- UI components use CVA (class-variance-authority) for variants
- Forward refs and HTML attribute extension for flexibility
- Built-in support for `loading` and `disabled` states
- `cn()` utility for class merging (clsx + tailwind-merge)

### Configuration Files

- **`lib/config.ts`** - Site metadata and route definitions
- **`lib/api/config.ts`** - API endpoints and storage keys
- **`components.json`** - shadcn/ui configuration (new-york style, lucide icons)

## Tech Stack

- Next.js 16 with App Router
- React 19, TypeScript 5 (strict mode)
- Tailwind CSS v4 with CSS variables for theming
- Radix UI primitives, Lucide icons
- Path alias: `@/*` → project root

## Currently Implemented

**Core Module:** Authentication (JWT), Organization CRUD, Category management, Dashboard with stats

**HR Module:** Placeholder structure for future employee/department management
