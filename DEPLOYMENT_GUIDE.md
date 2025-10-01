# Railway Deployment Guide

## Quick Start for Live Experimental Run

### Prerequisites
1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install with `npm i -g @railway/cli`
3. **Git Repository**: Push code to GitHub/GitLab

### Step 1: Push to Git Repository

```bash
# If using GitHub (recommended)
gh auth login
gh repo create crash-controller --public
git remote add origin https://github.com/YOUR_USERNAME/crash-controller.git
git push -u origin main

# Or if using GitLab
git remote add origin https://gitlab.com/YOUR_USERNAME/crash-controller.git
git push -u origin main
```

### Step 2: Deploy to Railway

```bash
# Login to Railway
railway login

# Deploy the system
./scripts/deploy-railway.sh
```

### Step 3: Access Your Live System

After deployment, you'll get URLs like:
- **Controller API**: `https://controller-production.up.railway.app`
- **Mock Crash Site**: `https://mock-crash-production.up.railway.app`
- **Cloud Worker**: `https://cloud-worker-production.up.railway.app`

### Step 4: Test the Deployment

```bash
# Test controller health
curl https://controller-production.up.railway.app/health

# Test mock crash game
curl https://mock-crash-production.up.railway.app/api/game/status

# Test cloud worker
curl https://cloud-worker-production.up.railway.app/health
```

## Manual Railway Deployment

If the automated script doesn't work, you can deploy manually:

### 1. Deploy Controller API
```bash
cd controller
railway new crash-controller-controller
railway up
railway variables set NODE_ENV=production
railway variables set PORT=3000
```

### 2. Deploy Mock Crash Site
```bash
cd mock-crash
railway new crash-controller-mock-crash
railway up
railway variables set NODE_ENV=production
railway variables set PORT=3000
```

### 3. Deploy Cloud Worker
```bash
cd worker-cloud
railway new crash-controller-cloud-worker
railway up
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set CLOUD_REGION=us-east-1
```

## Environment Variables

### Controller API
- `NODE_ENV=production`
- `PORT=3000`
- `MOCK_CRASH_URL=https://mock-crash-production.up.railway.app`

### Mock Crash Site
- `NODE_ENV=production`
- `PORT=3000`

### Cloud Worker
- `NODE_ENV=production`
- `PORT=3001`
- `CONTROLLER_URL=https://controller-production.up.railway.app`
- `MOCK_CRASH_URL=https://mock-crash-production.up.railway.app`
- `CLOUD_REGION=us-east-1`

## Monitoring and Management

### View Logs
```bash
railway logs
railway logs [service-name]
```

### Check Status
```bash
railway status
```

### Scale Services
```bash
railway scale [service-name] [instances]
```

### Open Dashboard
```bash
railway open
```

## Safety and Legal Notice

⚠️ **IMPORTANT**: This system is designed for educational purposes only:

- All interactions target the mock crash site
- No real gambling or external accounts are used
- No real money or cryptocurrency is involved
- Safe for demonstration and learning

## Troubleshooting

### Common Issues

1. **Service not starting**
   - Check logs: `railway logs [service-name]`
   - Verify environment variables
   - Check port configuration

2. **Services not connecting**
   - Verify URLs are correct
   - Check network connectivity
   - Ensure services are running

3. **Build failures**
   - Check Dockerfile syntax
   - Verify package.json dependencies
   - Check for missing files

### Getting Help

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: Create an issue in the GitHub repository

## Next Steps

1. **Set up Google OAuth** (optional)
   - Create Google Cloud Console project
   - Configure OAuth credentials
   - Update environment variables

2. **Add Database** (optional)
   - Add PostgreSQL service to Railway
   - Update connection strings
   - Run migrations

3. **Custom Domain** (optional)
   - Configure custom domain in Railway
   - Update DNS settings
   - Update environment variables

4. **Monitoring** (optional)
   - Set up Railway monitoring
   - Configure alerts
   - Add performance tracking
