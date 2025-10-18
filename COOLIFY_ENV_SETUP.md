# Coolify Environment Variables Setup Guide

## Critical Configuration

### ⚠️ IMPORTANT: NODE_ENV Setting

**DO NOT set NODE_ENV as a build-time variable!**

The `nixpacks.toml` configuration handles NODE_ENV automatically:
- **Build Phase:** Uses `development` to install devDependencies
- **Runtime:** Switches to `production`

If you have `NODE_ENV=production` in your Coolify environment variables:
1. Go to your app → Environment Variables
2. Find `NODE_ENV`
3. **Uncheck "Available at Buildtime"** ✅
4. Keep "Available at Runtime" checked
5. OR remove it completely (recommended)

## Required Environment Variables

### Database Configuration
```bash
DATABASE_URL="mysql://username:password@host:port/database"
DIRECT_URL="mysql://username:password@host:port/database"
```

**Important:** 
- URL-encode special characters in passwords
- Example: `@` becomes `%40`, `!` becomes `%21`, `#` becomes `%23`
- Current format: `mysql://root:Prof%4015%401f1femsk@5.189.130.31:3333/kimoncrm`

### Authentication
```bash
# NextAuth Configuration
NEXTAUTH_SECRET="your-very-long-random-secret-here"
NEXTAUTH_URL="https://your-domain.com"
AUTH_TRUST_HOST="true"

# Google OAuth (Optional but recommended)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Microsoft Entra ID / Azure AD
AUTH_MICROSOFT_ENTRA_ID_ID="your-application-id"
AUTH_MICROSOFT_ENTRA_ID_SECRET="your-client-secret"
TENANT_ID="your-tenant-id"

# Microsoft Graph API
GRAPH_CLIENT_ID="your-client-id"
GRAPH_CLIENT_SECRET="your-client-secret"
GRAPH_TENANT_ID="your-tenant-id"
GRAPH_SCOPES="offline_access openid profile Mail.ReadWrite Mail.Send Calendars.ReadWrite Files.ReadWrite.All"
```

### Google Services (Optional)
```bash
GOOGLE_SA_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com"
GOOGLE_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SCOPES="openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive.file"
GOOGLE_WORKSPACE_ADMIN="admin@yourdomain.com"
```

### BunnyCDN Configuration
```bash
BUNNY_STORAGE_ZONE="your-storage-zone"
BUNNY_ACCESS_KEY="your-access-key"
BUNNY_HOST_NAME="storage.bunnycdn.com"
BUNNY_STORAGE_REGION="de"
BUNNY_CDN_PULL_ZONE="your-zone.b-cdn.net"
```

### SoftOne ERP Integration
```bash
SOFTONE_BASE_URL="https://your-instance.oncloud.gr/s1services/JS"
SOFTONE_USERNAME="Service"
SOFTONE_PASSWORD="your-password"
SOFTONE_COMPANY="1000"
SOFTONE_SODTYPE="13"
```

### AI Services
```bash
# OpenAI
OPENAI_API_KEY="sk-proj-..."

# DeepSeek (Alternative)
DEEPSEEK_API_KEY="sk-..."
DEEPSEEK_BASE_URL="https://api.deepseek.com/v1"
DEEPSEEK_MODEL="deepseek-chat"
```

### Application Settings
```bash
APP_URL="https://your-domain.com"
PORT="3000"

# Security
CREDENTIALS_SALT="your-random-salt-for-password-hashing"
CRON_SECRET="your-cron-secret-for-webhook-protection"
WEBHOOK_HMAC_SECRET="your-webhook-secret"
```

## Coolify Configuration Checklist

### 1. Application Settings
- ✅ **Build Pack:** Auto (detects Node.js)
- ✅ **Port:** 3000
- ✅ **Custom nixpacks.toml:** Already in repository

### 2. Build Configuration
- ✅ **Build Command:** Handled by nixpacks.toml
- ✅ **Start Command:** `npm start` (configured in nixpacks.toml)
- ❌ **Build Arguments:** Not needed (nixpacks handles everything)

### 3. Advanced Settings

#### Resource Limits (Recommended)
```yaml
Build:
  Memory: 4GB
  CPU: 2 cores
  Timeout: 30 minutes

Runtime:
  Memory: 2GB
  CPU: 1 core
```

#### Health Check
```yaml
Protocol: HTTP
Port: 3000
Path: /api/health
Interval: 30s
Timeout: 10s
Retries: 3
```

### 4. Domain & SSL
- ✅ Add your domain
- ✅ Enable automatic SSL
- ✅ Force HTTPS redirect

