# Quick Start: Deploy to Coolify

## 🚀 Fast Deployment Guide

### Prerequisites
- ✅ Coolify server installed and running
- ✅ MySQL database accessible from Coolify server
- ✅ Domain name configured (optional but recommended)
- ✅ API keys for external services ready

### Step 1: Create Application in Coolify (2 minutes)

1. Log in to Coolify dashboard
2. Click **"+ New Resource"** → **"Application"**
3. Choose **"Public Repository"** or connect your Git provider
4. Repository: `https://github.com/cloudzeus/kimoncrm.git`
5. Branch: `master`
6. Build Pack: **Auto** (will detect Node.js)

### Step 2: Configure Environment Variables (5 minutes)

Go to **Environment Variables** tab and add:

#### Minimum Required Variables
```bash
# Database
DATABASE_URL=mysql://root:Prof%4015%401f1femsk@5.189.130.31:3333/kimoncrm
DIRECT_URL=mysql://root:Prof%4015%401f1femsk@5.189.130.31:3333/kimoncrm

# Auth (generate new secret!)
NEXTAUTH_SECRET=YOUR_RANDOM_SECRET_HERE_MIN_64_CHARS
NEXTAUTH_URL=https://your-domain.com
AUTH_TRUST_HOST=true

# Application
APP_URL=https://your-domain.com
PORT=3000
```

> ⚠️ **Critical:** Generate new `NEXTAUTH_SECRET`:
> ```bash
> openssl rand -hex 32
> ```

#### Add Authentication Provider (Choose One)

**Option A: Google OAuth**
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
```

**Option B: Microsoft Entra ID**
```bash
AUTH_MICROSOFT_ENTRA_ID_ID=your-application-id
AUTH_MICROSOFT_ENTRA_ID_SECRET=your-client-secret
TENANT_ID=your-tenant-id
```

> 📋 **Full list:** See [COOLIFY_ENV_SETUP.md](./COOLIFY_ENV_SETUP.md)

### Step 3: Verify Configuration Files (30 seconds)

These files should already be in the repository:
- ✅ `nixpacks.toml` - Build configuration
- ✅ `.dockerignore` - Build optimization
- ✅ `next.config.js` - Next.js optimizations
- ✅ `package.json` - With Prisma generation

If any are missing, pull the latest code:
```bash
git pull origin master
```

### Step 4: Deploy! (10-15 minutes first time, 3-5 minutes after)

1. Click **"Deploy"** button in Coolify
2. Monitor build logs (click "Show Logs")
3. Wait for deployment to complete

#### Expected Build Progress
```
✓ [1/4] Setup (1 min)
  - Installing Node.js 22, npm, system packages

✓ [2/4] Install Dependencies (2-3 min)
  - npm install --legacy-peer-deps
  - ~900 packages

✓ [3/4] Build Application (8-12 min)
  - Generating Prisma Client
  - Building Next.js application
  - Optimizing for production

✓ [4/4] Starting Server (10 sec)
  - Starting Next.js production server
