# GitHub Secrets Configuration Guide

This guide explains how to configure GitHub repository secrets for CI/CD deployment.

## Required Secrets

To enable automated deployment, you need to configure these secrets in your GitHub repository:

### 1. Supabase Configuration
- **`VITE_SUPABASE_URL`**: Your Supabase project URL
  - Example: `https://xxxxxxxxxxxxx.supabase.co`
  - Find it: Supabase Dashboard → Settings → API → Project URL

- **`VITE_SUPABASE_ANON_KEY`**: Your Supabase anonymous/public key
  - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - Find it: Supabase Dashboard → Settings → API → Project API keys → anon public

### 2. Vercel Deployment (Optional)
- **`VERCEL_TOKEN`**: Your Vercel authentication token
  - Get it: https://vercel.com/account/tokens
  - Click "Create Token"

- **`VERCEL_ORG_ID`**: Your Vercel organization/team ID
  - Get it: Vercel Dashboard → Settings → General → Team ID
  - Or run: `npx vercel link` and check `.vercel/project.json`

- **`VERCEL_PROJECT_ID`**: Your Vercel project ID
  - Get it: After running `npx vercel link`, check `.vercel/project.json`
  - Or: Vercel Dashboard → Project Settings → General → Project ID

### 3. Uptime Monitoring (Optional)
- **`UPTIME_MONITOR_URL`**: URL of your deployed production site
  - Example: `https://your-app.vercel.app`
  - Set this after initial deployment

## How to Add Secrets to GitHub

1. Go to your GitHub repository: `https://github.com/CuratedArtTech1/project8`

2. Click **Settings** (top navigation)

3. In the left sidebar, click **Secrets and variables** → **Actions**

4. Click **New repository secret**

5. For each secret:
   - Enter the **Name** (exactly as shown above)
   - Enter the **Value** (the actual key/token/URL)
   - Click **Add secret**

6. Repeat for all required secrets

## Verifying Configuration

After adding secrets:

1. Go to **Actions** tab in your GitHub repository

2. You should see workflows ready to run:
   - `Deploy to Vercel` - Runs on push to main branch
   - `Uptime Monitor` - Runs every 10 minutes (if URL configured)

3. Make a commit to the `main` branch to trigger deployment

4. Check the Actions tab to see workflow progress

## Testing Deployment Locally

Before committing, you can test locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project (creates .vercel/project.json)
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Troubleshooting

### Workflow not running?
- Check that secrets are named exactly as shown (case-sensitive)
- Verify secrets have values (not empty)
- Check workflow file branch triggers match your branch name

### Deployment failing?
- Check Actions logs for specific error messages
- Verify Supabase credentials are correct
- Ensure Vercel tokens have necessary permissions

### Build errors?
- Run `npm run build` locally first
- Check for any TypeScript or linting errors
- Review error logs in GitHub Actions

## Security Notes

- **Never commit secrets** to your repository
- Secrets are encrypted by GitHub
- Only repository collaborators with write access can view/edit secrets
- Rotate tokens periodically for security
- Use different credentials for development and production

## Quick Setup Checklist

- [ ] Created Supabase project
- [ ] Copied Supabase URL and anon key
- [ ] Added `VITE_SUPABASE_URL` secret to GitHub
- [ ] Added `VITE_SUPABASE_ANON_KEY` secret to GitHub
- [ ] (Optional) Created Vercel account and project
- [ ] (Optional) Added Vercel secrets to GitHub
- [ ] (Optional) Added `UPTIME_MONITOR_URL` secret
- [ ] Tested deployment by pushing to main branch
- [ ] Verified app is accessible at deployed URL

---

For more information:
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
