# Technology Stack & Build System

## Core Technologies

### Frontend Stack
- **Framework**: Next.js 15.2.4 with App Router
- **React**: Version 19 with modern hooks and concurrent features
- **TypeScript**: Strict type checking enabled
- **Styling**: Tailwind CSS 3.4.17 with custom design system
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React Context + hooks pattern
- **Forms**: React Hook Form with Zod validation
- **Theme**: next-themes for dark/light mode support

### Backend & Database
- **Database**: MySQL 8.0 with connection pooling
- **ORM**: Raw SQL with mysql2 driver (no ORM)
- **Authentication**: JWT tokens with bcryptjs hashing
- **Email**: Nodemailer with SMTP support
- **File Storage**: Aliyun OSS for image/file uploads
- **API Integration**: Coze AI for content generation

### Key Dependencies
```json
{
  "next": "15.2.4",
  "react": "^19",
  "mysql2": "^3.6.5",
  "jsonwebtoken": "^9.0.2",
  "ali-oss": "^6.23.0",
  "tailwindcss": "^3.4.17",
  "typescript": "^5"
}
```

## Build System & Commands

### Development
```bash
# Start development server
npm run dev
# or
pnpm dev

# Runs on http://localhost:3000
```

### Production Build
```bash
# Build for production
npm run build
# or
pnpm build

# Start production server
npm run start
# or
pnpm start
```

### Code Quality
```bash
# Run ESLint
npm run lint
# or
pnpm lint
```

### Database Operations
```bash
# Run database migrations (manual)
mysql -u username -p database_name < mysql_migrations/001_create_database_schema.sql

# Database scripts in /scripts directory
node scripts/migrate-database.js
node scripts/import-csv.js
```

## Configuration

### Environment Variables Required
```bash
# Database
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=xhs_create_v3
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# Authentication
JWT_SECRET=your-32-char-secret

# Email Service
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-email-password

# AI Services
COZE_API_TOKEN=your-coze-token
COZE_WORKFLOW_ID=your-workflow-id
ARK_API_KEY=your-ark-key
ARK_API_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions

# File Storage (Optional)
ALIYUN_OSS_ACCESS_KEY_ID=your-access-key
ALIYUN_OSS_ACCESS_KEY_SECRET=your-secret-key
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_BUCKET=your-bucket-name
```

## Architecture Patterns

### Database Layer
- Connection pooling with retry mechanisms
- Stored procedures for complex operations
- Raw SQL queries (no ORM)
- Transaction management for critical operations

### API Design
- RESTful API routes in `/app/api`
- Consistent error handling and response formats
- JWT middleware for protected routes
- Request validation with Zod schemas

### Component Architecture
- Compound component patterns
- Context providers for global state
- Custom hooks for business logic
- Radix UI for accessible primitives

### Performance Optimizations
- Connection pool warming
- Component memoization
- Image optimization with Next.js
- CSS-in-JS with Tailwind compilation