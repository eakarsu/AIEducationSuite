#!/bin/bash

# AI Education Suite - Startup Script
# This script handles port cleanup, database setup, seeding, and starting the application

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🎓 AI Education Suite - Startup Script                ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to clean up ports
cleanup_ports() {
    print_status "Cleaning up ports 3000 and 3001..."

    # Kill processes on port 3000 (React)
    if lsof -ti:3000 > /dev/null 2>&1; then
        print_warning "Killing process on port 3000..."
        kill -9 $(lsof -ti:3000) 2>/dev/null || true
    fi

    # Kill processes on port 3001 (Express)
    if lsof -ti:3001 > /dev/null 2>&1; then
        print_warning "Killing process on port 3001..."
        kill -9 $(lsof -ti:3001) 2>/dev/null || true
    fi

    print_success "Ports cleaned up"
}

# Function to check if PostgreSQL is running
check_postgres() {
    print_status "Checking PostgreSQL connection..."

    if command -v pg_isready &> /dev/null; then
        if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
            print_success "PostgreSQL is running"
            return 0
        fi
    fi

    # Try to connect anyway
    if psql -h localhost -U postgres -c '\q' 2>/dev/null; then
        print_success "PostgreSQL is running"
        return 0
    fi

    print_error "PostgreSQL is not running. Please start PostgreSQL first."
    echo ""
    echo "On macOS with Homebrew: brew services start postgresql"
    echo "On Ubuntu: sudo service postgresql start"
    echo "On Docker: docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres"
    exit 1
}

# Function to check and create .env file
check_env() {
    print_status "Checking .env file..."

    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        print_status "Creating default .env file..."
        cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_education_suite
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_education_suite
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=3001
NODE_ENV=development

# OpenRouter AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Demo Login Credentials
DEMO_EMAIL=demo@aieducation.com
DEMO_PASSWORD=demo123456
EOF
        print_warning "Created default .env file. Please update OPENROUTER_API_KEY!"
    else
        print_success ".env file exists"
    fi

    # Check if OpenRouter API key is set
    source .env 2>/dev/null || true
    if [ "$OPENROUTER_API_KEY" == "your_openrouter_api_key_here" ]; then
        print_warning "OPENROUTER_API_KEY is not set! AI features will not work."
        print_warning "Please update your .env file with a valid OpenRouter API key."
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Checking dependencies..."

    # Check if node_modules exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing server dependencies..."
        npm install
    fi

    if [ ! -d "client/node_modules" ]; then
        print_status "Installing client dependencies..."
        cd client && npm install && cd ..
    fi

    print_success "All dependencies installed"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    node server/db/setup.js
    print_success "Database setup complete"
}

# Function to seed database
seed_database() {
    print_status "Seeding database with sample data..."
    node server/seed.js
    print_success "Database seeded with 15+ items per feature"
}

# Function to start the application
start_app() {
    print_status "Starting AI Education Suite..."
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                                                           ║"
    echo "║     🚀 Starting servers with hot-reload enabled          ║"
    echo "║                                                           ║"
    echo "║     Frontend: http://localhost:3000                       ║"
    echo "║     Backend:  http://localhost:3001                       ║"
    echo "║                                                           ║"
    echo "║     Demo Login: demo@aieducation.com / demo123456         ║"
    echo "║                                                           ║"
    echo "║     Press Ctrl+C to stop                                  ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""

    # Start both servers with hot-reload
    npm start
}

# Main execution
main() {
    # Change to script directory
    cd "$(dirname "$0")"

    # Run startup sequence
    cleanup_ports
    check_env
    check_postgres
    install_dependencies
    setup_database
    seed_database
    start_app
}

# Handle script arguments
case "${1:-}" in
    --clean)
        cleanup_ports
        print_success "Ports cleaned"
        ;;
    --setup)
        check_env
        check_postgres
        install_dependencies
        setup_database
        ;;
    --seed)
        check_postgres
        seed_database
        ;;
    --help)
        echo "Usage: ./start.sh [option]"
        echo ""
        echo "Options:"
        echo "  (no option)  Full startup: clean ports, setup DB, seed data, start app"
        echo "  --clean      Only clean up ports 3000 and 3001"
        echo "  --setup      Only setup database and install dependencies"
        echo "  --seed       Only seed the database with sample data"
        echo "  --help       Show this help message"
        ;;
    *)
        main
        ;;
esac
