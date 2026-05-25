#!/bin/bash
# AI Code Review Assistant - Setup Script

set -e

echo "🚀 Setting up AI Code Review Assistant..."

# Check for required tools
echo "📋 Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required but not installed."; exit 1; }

echo "✅ Prerequisites met."

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env from .env.example..."
  cp .env.example .env
  echo "⚠️  Please update .env with your actual configuration values."
else
  echo "✅ .env already exists."
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️  Setting up database..."
npx prisma db push

# Seed the database
echo "🌱 Seeding database with demo data..."
curl -s -X POST http://localhost:3000/api/seed || echo "⚠️  Could not seed database (is the dev server running?)"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "Then visit http://localhost:3000"
