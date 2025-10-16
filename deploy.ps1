# PowerShell deployment script for CCG Art Loan System
# Usage: .\deploy.ps1 [platform]

param(
    [string]$Platform = "auto"
)

Write-Host "🚀 CCG Art Loan System Deployment Script" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

# Check if build passes
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Fix errors and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Detect or use provided platform
if ($Platform -eq "auto") {
    Write-Host "🔍 Detecting deployment platform..." -ForegroundColor Yellow
    
    if (Get-Command netlify -ErrorAction SilentlyContinue) {
        $Platform = "netlify"
    } elseif (Get-Command vercel -ErrorAction SilentlyContinue) {
        $Platform = "vercel"
    } elseif (Get-Command railway -ErrorAction SilentlyContinue) {
        $Platform = "railway"
    } elseif (Get-Command docker -ErrorAction SilentlyContinue) {
        $Platform = "docker"
    } else {
        Write-Host "📋 No deployment CLI detected. Available options:" -ForegroundColor Yellow
        Write-Host "   .\deploy.ps1 netlify"
        Write-Host "   .\deploy.ps1 vercel"
        Write-Host "   .\deploy.ps1 railway"
        Write-Host "   .\deploy.ps1 docker"
        exit 1
    }
}

Write-Host "🎯 Deploying to: $Platform" -ForegroundColor Cyan

switch ($Platform) {
    "netlify" {
        Write-Host "🌐 Deploying to Netlify..." -ForegroundColor Blue
        if (!(Get-Command netlify -ErrorAction SilentlyContinue)) {
            Write-Host "Installing Netlify CLI..." -ForegroundColor Yellow
            npm install -g netlify-cli
        }
        netlify deploy --prod --dir=dist
    }
    
    "vercel" {
        Write-Host "▲ Deploying to Vercel..." -ForegroundColor Blue
        if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
            Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
            npm install -g vercel
        }
        vercel --prod
    }
    
    "railway" {
        Write-Host "🚄 Deploying to Railway..." -ForegroundColor Blue
        if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
            Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
            npm install -g @railway/cli
        }
        railway up
    }
    
    "docker" {
        Write-Host "🐳 Building Docker image..." -ForegroundColor Blue
        docker build -t ccg-art-loan-system .
        Write-Host "🏃 Starting container on port 8080..." -ForegroundColor Yellow
        docker run -d -p 8080:80 --name ccg-art-loan ccg-art-loan-system
        Write-Host "✅ Container started! Visit http://localhost:8080" -ForegroundColor Green
    }
    
    default {
        Write-Host "❌ Unknown platform: $Platform" -ForegroundColor Red
        Write-Host "Supported: netlify, vercel, railway, docker"
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Deployment initiated!" -ForegroundColor Green
Write-Host "💡 Don't forget to set environment variables on your platform:" -ForegroundColor Yellow
Write-Host "   VITE_SUPABASE_URL=your-supabase-url"
Write-Host "   VITE_SUPABASE_ANON_KEY=your-anon-key"