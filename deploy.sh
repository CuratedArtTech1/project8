#!/bin/bash

# Quick deployment script for CCG Art Loan System
# Usage: ./deploy.sh [platform]

set -e

echo "🚀 CCG Art Loan System Deployment Script"
echo "==========================================="

# Check if build passes
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed! Fix errors and try again."
  exit 1
fi

echo "✅ Build successful!"

# Detect or use provided platform
PLATFORM=${1:-"auto"}

if [ "$PLATFORM" = "auto" ]; then
  echo "🔍 Detecting deployment platform..."
  
  if command -v netlify &> /dev/null; then
    PLATFORM="netlify"
  elif command -v vercel &> /dev/null; then
    PLATFORM="vercel"  
  elif command -v railway &> /dev/null; then
    PLATFORM="railway"
  elif command -v docker &> /dev/null; then
    PLATFORM="docker"
  else
    echo "📋 No deployment CLI detected. Available options:"
    echo "   ./deploy.sh netlify"
    echo "   ./deploy.sh vercel" 
    echo "   ./deploy.sh railway"
    echo "   ./deploy.sh docker"
    exit 1
  fi
fi

echo "🎯 Deploying to: $PLATFORM"

case $PLATFORM in
  "netlify")
    echo "🌐 Deploying to Netlify..."
    if ! command -v netlify &> /dev/null; then
      echo "Installing Netlify CLI..."
      npm install -g netlify-cli
    fi
    netlify deploy --prod --dir=dist
    ;;
    
  "vercel")
    echo "▲ Deploying to Vercel..."
    if ! command -v vercel &> /dev/null; then
      echo "Installing Vercel CLI..."
      npm install -g vercel
    fi
    vercel --prod
    ;;
    
  "railway")
    echo "🚄 Deploying to Railway..."
    if ! command -v railway &> /dev/null; then
      echo "Installing Railway CLI..."
      npm install -g @railway/cli
    fi
    railway up
    ;;
    
  "docker")
    echo "🐳 Building Docker image..."
    docker build -t ccg-art-loan-system .
    echo "🏃 Starting container on port 8080..."
    docker run -d -p 8080:80 --name ccg-art-loan ccg-art-loan-system
    echo "✅ Container started! Visit http://localhost:8080"
    ;;
    
  *)
    echo "❌ Unknown platform: $PLATFORM"
    echo "Supported: netlify, vercel, railway, docker"
    exit 1
    ;;
esac

echo ""
echo "🎉 Deployment initiated!"
echo "💡 Don't forget to set environment variables on your platform:"
echo "   VITE_SUPABASE_URL=your-supabase-url"
echo "   VITE_SUPABASE_ANON_KEY=your-anon-key"