# Math Dashboard

## Overview

Math Dashboard is a full-stack analytics platform for ingesting, analyzing, and visualizing math questions and student attempts from a mobile education app. The system provides administrators with insights into question quality, student performance, and AI-powered evaluation of educational content targeting elementary school students (grades 1-5).

Key capabilities:
- Question management with AI-powered classification (topic, difficulty, quality score)
- Student attempt tracking with performance metrics
- User feedback collection and aggregation
- Sync endpoint for batch data ingestion from mobile apps
- Interactive dashboards with charts (ECharts)
- AI evaluation and question suggestion features using OpenAI

## Recent Changes (December 2024)

- Complete UI redesign with modern aesthetics and soft gradients
- Mobile-first responsive design with hamburger menu navigation
- Accessibility improvements: ARIA attributes, focus management, keyboard navigation (Escape key)
- Fixed server-side rendering bugs (replaced toLocaleString with Intl.DateTimeFormat)
- Feedback form now allows general feedback without selecting a question
- Updated color scheme with orange accents and glass morphism effects
- Added guided onboarding tour using react-joyride (desktop only, auto-starts on first visit)
- Added floating help button to restart the tour anytime
- Tour is now page-specific: each page (Questions, Feedback, Avaliação IA, Histórico) has seu próprio tour
- Added sync history feature: /historico page displays all sync operations with status, counts, timestamps, and error details
- New SyncLog model tracks every sync request (success/error) for debugging and audit purposes

## User Preferences

Preferred communication style: Simple, everyday language (Portuguese).

## System Architecture

### Frontend Architecture
- **Framework**: Next.js 14 with App Router
- **Rendering**: Server-side rendering with React Server Components where appropriate
- **Styling**: Tailwind CSS with custom utility classes (glass, card, gradient utilities)
- **Charts**: ECharts via echarts-for-react (dynamically imported to avoid SSR issues)
- **State Management**: React hooks with local state; no global state library
- **Notifications**: react-hot-toast for user feedback
- **Mobile Navigation**: Custom MobileNav component with accessible drawer menu
- **Responsive Design**: Mobile-first approach with breakpoints at md (768px)

### Backend Architecture
- **API Routes**: Next.js App Router API routes under `/app/api/`
- **Authentication**: NextAuth.js with Credentials provider and JWT session strategy
- **Route Protection**: Middleware-based authentication for protected routes
- **Validation**: Zod schemas for all API input validation (`lib/zodSchemas.ts`)
- **AI Integration**: OpenAI API for question classification and evaluation

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Prisma with migrations and seeding
- **Models**: User, Question, SolutionStep, Attempt, Feedback, SyncLog
- **Sync Support**: `externalId` fields for upsert operations from mobile app

### Authentication Flow
- Credentials-based login (email/password)
- Passwords hashed with bcryptjs
- JWT tokens for session management
- Protected routes defined in middleware.ts matcher

### Key Design Patterns
- **API Design**: RESTful endpoints with consistent error handling
- **Logging**: Structured JSON logging via `lib/logger.ts`
- **Separation of Concerns**: Prisma client singleton, auth config, and Zod schemas in `/lib`
- **Component Organization**: Reusable UI components in `/components`, page-specific components colocated

## External Dependencies

### Database
- **PostgreSQL**: Primary data store (configured via `DATABASE_URL` environment variable)
- **Prisma**: ORM for database access, migrations, and seeding

### Authentication
- **NextAuth.js**: Authentication framework with Prisma adapter support
- **bcryptjs**: Password hashing

### AI Services
- **OpenAI API**: Used for question classification (`lib/aiClassify.ts`) and evaluation (`/api/evaluate/`)
  - Model: gpt-4o-mini
  - Requires `OPENAI_API_KEY` environment variable

### Frontend Libraries
- **ECharts**: Data visualization (bar charts, pie charts, score distributions)
- **react-hot-toast**: Toast notifications
- **dayjs**: Date formatting
- **clsx**: Conditional CSS class composition

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for JWT signing
- `NEXTAUTH_URL`: Base URL for NextAuth
- `OPENAI_API_KEY`: OpenAI API key (optional, enables AI features)
- `SYNC_API_KEY`: Optional API key for sync endpoint authentication