### 5. Persistent Storage (Optional)
If you need persistent file storage:
```yaml
/app/.next/cache → Preserve Next.js build cache
```

## Environment Variable Management

### Grouping in Coolify

Create these groups for better organization:

#### 🔐 **Security** (Mark as secrets)
- `NEXTAUTH_SECRET`
- `CREDENTIALS_SALT`
- `CRON_SECRET`
- `WEBHOOK_HMAC_SECRET`
- All API keys and secrets

#### 🗄️ **Database**
- `DATABASE_URL`
- `DIRECT_URL`

#### 🔑 **Authentication**
- All `GOOGLE_*` variables
- All `AUTH_*` variables
- All `GRAPH_*` variables
- `TENANT_ID`

#### 📦 **External Services**
- All `BUNNY_*` variables
- All `SOFTONE_*` variables
- All `OPENAI_*` and `DEEPSEEK_*` variables

#### ⚙️ **Application**
- `APP_URL`
- `PORT`
- `NEXTAUTH_URL`

### Runtime vs Build-time Variables

| Variable | Build-time | Runtime | Notes |
|----------|------------|---------|-------|
| `NODE_ENV` | ❌ | ✅ | Let nixpacks handle this |
| `DATABASE_URL` | ❌ | ✅ | Not needed during build |
| `NEXTAUTH_SECRET` | ❌ | ✅ | Security risk if in build |
| All others | ❌ | ✅ | Default to runtime only |

**Exception:** Only make variables build-time if they're used in Next.js public env vars (`NEXT_PUBLIC_*`)

## Quick Setup Script

You can bulk import variables in Coolify:

1. Go to your application
2. Click "Environment Variables"
3. Click "Bulk Edit"
4. Paste all variables at once (format: `KEY=VALUE`)

## Validation

After setting environment variables:

### 1. Check Build Logs
Look for these indicators:
```
✅ npm install --legacy-peer-deps (should complete)
✅ npx prisma generate (should generate client)
✅ next build (should complete without errors)
```

### 2. Check Runtime Logs
After deployment starts:
```bash
# In Coolify logs, you should see:
> next start
✓ Ready on http://0.0.0.0:3000
```

### 3. Test Endpoints
```bash
# Health check (if implemented)
curl https://your-domain.com/api/health

# Authentication
curl https://your-domain.com/api/auth/providers
```

## Troubleshooting

### Issue: "Environment variable not found"

**Solution:**
1. Verify variable is set in Coolify
2. Check spelling (case-sensitive)
3. Restart deployment
4. Check if marked as "Available at Runtime"

### Issue: Build fails with TypeScript errors

**Solution:**
1. Ensure `NODE_ENV` is NOT set as build-time variable
2. Verify `nixpacks.toml` is committed to repository
3. Check that devDependencies are in `package.json`

### Issue: "Cannot connect to database"

**Solution:**
1. Verify database is accessible from Coolify server:
   ```bash
   # In Coolify terminal
   nc -zv your-db-host 3333
   ```
2. Check firewall rules allow Coolify server IP
3. Verify connection string format and URL encoding

### Issue: Prisma Client errors

**Solution:**
1. Check that `npx prisma generate` runs during build
2. Verify `DATABASE_URL` is set
3. Ensure `@prisma/client` and `prisma` versions match in package.json

## Security Best Practices

1. ✅ Mark all secrets as "Secret" in Coolify (will be masked in logs)
2. ✅ Use strong, randomly generated values for:
   - `NEXTAUTH_SECRET` (min 64 characters)
   - `CREDENTIALS_SALT` (min 32 characters)
   - `CRON_SECRET` (min 32 characters)
3. ✅ Rotate secrets periodically
4. ✅ Never commit `.env` files to git
5. ✅ Use different values for staging/production

## Generating Secure Secrets

```bash
# Generate random secret (64 characters)
openssl rand -hex 32

# Generate random secret (base64)
openssl rand -base64 48

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Migration from Other Platforms

### From Vercel
- Export environment variables from Vercel dashboard
- Import to Coolify (same format)
- Note: Some Vercel-specific variables may not be needed

### From Railway
- Most variables can be copied directly
- Update `DATABASE_URL` if using Railway's Postgres
- Remove Railway-specific variables

### From Heroku
- Export config vars: `heroku config -s > .env.production`
- Review and remove Heroku-specific variables
- Import to Coolify

---

**Last Updated:** 2025-10-18
**For Issues:** Check DEPLOYMENT_GUIDE.md

