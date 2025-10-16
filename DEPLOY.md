# Platform-Specific Deployment Guide
# CCG Art Loan System

## 🚀 Quick Deploy Commands

### Netlify
```bash
# Option 1: CLI Deploy
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod

# Option 2: Drag & Drop
npm run build
# Then drag ./dist folder to https://app.netlify.com/drop
```

### Vercel
```bash
# Option 1: CLI Deploy  
npm install -g vercel
vercel login
vercel --prod

# Option 2: Git Integration
# Push to GitHub, then import in Vercel dashboard
```

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway link
railway up
```

### Docker
```bash
# Build and run locally
docker build -t ccg-art-loan .
docker run -p 8080:80 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  ccg-art-loan

# Or use docker-compose
docker-compose up -d
```

---

## 📋 Environment Variables (Required for all platforms)

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🎯 Platform-Specific Instructions

### 1. **Netlify** (Free tier: 100GB bandwidth)
- ✅ Auto-configured with `netlify.toml`
- ✅ SPA routing included
- ✅ Security headers set
- ✅ Asset caching optimized

**Deploy Steps:**
1. Connect GitHub repo at https://app.netlify.com
2. Set environment variables in Site Settings
3. Deploy automatically on git push

### 2. **Vercel** (Free tier: 100GB bandwidth)
- ✅ Auto-configured with `vercel.json`
- ✅ Vite framework detection
- ✅ Edge functions ready
- ✅ Global CDN included

**Deploy Steps:**
1. Import GitHub repo at https://vercel.com
2. Add environment variables in Project Settings
3. Deploy automatically on git push

### 3. **Railway** (Free tier: $5 credit)
- ✅ Dockerfile included
- ✅ Auto-deployment from GitHub
- ✅ Custom domains included

**Deploy Steps:**
1. Connect GitHub at https://railway.app
2. Select this repository
3. Add environment variables
4. Deploy automatically

### 4. **DigitalOcean App Platform** ($5-12/month)
- ✅ Dockerfile included
- ✅ Auto-scaling available
- ✅ Integrated monitoring

**Deploy Steps:**
1. Create app at https://cloud.digitalocean.com/apps
2. Connect GitHub repository
3. Configure environment variables
4. Deploy with automatic HTTPS

### 5. **AWS Amplify** ($1-15/month)
- ✅ Built-in CI/CD
- ✅ Custom domain + SSL
- ✅ Global CDN

**Deploy Steps:**
1. Connect GitHub at https://console.aws.amazon.com/amplify
2. Configure build settings (auto-detected)
3. Add environment variables
4. Deploy with monitoring

### 6. **Cloudflare Pages** (Free tier: Unlimited bandwidth)
- ✅ Global CDN included
- ✅ Custom domains
- ✅ Web analytics

**Deploy Steps:**
1. Connect GitHub at https://pages.cloudflare.com
2. Build settings: `npm run build`, output: `dist`
3. Add environment variables
4. Deploy with edge functions

---

## 🐳 Self-Hosted Options

### Docker (Any VPS)
```bash
# Clone and deploy
git clone YOUR_REPO_URL
cd ccg-art-loan-system
cp .env.example .env
# Edit .env with your Supabase credentials
docker-compose up -d
```

### Traditional VPS (Ubuntu/CentOS)
```bash
# Install dependencies
sudo apt update && sudo apt install -y nodejs npm nginx

# Deploy application
git clone YOUR_REPO_URL
cd ccg-art-loan-system
npm install
npm run build

# Configure nginx
sudo cp nginx.conf /etc/nginx/sites-available/ccg-art-loan
sudo ln -s /etc/nginx/sites-available/ccg-art-loan /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| **Netlify** | 100GB/mo | $19/mo | Simple deployments |
| **Vercel** | 100GB/mo | $20/mo | React apps |
| **Railway** | $5 credit | $5/mo+ | Full-stack apps |
| **Cloudflare** | Unlimited | $20/mo | Global performance |
| **DigitalOcean** | None | $5-12/mo | Custom control |
| **AWS Amplify** | Limited | $1-15/mo | AWS ecosystem |

---

## ✅ Pre-Deployment Checklist

- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Domain name ready (optional)
- [ ] SSL certificate (auto on most platforms)
- [ ] Build tested locally: `npm run build && npm run preview`

---

## 🔧 Post-Deployment

### Testing
1. Visit your deployed URL
2. Test user registration/login
3. Verify PDF generation works
4. Check all loan calculations
5. Test document uploads

### Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Enable error tracking (Sentry integration available)
- Monitor Supabase dashboard for database performance

### Updates
```bash
# For git-based deployments
git add .
git commit -m "Update description"  
git push origin main
# Auto-deploys on most platforms
```

---

## 🆘 Troubleshooting

**Blank page after deployment:**
- Check browser console for errors
- Verify environment variables are set
- Ensure SPA routing is configured

**Build fails:**
- Run `npm run typecheck` locally
- Check Node.js version (need 18+)
- Verify all dependencies installed

**Supabase connection fails:**
- Double-check URL and anon key
- Verify CORS settings in Supabase
- Check RLS policies allow access

Need help? Check the DEPLOYMENT_GUIDE.md for detailed troubleshooting.