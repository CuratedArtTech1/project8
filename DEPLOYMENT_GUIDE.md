# Deployment Guide - Curated Capital Group Art Loan System

## Quick Export Options

### Option 1: Download Project as ZIP (Easiest)

If you're in a web-based environment:
1. Navigate to your project folder
2. Right-click the project root folder
3. Select "Download" or "Export as ZIP"
4. Extract the ZIP on your local machine

### Option 2: Git Repository Export

```bash
# In the project directory
cd /tmp/cc-agent/58280331/project

# Initialize git (if not already)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - CCG Art Loan System"

# Push to your repository (GitHub, GitLab, etc.)
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

### Option 3: Manual File Copy

Copy the entire project folder to your desired location:
```bash
cp -r /tmp/cc-agent/58280331/project /path/to/your/destination
```

---

## Deployment Options

### 🚀 Option A: Deploy to Netlify (Recommended - Free Tier)

**Steps:**

1. **Create Netlify Account**
   - Go to https://netlify.com
   - Sign up (free tier available)

2. **Deploy via Drag & Drop**
   - Build your project: `npm run build`
   - Drag the `dist/` folder to Netlify's deploy zone
   - Done! Your site is live

3. **Deploy via Git (Better for updates)**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login to Netlify
   netlify login

   # Initialize and deploy
   netlify init
   netlify deploy --prod
   ```

4. **Configure Environment Variables in Netlify**
   - Go to Site Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

5. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18 or higher

---

### 🌐 Option B: Deploy to Vercel (Also Free Tier)

**Steps:**

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub/GitLab/Bitbucket

2. **Deploy via CLI**
   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Login
   vercel login

   # Deploy
   vercel

   # Deploy to production
   vercel --prod
   ```

3. **Deploy via Git Integration**
   - Push your code to GitHub/GitLab
   - Import project in Vercel dashboard
   - Vercel auto-detects Vite configuration

4. **Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

---

### 🐳 Option C: Deploy with Docker

**Create `Dockerfile`:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Create `nginx.conf`:**
```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Build and run:**
```bash
# Build Docker image
docker build -t ccg-art-loan-system .

# Run container
docker run -p 8080:80 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  ccg-art-loan-system
```

---

### 💻 Option D: Self-Hosted on VPS (DigitalOcean, AWS, etc.)

**Steps:**

1. **Set up server** (Ubuntu 22.04 example)
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install nginx
   sudo apt install -y nginx
   ```

2. **Upload your project**
   ```bash
   # On your local machine
   scp -r /tmp/cc-agent/58280331/project user@your-server-ip:/var/www/

   # Or use git
   ssh user@your-server-ip
   cd /var/www
   git clone YOUR_REPOSITORY_URL project
   ```

3. **Build and configure**
   ```bash
   cd /var/www/project

   # Create .env file
   cat > .env << EOF
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   EOF

   # Install dependencies and build
   npm install
   npm run build
   ```

4. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/ccg-art-loan
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       root /var/www/project/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|pdf)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/ccg-art-loan /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **Add SSL with Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Pre-Deployment Checklist

### ✅ Required Files Check
```bash
# Verify all files are present
ls -la

# Key files should include:
# - package.json
# - package-lock.json
# - vite.config.ts
# - tsconfig.json
# - index.html
# - src/ directory
# - dist/ (after build)
```

### ✅ Environment Variables

Create `.env` file (for local testing):
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxx
```

**⚠️ NEVER commit `.env` to git!** It's already in `.gitignore`.

### ✅ Supabase Setup

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note your project URL and anon key

2. **Run Migrations**
   ```bash
   # If using Supabase CLI
   supabase db push

   # Or manually run SQL files from supabase/migrations/
   ```

3. **Set up Storage Buckets** (if using file uploads)
   - Create `documents` bucket
   - Set appropriate RLS policies

4. **Create Initial Admin User**
   - Go to Supabase Dashboard → Authentication → Users
   - Add user manually, or use signup in app

