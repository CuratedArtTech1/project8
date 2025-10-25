#!/bin/bash

# Deploy organization to Vercel
# Usage: ./scripts/deploy-org.sh "org-slug"

set -e

ORG_SLUG="$1"

if [ -z "$ORG_SLUG" ]; then
    echo "Usage: $0 'org-slug'"
    echo "Example: $0 'art-gallery-nyc'"
    exit 1
fi

ORG_DIR="./organizations/$ORG_SLUG"

if [ ! -d "$ORG_DIR" ]; then
    echo "❌ Organization directory not found: $ORG_DIR"
    echo "Run: npm run create:org 'Organization Name' '$ORG_SLUG' first"
    exit 1
fi

echo "🚀 Deploying $ORG_SLUG to Vercel..."

# Copy organization-specific files to build directory
echo "📦 Preparing build with organization config..."

# Copy environment variables
cp "$ORG_DIR/.env.production" ".env.production"

# Copy custom styles if they exist
if [ -f "$ORG_DIR/custom-styles.css" ]; then
    cp "$ORG_DIR/custom-styles.css" "src/styles/org-custom.css"
fi

# Copy logo if it exists
if [ -f "$ORG_DIR/assets/logo.png" ]; then
    cp "$ORG_DIR/assets/logo.png" "public/logo-org.png"
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to Vercel with organization-specific project name
echo "☁️ Deploying to Vercel..."
npx vercel --prod --name "artloan-$ORG_SLUG"

echo "✅ Deployment complete!"
echo "🌐 Your organization portal is available at:"
echo "   https://artloan-$ORG_SLUG.vercel.app"
echo ""
echo "🔧 To set up custom domain ($ORG_SLUG.artloansystem.com):"
echo "   1. Go to Vercel dashboard"
echo "   2. Add custom domain"
echo "   3. Update DNS records"