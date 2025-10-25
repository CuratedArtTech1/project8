#!/bin/bash

# Create new organization setup script
# Usage: ./scripts/create-org.sh "Organization Name" "org-slug"

set -e

ORG_NAME="$1"
ORG_SLUG="$2"

if [ -z "$ORG_NAME" ] || [ -z "$ORG_SLUG" ]; then
    echo "Usage: $0 'Organization Name' 'org-slug'"
    echo "Example: $0 'Art Gallery NYC' 'art-gallery-nyc'"
    exit 1
fi

echo "🎨 Creating new organization setup for: $ORG_NAME"
echo "📂 Slug: $ORG_SLUG"

# Create organization directory
ORG_DIR="./organizations/$ORG_SLUG"
mkdir -p "$ORG_DIR"

# Create environment template
cat > "$ORG_DIR/.env.production" << EOF
# $ORG_NAME - Production Configuration
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY-HERE

# Organization Branding
VITE_ORG_NAME="$ORG_NAME"
VITE_ORG_SLUG="$ORG_SLUG"
VITE_ORG_LOGO="/logos/$ORG_SLUG.png"

# Custom Domain (optional)
VITE_CUSTOM_DOMAIN="$ORG_SLUG.artloansystem.com"
EOF

# Create deployment configuration
cat > "$ORG_DIR/vercel.json" << EOF
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url-$ORG_SLUG",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-$ORG_SLUG",
    "VITE_ORG_NAME": "$ORG_NAME",
    "VITE_ORG_SLUG": "$ORG_SLUG"
  },
  "rewrites": [
    {
      "source": "/((?!api/.*).*)",
      "destination": "/index.html"
    }
  ]
}
EOF

# Create organization-specific styling
cat > "$ORG_DIR/custom-styles.css" << EOF
/* Custom styles for $ORG_NAME */
:root {
  --org-primary: #2563eb;
  --org-secondary: #64748b;
  --org-accent: #3b82f6;
}

/* Add organization-specific customizations here */
.org-branding {
  background: var(--org-primary);
}

.org-logo {
  max-height: 60px;
}
EOF

# Create README for the organization
cat > "$ORG_DIR/README.md" << EOF
# $ORG_NAME - Art Loan System

## Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project: \`$ORG_SLUG-art-loans\`
3. Copy the project URL and anon key
4. Update \`.env.production\` with your credentials

### 2. Database Setup
\`\`\`bash
# Run migrations
cd ../../
npm run migrate:org $ORG_SLUG
\`\`\`

### 3. Deploy to Vercel
\`\`\`bash
# Deploy this organization
npm run deploy:org $ORG_SLUG
\`\`\`

### 4. Custom Domain (Optional)
- Add your custom domain in Vercel
- Update DNS settings
- Enable SSL

## Organization Details
- **Name**: $ORG_NAME
- **Slug**: $ORG_SLUG
- **Portal URL**: \`$ORG_SLUG.artloansystem.com\`

## Support
Contact: support@artloansystem.com
EOF

# Create placeholder for logo
mkdir -p "$ORG_DIR/assets"
echo "Place your organization logo here: $ORG_DIR/assets/logo.png" > "$ORG_DIR/assets/LOGO_INSTRUCTIONS.txt"

# Create package.json scripts entry
echo "✅ Organization setup created at: $ORG_DIR"
echo ""
echo "📋 Next Steps:"
echo "1. Create Supabase project for $ORG_NAME"
echo "2. Update $ORG_DIR/.env.production with Supabase credentials"
echo "3. Add organization logo to $ORG_DIR/assets/logo.png"
echo "4. Run: npm run deploy:org $ORG_SLUG"
echo ""
echo "🔗 After deployment, your organization will be available at:"
echo "   https://$ORG_SLUG.artloansystem.com"