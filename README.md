# AI Education Suite

A comprehensive AI-powered education platform featuring essay grading, music lessons, quiz generation, reading analysis, and personalized learning paths.

## Features

- **AI Essay Grader** - Submit essays for AI-powered grading and detailed feedback
- **AI Music Teacher** - Generate personalized music lessons for any instrument
- **AI Quiz Maker** - Create custom quizzes from any content
- **AI Reading Level Analyzer** - Analyze text complexity and get recommendations
- **AI Learning Path Creator** - Build personalized learning curricula

## Quick Start

```bash
# Make start script executable (first time only)
chmod +x start.sh

# Start the application
./start.sh
```

The start script will:
1. Clean up ports 3000 and 3001
2. Check PostgreSQL connection
3. Install dependencies
4. Setup the database
5. Seed with 15+ items per feature
6. Start the application with hot-reload

## Prerequisites

- Node.js 16+
- PostgreSQL
- OpenRouter API key

## Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_education_suite
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=3001
NODE_ENV=development

# OpenRouter AI Configuration
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5

# JWT Configuration
JWT_SECRET=your_secret_key

# Demo Credentials
DEMO_EMAIL=demo@aieducation.com
DEMO_PASSWORD=demo123456
```

## Demo Login

Click "Fill Demo Credentials" on the login page to auto-fill:
- Email: demo@aieducation.com
- Password: demo123456

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/demo-credentials` - Get demo credentials

### Essays
- `GET /api/essays` - List all essays
- `POST /api/essays` - Create and grade essay
- `PUT /api/essays/:id` - Update essay
- `DELETE /api/essays/:id` - Delete essay
- `POST /api/essays/:id/regrade` - Regrade essay

### Music Lessons
- `GET /api/music` - List all lessons
- `POST /api/music` - Generate lesson
- `PUT /api/music/:id` - Update lesson
- `DELETE /api/music/:id` - Delete lesson
- `POST /api/music/:id/regenerate` - Regenerate lesson

### Quizzes
- `GET /api/quizzes` - List all quizzes
- `POST /api/quizzes` - Generate quiz
- `PUT /api/quizzes/:id` - Update quiz
- `DELETE /api/quizzes/:id` - Delete quiz
- `POST /api/quizzes/:id/regenerate` - Regenerate quiz

### Reading Analysis
- `GET /api/reading` - List all analyses
- `POST /api/reading` - Analyze text
- `PUT /api/reading/:id` - Update analysis
- `DELETE /api/reading/:id` - Delete analysis
- `POST /api/reading/:id/reanalyze` - Reanalyze text

### Learning Paths
- `GET /api/learning` - List all paths
- `POST /api/learning` - Create path
- `PUT /api/learning/:id` - Update path
- `DELETE /api/learning/:id` - Delete path
- `POST /api/learning/:id/regenerate` - Regenerate path

## Tech Stack

- **Frontend**: React, React Router, React Icons
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **AI**: OpenRouter (Claude Haiku 4.5)
- **Authentication**: JWT

## Development

```bash
# Install dependencies
npm run install:all

# Start development servers
npm start

# Server only
npm run server

# Client only
npm run client
```

## License

MIT