```

### Step 5: Post-Deployment Checks (2 minutes)

1. **Check Application Status**
   - Go to your domain or Coolify preview URL
   - Should see login page

2. **Test Database Connection**
   ```bash
   # In Coolify terminal
   curl http://localhost:3000/api/health
   ```

3. **Test Authentication**
   - Try logging in with configured provider
   - Should redirect to OAuth page

4. **Check Logs for Errors**
   ```bash
   # In Coolify logs, look for:
   ✓ Ready on http://0.0.0.0:3000
   ```

## 🎉 Success!

Your application should now be running at your domain.

### Default Admin User

After first deployment, create admin user via Prisma Studio or SQL:

```sql
-- Connect to your database
INSERT INTO User (email, role, emailVerified)
VALUES ('your-email@domain.com', 'admin', NOW());
```

Or use the seed script:
```bash
# In Coolify terminal
npm run seed:company-details
```

## 🔧 Common First-Time Issues

### Issue: Build Timeout

**Quick Fix:**
1. Go to Application → Advanced Settings
2. Increase build timeout to 30 minutes
3. Redeploy

### Issue: "Cannot connect to database"

**Quick Fix:**
1. Verify database firewall allows Coolify server IP
2. Test connection from Coolify terminal:
   ```bash
   mysql -h 5.189.130.31 -P 3333 -u root -p kimoncrm
   ```

### Issue: "Invalid NEXTAUTH_SECRET"

**Quick Fix:**
1. Generate new secret:
   ```bash
   openssl rand -hex 32
   ```
2. Update in Coolify environment variables
3. Redeploy

### Issue: White Screen / 500 Error

**Quick Fix:**
1. Check application logs in Coolify
2. Look for specific error message
3. Common causes:
   - Missing environment variable
   - Database connection issue
   - Prisma schema mismatch

### Issue: "Module not found: @prisma/client"

**Quick Fix:**
This should not happen with the new configuration, but if it does:
1. Verify `nixpacks.toml` contains:
   ```toml
   [phases.build]
   cmds = ["npx prisma generate", "NODE_ENV=production npm run build"]
   ```
2. Redeploy

## 📚 Next Steps

### 1. Configure Additional Services

Add more environment variables for:
- **BunnyCDN** (file uploads)
- **Microsoft Graph API** (email/calendar)
- **SoftOne ERP** (business data sync)
- **AI Services** (OpenAI/DeepSeek)

See [COOLIFY_ENV_SETUP.md](./COOLIFY_ENV_SETUP.md) for details.

### 2. Set Up SSL

If not already configured:
1. Go to Application → Domains
2. Click your domain
3. Enable "Force HTTPS"
4. Wait for SSL certificate generation (Let's Encrypt)

### 3. Configure Health Checks

1. Go to Application → Health Checks
2. Set:
   - Protocol: HTTP
   - Port: 3000
   - Path: `/api/health` (if implemented)
   - Interval: 30s

### 4. Set Up Automatic Deployments

Enable automatic deployments on git push:
1. Go to Application → Source
2. Enable "Automatic Deployment"
3. Choose branch: `master`

### 5. Database Management

#### Run Migrations (When Needed)
```bash
# In Coolify terminal
npx prisma db push
```

#### Access Prisma Studio (Development)
Not recommended in production. Use local development instead:
```bash
# Locally
npm run prisma:studio
```

### 6. Monitor Application

Set up monitoring:
- **Uptime Monitoring:** UptimeRobot, Better Uptime
- **Error Tracking:** Sentry (add to project)
- **Performance:** Vercel Analytics, Plausible

### 7. Backup Strategy

Set up regular backups:
1. **Database:** Daily automated backups
   ```bash
   mysqldump -h 5.189.130.31 -P 3333 -u root -p kimoncrm > backup-$(date +%Y%m%d).sql
   ```

2. **Environment Variables:** Export from Coolify regularly

3. **Code:** Already in Git ✅

## 🛠️ Development Workflow

### Local Development
```bash
# Clone repository
git clone https://github.com/cloudzeus/kimoncrm.git
cd kimoncrm

# Install dependencies
npm install --legacy-peer-deps

# Set up environment
cp .env.example .env
# Edit .env with local database URL

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Start development server
npm run dev
```

### Deployment Workflow
```bash
# Make changes locally
git add .
git commit -m "Your changes"

# Push to trigger deployment (if auto-deploy enabled)
git push origin master

# Or deploy manually in Coolify
```

## 📞 Getting Help

### Resources
1. **Deployment Issues:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. **Environment Setup:** [COOLIFY_ENV_SETUP.md](./COOLIFY_ENV_SETUP.md)
3. **Coolify Docs:** https://coolify.io/docs
4. **Next.js Docs:** https://nextjs.org/docs

### Troubleshooting Steps
1. Check application logs in Coolify
2. Review build logs for errors
3. Verify environment variables
4. Test database connectivity
5. Check external service status (BunnyCDN, etc.)

### Still Stuck?
1. Check deployment logs for specific error
2. Search error message in documentation
3. Verify all environment variables are set
4. Try redeploying from last successful commit

---

## 📋 Deployment Checklist

- [ ] Coolify application created
- [ ] Database accessible from Coolify
- [ ] Minimum environment variables set
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] Authentication provider configured
- [ ] Domain connected (optional)
- [ ] SSL enabled (optional)
- [ ] First deployment successful
- [ ] Login tested
- [ ] Database connection verified
- [ ] Admin user created
- [ ] Logs checked for errors

---

**Estimated Total Time:** 20-30 minutes for first deployment

**After first deployment:** 2-5 minutes for updates

---

**Last Updated:** 2025-10-18

