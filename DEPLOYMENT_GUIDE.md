# Deployment Guide & Troubleshooting

## Overview
This guide provides solutions to common deployment issues and best practices for deploying the Kimon CRM application on Coolify or similar platforms.

## Common Deployment Issues & Solutions

### 1. Build Timeout / Connection Drop During Build

**Symptoms:**
- Build fails with "Connection to server closed by remote host"
- Build hangs at "Creating an optimized production build..."
- Out of memory errors

**Solutions:**

#### A. Optimize Coolify Server Resources
Ensure your Coolify server has adequate resources:
- **Minimum:** 2GB RAM, 2 CPU cores
- **Recommended:** 4GB RAM, 4 CPU cores for builds
- Check server memory: `free -h`
- Monitor during build: `htop`

#### B. Increase Build Timeout in Coolify
1. Go to your application settings in Coolify
2. Navigate to "Advanced" settings
3. Increase build timeout to at least 20-30 minutes
4. Add custom Docker build arguments if needed

#### C. Enable Build Cache
The `.dockerignore` file has been configured to optimize builds by excluding:
- `node_modules`
- `.next` directory
- Test files
- Documentation

#### D. Use Coolify Build Resources
If available, configure dedicated build resources:
- Allocate more memory to the build container
- Use build-specific CPU limits

### 2. NODE_ENV=production During Build

**Symptoms:**
- devDependencies not installed
- TypeScript compilation errors
- Prisma Client generation fails

**Solution:**
The `nixpacks.toml` now correctly sets:
```toml
[variables]
NODE_ENV = "development"
```
This ensures devDependencies are installed during build, then switches to production for runtime.

### 3. Prisma Client Not Generated

**Symptoms:**
- `@prisma/client` import errors
- "Cannot find module '@prisma/client'" errors

**Solution:**
The build script now includes Prisma generation:
```json
"build": "prisma generate && next build"
```

Additionally, `nixpacks.toml` explicitly runs:
```toml
[phases.build]
cmds = [
  "npx prisma generate",
  "NODE_ENV=production npm run build"
]
```

### 4. Large Docker Image Size

**Symptoms:**
- Slow deployments
- High storage usage
- Long upload times

**Solution:**
The `.dockerignore` file excludes unnecessary files:
- Development dependencies
- Test files
- Documentation
- IDE configurations
- Git history

## Deployment Checklist

Before each deployment, verify:

### 1. Environment Variables
Ensure all required environment variables are set in Coolify:

**Required:**
- `DATABASE_URL` - MySQL connection string
- `DIRECT_URL` - Direct MySQL connection (for Prisma)
- `NEXTAUTH_SECRET` - Auth secret key
- `NEXTAUTH_URL` - Application URL
- `AUTH_TRUST_HOST=true`

**Authentication (at least one provider):**
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Microsoft: `AUTH_MICROSOFT_ENTRA_ID_ID`, `AUTH_MICROSOFT_ENTRA_ID_SECRET`
- Graph API: `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_TENANT_ID`

**External Services:**
- BunnyCDN: `BUNNY_*` variables
- SoftOne: `SOFTONE_*` variables
- OpenAI: `OPENAI_API_KEY`
- DeepSeek: `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`

**Important:** Mark `NODE_ENV` as **Runtime Only** in Coolify!

### 2. Database Connectivity
Ensure database is accessible from Coolify:
```bash
# Test connection
mysql -h YOUR_DB_HOST -P 3333 -u root -p kimoncrm
```

### 3. Build Configuration
Verify files exist:
- ✅ `.dockerignore` - Optimizes Docker build context
- ✅ `nixpacks.toml` - Configures build process
- ✅ `next.config.js` - Optimized for production
- ✅ `package.json` - Build script includes Prisma generation

### 4. Pre-Deployment Commands
Run locally before deploying critical changes:
```bash
# Type check
npm run type-check

# Lint
npm run lint

# Build locally (optional but recommended)
npm run build
```

### 5. Post-Deployment
After successful deployment:
1. Check application logs in Coolify
2. Verify database migrations: `npx prisma db push` (if needed)
3. Test authentication flows
4. Verify external service connections (BunnyCDN, email, etc.)

