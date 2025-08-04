# Project Structure & Organization

## Directory Structure

```
xhs_create_v3/
├── app/                    # Next.js App Router directory
│   ├── api/               # API route handlers
│   │   ├── auth/          # Authentication endpoints
│   │   ├── admin/         # Admin management APIs
│   │   ├── explosive-contents/ # Content management
│   │   ├── credits/       # Credit system APIs
│   │   └── [feature]/     # Feature-specific APIs
│   ├── admin/             # Admin dashboard pages
│   ├── [feature-pages]/   # User-facing feature pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Homepage
├── components/            # Reusable React components
│   ├── ui/               # Base UI components (Radix-based)
│   └── [feature-components] # Feature-specific components
├── lib/                   # Utility libraries and configurations
│   ├── hooks/            # Custom React hooks
│   ├── services/         # Business logic services
│   ├── mysql.ts          # Database connection and queries
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Utility functions
├── mysql_migrations/      # Database migration scripts
├── scripts/              # Build and deployment scripts
├── public/               # Static assets
└── [config files]        # Configuration files
```

## Naming Conventions

### Files & Directories
- **Pages**: kebab-case (e.g., `account-positioning/page.tsx`)
- **Components**: PascalCase files, kebab-case directories (e.g., `SearchInterface.tsx`)
- **API Routes**: kebab-case (e.g., `explosive-contents/route.ts`)
- **Utilities**: camelCase (e.g., `imageUtils.ts`)

### Code Conventions
- **Components**: PascalCase (e.g., `SearchInterface`)
- **Functions**: camelCase (e.g., `getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`, `ApiResponse`)

## Component Organization

### UI Components (`/components/ui/`)
Base components built on Radix UI primitives:
- `button.tsx` - Button variants and styles
- `input.tsx` - Form input components
- `dialog.tsx` - Modal and dialog components
- `card.tsx` - Card layout components
- `badge.tsx` - Status and label badges

### Feature Components (`/components/`)
Business logic components:
- `search-interface.tsx` - Search functionality
- `auth-modal.tsx` - Authentication flows
- `credits-display.tsx` - Credit system UI
- `note-card.tsx` - Content display cards
- `[feature]-[component].tsx` - Feature-specific components

## API Route Structure

### Authentication (`/app/api/auth/`)
- `send-code/route.ts` - Email verification
- `verify-code/route.ts` - Login/registration
- `me/route.ts` - User profile
- `logout/route.ts` - Session termination

### Admin APIs (`/app/api/admin/`)
- `explosive-contents/` - Content management
- `users/` - User management
- `operations/` - Admin operations
- `logs/` - System logging

### Feature APIs
- `search/route.ts` - Content search
- `rewrite/route.ts` - Content rewriting
- `credits/` - Credit system
- `membership/` - Subscription management

## Database Layer (`/lib/mysql.ts`)

### Connection Management
- Connection pooling with retry logic
- Environment-based configuration
- Health check and monitoring functions

### Query Organization
- User authentication functions
- Content management operations
- Credit system transactions
- Admin operations
- Batch processing utilities

## Type Definitions (`/lib/types.ts`)

### Database Types
- Table row interfaces
- Insert/Update parameter types
- Query result types

### API Types
- Request/Response interfaces
- External service types (Coze, OSS)
- Business logic types

### UI Types
- Component prop interfaces
- Form validation schemas
- State management types

## Page Structure

### User Pages
- `/` - Homepage with feature overview
- `/search` - Content search and discovery
- `/rewrite` - Content rewriting tools
- `/note-rewrite` - Explosive content rewriting
- `/account-positioning` - AI positioning analysis
- `/credits-history` - Usage tracking
- `/prices` - Membership plans

### Admin Pages
- `/admin` - Dashboard and management
- `/admin/cover-update` - Batch cover updates
- `/admin/excel-upload` - Data import tools

## Configuration Files

### Build Configuration
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS setup
- `tsconfig.json` - TypeScript configuration
- `package.json` - Dependencies and scripts

### Development Tools
- `.eslintrc.json` - Code linting rules
- `components.json` - UI component configuration
- `.env.local` - Environment variables

## Migration System (`/mysql_migrations/`)

Sequential numbered migration files:
- `001_create_database_schema.sql` - Initial schema
- `002_create_account_positioning_table.sql` - Feature additions
- `[number]_[description].sql` - Incremental changes

## Asset Organization (`/public/`)

- `placeholder-*.png/svg` - UI placeholder images
- `wechat-qr.png` - Contact QR codes
- `*.csv` - Template files for imports
- `*.html` - Static test pages

## Development Patterns

### Component Patterns
- Compound components for complex UI
- Context providers for global state
- Custom hooks for business logic
- Render props for flexible composition

### API Patterns
- Consistent error handling
- Request/response validation
- Authentication middleware
- Rate limiting and security

### Database Patterns
- Connection pooling
- Transaction management
- Prepared statements
- Error recovery mechanisms