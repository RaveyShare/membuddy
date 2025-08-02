# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MemBuddy is an AI-powered memory assistant with a dual-version architecture for China and global markets. The system helps users improve memory through mind maps, mnemonics, and sensory associations.

## Development Commands

### Backend (Python/FastAPI)
```bash
cd back
# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload

# Run with specific port
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (Next.js/TypeScript)
```bash
cd front
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

### Database Setup
```bash
# Database scripts are in the scripts/ directory
# Apply SQL migrations using Supabase dashboard or your preferred PostgreSQL client
```

## Architecture Overview

### Dual-Version System
The project implements two separate versions:

**China Version (`REGION=china`)**:
- AI Providers: Qwen (通义千问), ERNIE (文心一言), ZhipuAI, Baichuan
- TTS: Aliyun TTS, Tencent TTS
- Language: Chinese interface
- Deployment: China-based cloud servers

**Global Version (`REGION=global`)**:
- AI Providers: Gemini, OpenAI, Claude
- TTS: Google Cloud TTS, ElevenLabs
- Language: English interface
- Deployment: Global cloud servers

### Backend Structure (FastAPI)
- `main.py`: Main API routes and business logic
- `ai_manager.py`: AI provider abstraction layer
- `ai_providers_china.py`: China-specific AI implementations
- `ai_providers_global.py`: Global AI implementations
- `config.py`: Configuration management using pydantic-settings
- `database.py`: Supabase database connection utilities
- `schemas.py`: Pydantic models for API validation
- `prompt_templates.py`: AI prompt templates for memory aids generation

### Frontend Structure (Next.js)
- `app/`: App Router structure with page components
- `components/`: Reusable UI components (shadcn/ui)
- `lib/`: Utilities and API configuration
- `hooks/`: Custom React hooks

### Key API Endpoints
- `/api/memory_items`: CRUD operations for memory items
- `/api/memory/generate`: AI-powered memory aids generation
- `/api/review_schedules`: Spaced repetition scheduling
- `/api/share`: Share memory aids with others
- `/api/generate/image` & `/api/generate/audio`: Media generation

## Database Schema

The system uses Supabase PostgreSQL with these main tables:
- `memory_items`: User's memory content
- `memory_aids`: Generated memory aids (mind maps, mnemonics, sensory associations)
- `review_schedules`: Spaced repetition scheduling
- `users`: User authentication and profiles
- `shares`: Shared memory aids

## Environment Configuration

### Backend Environment Variables
Copy from template files:
- China: `back/.env.china.example` → `back/.env`
- Global: `back/.env.global.example` → `back/.env`

Key variables:
- `REGION`: "china" or "global"
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_JWT_SECRET`: Database configuration
- `AI_PROVIDER`: Default AI provider for the region
- `TTS_PROVIDER`: Default text-to-speech provider
- Provider-specific API keys (GEMINI_API_KEY, etc.)

### Frontend Configuration
- Vercel deployment configured in `vercel.json`
- Environment variables set through Vercel dashboard

## Development Workflow

1. **Local Development**:
   - Backend: `uvicorn main:app --reload`
   - Frontend: `pnpm dev`
   - Database: Use Supabase local development or cloud instance

2. **Code Style**:
   - Backend: Python with type hints, FastAPI patterns
   - Frontend: TypeScript with strict mode, Tailwind CSS

3. **Testing**:
   - No formal test suite currently
   - Manual testing through API endpoints and frontend UI

## Deployment

### Production Deployment
- Frontend: Vercel (automatic deployment from main branch)
- Backend: Alibaba Cloud ECS with Docker
- Database: Supabase cloud
- Proxy: Nginx on Claw Cloud Run (for Gemini API proxy)

### Deployment Scripts
- `deploy-china.sh`: China version deployment
- `deploy-global.sh`: Global version deployment
- `setup-local-dev.sh`: Local development environment setup

## Important Notes

- The system uses JWT tokens for authentication with Supabase
- AI providers are abstracted through the AIManager class
- Memory aids are generated concurrently and stored as JSON in the database
- The frontend uses shadcn/ui components with Tailwind CSS
- CORS is configured to work with multiple Vercel deployment URLs