---

## Build Verification

Before deploying, always test the build:

```bash
# Clean previous build
rm -rf dist/

# Build production version
npm run build

# Test locally
npm run preview

# Open browser to http://localhost:4173
```

**Common Build Issues:**

1. **TypeScript Errors**
   ```bash
   npm run typecheck
   # Fix any errors shown
   ```

2. **Missing Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables Not Found**
   - Ensure `.env` exists locally
   - For production, set in hosting platform

---

## Post-Deployment

### Testing Checklist

- [ ] Can access login page
- [ ] Can create account
- [ ] Can sign in
- [ ] Dashboard loads with data
- [ ] Can create borrower
- [ ] Can create artwork
- [ ] Loan builder functions
- [ ] PDFs generate correctly
- [ ] All calculations are accurate

### Monitoring

1. **Check Browser Console** for errors
2. **Monitor Supabase Dashboard** for:
   - Database queries
   - Auth attempts
   - Error logs
3. **Set up Alerts** (optional):
   - Uptime monitoring (UptimeRobot, Pingdom)
   - Error tracking (Sentry)

---

## Updating After Deployment

### For Netlify/Vercel (Git-based):
```bash
# Make changes
git add .
git commit -m "Your changes"
git push

# Auto-deploys on push
```

### For Manual Deployments:
```bash
# Pull latest changes
git pull

# Rebuild
npm install
npm run build

# Restart web server
sudo systemctl restart nginx
```

---

## Backup Strategy

### Database Backups (Supabase)
- Supabase Pro: Daily automatic backups
- Free tier: Manual exports via Dashboard → Database → Backups

### Code Backups
- Use Git (GitHub/GitLab)
- Tag releases: `git tag v1.0.0`

### Document Storage
- If using Supabase Storage, enable backups
- Consider external backup to S3/Google Cloud

---

## Cost Estimates

### Free Tier Deployment:
- **Netlify/Vercel**: Free (with limits)
- **Supabase**: Free tier (500MB DB, 1GB bandwidth/day)
- **Total**: $0/month

### Paid Deployment:
- **Netlify Pro**: $19/month
- **Supabase Pro**: $25/month
- **Custom Domain**: $12/year
- **Total**: ~$45-50/month

### Self-Hosted VPS:
- **DigitalOcean Droplet**: $6-12/month
- **Supabase**: $25/month (or self-host)
- **Total**: $30-40/month

---

## Security Recommendations

1. **Use HTTPS** (SSL/TLS) - Let's Encrypt is free
2. **Set up CORS** properly in Supabase
3. **Enable RLS** on all database tables (already done)
4. **Regular Updates**:
   ```bash
   npm audit
   npm update
   ```
5. **Monitor Access Logs**
6. **Use Strong Passwords** for admin accounts
7. **Enable 2FA** on hosting accounts

---

## Support & Troubleshooting

### Common Issues:

**1. "Missing environment variables"**
- Check .env file exists
- Verify variable names match exactly
- For hosting: add in platform settings

**2. "Blank page after deployment"**
- Check browser console for errors
- Verify build completed successfully
- Check redirect rules (needs SPA fallback)

**3. "Database connection failed"**
- Verify Supabase URL and key
- Check RLS policies allow access
- Ensure user is authenticated

**4. "PDFs not generating"**
- Check browser console for jsPDF errors
- Verify all required data is present
- Test in incognito mode

### Getting Help:

- Check CODE_REVIEW_PACKAGE.md for architecture
- Review Supabase logs for database issues
- Check hosting platform logs for deployment issues

---

## Quick Start Commands

```bash
# Local development
npm install
npm run dev

# Production build
npm run build
npm run preview

# Deploy to Netlify
netlify deploy --prod

# Deploy to Vercel
vercel --prod
```

---

**Document Version**: 1.0
**Last Updated**: October 2025
**System**: CCG Art Loan Management System