## Optimization Tips

### 1. Enable Output Caching
Next.js caches are preserved between builds. Monitor cache hits in build logs.

### 2. Database Connection Pooling
Ensure Prisma is configured for connection pooling:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 3. Monitor Build Times
Track build times to identify regressions:
- Normal build: 5-10 minutes
- With cache: 3-5 minutes
- Full rebuild: 10-15 minutes

If builds consistently exceed 15 minutes, investigate:
- Check for circular dependencies
- Review large component files
- Optimize imports

### 4. Incremental Deployments
For large changes:
1. Deploy to staging first
2. Test thoroughly
3. Deploy to production during low-traffic periods

## Troubleshooting Commands

### Check Build Logs
In Coolify:
1. Go to your application
2. Click "Deployments"
3. Select failed deployment
4. Click "Show Debug Logs"

### Common Error Patterns

#### "Cannot find module X"
```bash
# Solution: Ensure package is in dependencies, not devDependencies
npm install --save X
```

#### "ECONNREFUSED" Database Errors
```bash
# Check database URL format
# Correct: mysql://user:pass@host:port/db
# Ensure special characters are URL-encoded
```

#### Memory Errors During Build
```bash
# Error: JavaScript heap out of memory
# Solution: Increase Node.js memory in Coolify
# Add environment variable (build-time):
NODE_OPTIONS="--max-old-space-size=4096"
```

### Manual Build Test
To test build locally with similar environment:
```bash
# Install dependencies
npm ci --legacy-peer-deps

# Generate Prisma Client
npx prisma generate

# Build
NODE_ENV=production npm run build

# Start
npm start
```

## Emergency Rollback

If deployment fails and site is down:

### 1. Quick Rollback in Coolify
1. Go to "Deployments"
2. Find last successful deployment
3. Click "Redeploy"

### 2. Manual Fix
1. Identify the commit that broke deployment
2. `git revert <commit-hash>`
3. Push to trigger new deployment

## Monitoring

### Key Metrics to Monitor
1. **Build Time:** Should be < 15 minutes
2. **Memory Usage:** Monitor server memory during builds
3. **Response Time:** Check application performance post-deployment
4. **Error Rates:** Watch application logs for errors

### Coolify Alerts
Set up alerts for:
- Deployment failures
- High memory usage
- Application downtime

## Support Contacts

- Coolify Documentation: https://coolify.io/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Nixpacks Reference: https://nixpacks.com/docs

## Version History

- **v1.0** (2025-10-18): Initial deployment guide with optimizations
  - Added `.dockerignore`
  - Optimized `nixpacks.toml`
  - Enhanced `next.config.js`
  - Added Prisma generation to build

## Quick Reference: Build Process

```
┌─────────────────────────────────────────────────────┐
│ 1. SETUP PHASE                                      │
│    - Install system packages (curl, wget)          │
│    - Install Node.js 22 & npm                       │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 2. INSTALL PHASE (NODE_ENV=development)             │
│    - npm ci --legacy-peer-deps                      │
│    - Installs ALL dependencies (including dev)      │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 3. BUILD PHASE                                      │
│    - npx prisma generate                            │
│    - NODE_ENV=production npm run build              │
│    - Creates optimized production bundle            │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ 4. START PHASE                                      │
│    - NODE_ENV=production npm start                  │
│    - Starts Next.js production server               │
└─────────────────────────────────────────────────────┘
```

## Additional Notes

### Node Version Compatibility
- Current: Node.js 22.11.0
- Vite warning can be ignored (requires 22.12.0+)
- Consider updating to Node.js 22.12.0+ when available

### Deprecated Packages
Several packages show deprecation warnings but are still functional:
- `inflight@1.0.6` - Used by npm internally
- `glob@7.2.3` - Dependency of older packages
- `eslint@8.57.1` - Consider upgrading to ESLint 9

These don't affect deployment but should be addressed in future updates.

---

**Last Updated:** 2025-10-18
**Maintained By:** Development Team

