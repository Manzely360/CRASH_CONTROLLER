# Cloud Deployment Guide

This guide covers deploying the Crash Controller system to the cloud using Vercel for the frontend and Railway for the backend services.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard     │    │   Controller    │    │  Cloud Workers  │
│   (Vercel)      │◄──►│   (Railway)     │◄──►│   (Railway)     │
│   Frontend      │    │   API Server    │    │   Backend       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Redis Cache   │    │   File Storage  │
│   (Railway)     │    │   (Railway)     │    │   (Railway)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### Required Tools
- Node.js 18+
- Vercel CLI: `npm i -g vercel`
- Railway CLI: `npm i -g @railway/cli`
- Git

### Required Accounts
- Vercel account (free tier available)
- Railway account (free tier available)
- Google Cloud Console account (for OAuth)

## Step 1: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-app.vercel.app/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret

## Step 2: Database Setup

### Option A: Railway PostgreSQL
```bash
# Create new Railway project
railway new

# Add PostgreSQL service
railway add postgresql

# Get connection string
railway variables
```

### Option B: Supabase (Alternative)
1. Go to [Supabase](https://supabase.com/)
2. Create new project
3. Get connection string from Settings → Database

## Step 3: Deploy Controller API

```bash
cd controller

# Initialize Railway project
railway init

# Set environment variables
railway variables set DATABASE_URL="postgresql://..."
railway variables set NEXTAUTH_SECRET="your-secret-key"
railway variables set NEXTAUTH_URL="https://your-app.vercel.app"

# Deploy
railway up
```

## Step 4: Deploy Cloud Workers

```bash
cd worker-cloud

# Initialize Railway project
railway init

# Set environment variables
railway variables set CONTROLLER_URL="https://your-controller.railway.app"
railway variables set WORKER_ID="cloud-worker-1"
railway variables set CLOUD_REGION="us-east-1"

# Deploy
railway up
```

## Step 5: Deploy Dashboard

```bash
cd dashboard

# Initialize Vercel project
vercel init

# Set environment variables
vercel env add NEXT_PUBLIC_CONTROLLER_URL
vercel env add NEXT_PUBLIC_MOCK_CRASH_URL
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET

# Deploy
vercel --prod
```

## Step 6: Environment Variables

### Dashboard (Vercel)
```env
NEXT_PUBLIC_CONTROLLER_URL=https://your-controller.railway.app
NEXT_PUBLIC_MOCK_CRASH_URL=https://your-mock-site.railway.app
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Controller (Railway)
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
MOCK_CRASH_URL=https://your-mock-site.railway.app
PORT=3000
```

### Cloud Workers (Railway)
```env
CONTROLLER_URL=https://your-controller.railway.app
MOCK_CRASH_URL=https://your-mock-site.railway.app
WORKER_ID=cloud-worker-1
CLOUD_REGION=us-east-1
PORT=3001
```

## Step 7: Database Migration

```bash
cd dashboard

# Install Prisma CLI
npm install -g prisma

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push

# Seed database (optional)
npx prisma db seed
```

## Step 8: Testing Deployment

### Health Checks
```bash
# Check dashboard
curl https://your-app.vercel.app

# Check controller
curl https://your-controller.railway.app/health

# Check cloud workers
curl https://your-workers.railway.app/health
```

### Test Authentication
1. Visit your dashboard URL
2. Click "Sign in with Google"
3. Complete OAuth flow
4. Verify user is created in database

### Test Cloud Workers
1. Create a new cloud worker
2. Verify remote desktop access
3. Test terminal access
4. Test Python script execution

## Step 9: Monitoring and Maintenance

### Vercel Dashboard
- Monitor function executions
- View build logs
- Check performance metrics

### Railway Dashboard
- Monitor service health
- View logs
- Check resource usage
- Scale services as needed

### Database Monitoring
- Monitor connection count
- Check query performance
- Set up alerts for issues

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Check Google OAuth configuration
   - Verify redirect URIs match exactly
   - Check NEXTAUTH_URL environment variable

2. **Database connection issues**
   - Verify DATABASE_URL is correct
   - Check if database is accessible
   - Run Prisma migrations

3. **Cloud workers not connecting**
   - Check CONTROLLER_URL environment variable
   - Verify network connectivity
   - Check Railway service logs

4. **Remote desktop not accessible**
   - Check if XRDP service is running
   - Verify port 3389 is exposed
   - Check Railway public domain

### Debug Commands

```bash
# Check Vercel deployment
vercel logs

# Check Railway logs
railway logs

# Check database connection
railway run npx prisma db pull

# Test cloud worker connectivity
railway run curl $CONTROLLER_URL/health
```

## Security Considerations

### Environment Variables
- Never commit secrets to Git
- Use Railway and Vercel environment variable management
- Rotate secrets regularly

### Network Security
- Use HTTPS for all communications
- Implement proper CORS policies
- Use Railway's built-in security features

### Access Control
- Implement proper user authentication
- Use role-based access control
- Monitor user activities

## Cost Optimization

### Vercel
- Use edge functions for better performance
- Optimize bundle size
- Use Vercel Analytics for insights

### Railway
- Monitor resource usage
- Use appropriate instance sizes
- Implement auto-scaling

### Database
- Use connection pooling
- Optimize queries
- Monitor storage usage

## Scaling

### Horizontal Scaling
- Deploy multiple worker instances
- Use load balancers
- Implement worker queues

### Vertical Scaling
- Increase instance sizes
- Add more memory/CPU
- Optimize application performance

## Backup and Recovery

### Database Backups
- Enable automatic backups
- Test restore procedures
- Store backups securely

### Code Backups
- Use Git for version control
- Tag releases
- Keep deployment history

## Support

### Documentation
- Keep deployment docs updated
- Document troubleshooting steps
- Maintain runbooks

### Monitoring
- Set up alerts for critical issues
- Monitor performance metrics
- Track error rates

---

**Remember: This is an educational platform. Always follow best practices for security and cost management.**
