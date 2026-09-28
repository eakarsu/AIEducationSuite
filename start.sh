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

BACKEND_PORT="${BACKEND_PORT:-${PORT:-3001}}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"

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
    print_status "Checking ports $FRONTEND_PORT and $BACKEND_PORT..."
    for port in "$FRONTEND_PORT" "$BACKEND_PORT"; do
        if lsof -tiTCP:"$port" -sTCP:LISTEN > /dev/null 2>&1; then
            print_error "Port $port is occupied; refusing to terminate another process."
            exit 1
        fi
    done
    print_success "Ports are available"
}

# Function to check if PostgreSQL is running
check_postgres() {
    print_status "Checking PostgreSQL connection..."

    if command -v pg_isready &> /dev/null; then
        if pg_isready -h "${DB_HOST:-127.0.0.1}" -p "${DB_PORT:-5432}" > /dev/null 2>&1; then
            print_success "PostgreSQL is running"
            return 0
        fi
    fi

    # Try to connect anyway
    if psql -h "${DB_HOST:-127.0.0.1}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d postgres -c '\q' 2>/dev/null; then
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
        print_error ".env file not found; copy the documented example and provide test-safe values before startup."
        exit 1
    fi
    print_success ".env file exists"

    # Check if OpenRouter API key is set
    if [ "${SKIP_PROJECT_ENV:-false}" != "true" ]; then
        set -a
        source .env
        set +a
    fi
    if [ "${OPENROUTER_API_KEY:-}" == "your_openrouter_api_key_here" ]; then
        print_warning "OPENROUTER_API_KEY is not set! AI features will not work."
        print_warning "Please update your .env file with a valid OpenRouter API key."
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Checking dependencies..."

    # Check if node_modules exist
    if [ ! -d "node_modules" ]; then
        print_error "Server dependencies are missing; run the documented bootstrap step first."
        exit 1
    fi

    if [ ! -d "client/node_modules" ]; then
        print_error "Client dependencies are missing; run the documented bootstrap step first."
        exit 1
    fi

    print_success "All dependencies installed"
}

# Function to setup database
setup_database() {
    print_status "Checking database..."
    if ! psql -h "${DB_HOST:-127.0.0.1}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME:-ai_education_suite}'" | grep -q 1; then
        print_error "Database ${DB_NAME:-ai_education_suite} does not exist; provision an isolated database before startup."
        exit 1
    fi
    print_success "Database is available"
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
    echo "║     Press Ctrl+C to stop                                  ║"
    echo "║                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""

    BACKEND_HOST="$BACKEND_HOST" PORT="$BACKEND_PORT" node server/index.js &
    BACKEND_PID=$!
    (cd client && exec env BROWSER=none DANGEROUSLY_DISABLE_HOST_CHECK=true HOST="$FRONTEND_HOST" PORT="$FRONTEND_PORT" ./node_modules/.bin/react-scripts start) &
    FRONTEND_PID=$!

    cleanup_children() {
        kill -TERM "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
        wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
    }
    trap cleanup_children EXIT INT TERM
    wait
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
    if [ "${ALLOW_DEMO_SEED:-false}" = "true" ]; then
        seed_database
    fi
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
        echo "  (no option)  Validate configuration/dependencies/database and start app"
        echo "  --clean      Verify ports 3000 and 3001 are available"
        echo "  --setup      Verify database and dependencies"
        echo "  --seed       Only seed the database with sample data"
        echo "  --help       Show this help message"
        ;;
    *)
        main
        ;;
esac
