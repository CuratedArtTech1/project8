# Multi-Tenant CCG Art Loan System Setup Guide

## Overview
Convert the single-tenant system into a multi-tenant SaaS where each organization has isolated data and their own portal.

## Architecture Options

### Option 1: Database-Level Isolation (Recommended)
Each organization gets their own Supabase database instance.

**Pros:**
- Complete data isolation
- Easy to manage per-organization
- Can customize features per client
- Simple backup/restore per org

**Setup Steps:**
1. Create separate Supabase projects for each organization
2. Deploy the same codebase with different environment variables
3. Use organization-specific subdomains (org1.artloans.com, org2.artloans.com)

### Option 2: Row-Level Security (RLS) Multi-Tenancy
Single database with organization_id field on all tables.

**Pros:**
- Single database to manage
- Cost-effective for many small organizations
- Shared infrastructure

**Setup Steps:**
1. Add `organization_id` to all tables
2. Update RLS policies to filter by organization
3. Add organization selection during signup

### Option 3: Separate Deployments
Deploy the entire stack separately for each organization.

**Pros:**
- Complete isolation (code + data)
- Unlimited customization per org
- Independent scaling

## Implementation Details

### For Option 1 (Recommended):

#### 1. Environment Configuration
```bash
# Organization A
VITE_SUPABASE_URL=https://org-a-project.supabase.co
VITE_SUPABASE_ANON_KEY=org-a-anon-key
VITE_ORG_NAME="Organization A"
VITE_ORG_LOGO="/logos/org-a.png"

# Organization B  
VITE_SUPABASE_URL=https://org-b-project.supabase.co
VITE_SUPABASE_ANON_KEY=org-b-anon-key
VITE_ORG_NAME="Organization B"
VITE_ORG_LOGO="/logos/org-b.png"
```

#### 2. Deployment Structure
```
artloans-system/
├── shared-codebase/          # Main application code
├── org-configs/              # Organization-specific configs
│   ├── org-a/
│   │   ├── .env.production
│   │   ├── logo.png
│   │   └── custom-styles.css
│   └── org-b/
│       ├── .env.production
│       ├── logo.png
│       └── custom-styles.css
└── deploy-scripts/           # Automated deployment
```

#### 3. Supabase Setup Per Organization
- Create new Supabase project for each org
- Run the same migrations on each database
- Set up the same Edge Functions
- Configure organization-specific RLS policies

#### 4. Domain Setup
- org-a.artloansystem.com → Vercel deployment with Org A config
- org-b.artloansystem.com → Vercel deployment with Org B config
- Each uses their own Supabase backend

## Quick Start Commands

### 1. Clone the system for a new organization:
```bash
# Create new organization setup
npm run create-org "New Organization Name"

# This would:
# - Create new Supabase project
# - Generate environment config
# - Set up deployment pipeline
# - Create organization-specific branding
```

### 2. Deploy new organization:
```bash
# Deploy to Vercel with org-specific config
npm run deploy-org "org-name"
```

## Cost Considerations

### Option 1 (Separate Databases):
- Supabase: $25/month per organization (Pro plan)
- Vercel: Free tier covers most deployments
- Domain: ~$12/year per subdomain

### Option 2 (Single Database):
- Supabase: $25/month total (can handle many orgs)
- Vercel: Single deployment
- More complex to manage data isolation

## Security Benefits
- Complete data isolation between organizations
- No risk of data leaks between clients
- Individual backup/restore capabilities
- Organization-specific access controls
- Compliance-friendly (SOC2, GDPR per org)

## Next Steps
1. Choose architecture approach
2. Set up first pilot organization
3. Create deployment automation
4. Document organization onboarding process