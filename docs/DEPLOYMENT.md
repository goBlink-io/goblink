# Deployment Guide

## Vercel Deployment (Frontend)

### Initial Setup

1. **Push to GitHub**
```bash
git add .
git commit -m "Phase 2.1 complete - Solana integration"
git push origin main
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Select `apps/web` as the root directory
- Vercel auto-detects Next.js

3. **Environment Variables**
Add to Vercel project settings:
```
# Not needed for frontend - API handles this
```

### Build Configuration

Vercel will automatically:
- Detect Next.js framework
- Run `npm install` (uses .npmrc settings)
- Run `npm run build`
- Deploy to edge network

**No special configuration needed** - `.npmrc` ensures clean install on Linux.

---

## Railway/Render Deployment (Backend)

### Railway Setup

1. **Create New Project**
- Connect GitHub repository
- Select `apps/api` directory

2. **Environment Variables**
```
ONE_CLICK_JWT=your_jwt_token_here
NODE_ENV=production
API_PORT=3001
CORS_ORIGIN=https://your-frontend.vercel.app
```

3. **Start Command**
```bash
npm run build && npm run start
```

### Database (Optional)

Railway provides PostgreSQL:
```
DATABASE_URL=postgresql://user:pass@host:5432/db
```

---

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: |
          cd apps/web
          vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Fresh Install Testing

To verify deployment works:

```bash
# Clone fresh
git clone <your-repo>
cd sapphire

# Install (should work flawlessly on Linux/Mac)
npm install

# Or on Windows (already handled by .npmrc)
npm install
```

The `.npmrc` file ensures:
- ✅ Linux/Mac: Clean install, no issues
- ✅ Windows: Skips problematic scripts
- ✅ Vercel: Uses settings automatically
- ✅ CI/CD: Consistent behavior

---

## Troubleshooting Deployment

### Issue: Build fails on Vercel

**Check:**
1. Root directory set to `apps/web`
2. Build command: `npm run build` (auto-detected)
3. Output directory: `.next` (auto-detected)

### Issue: API can't connect to frontend

**Check CORS:**
```typescript
// apps/api/src/index.ts
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
```

Set `CORS_ORIGIN` in Railway to your Vercel URL.

### Issue: Environment variables not working

**Vercel:**
- Settings → Environment Variables
- Restart deployment after adding

**Railway:**
- Variables tab
- Redeploy after changes

---

## Production Checklist

### Before Deploying

- [ ] `.npmrc` file committed
- [ ] `ONE_CLICK_JWT` obtained from partners.near-intents.org
- [ ] API deployed and URL noted
- [ ] Frontend `API_URL` configured for production
- [ ] CORS configured with production URLs
- [ ] Database schema initialized (if using DB)
- [ ] Redis configured (if using caching)

### After Deploying

- [ ] Test EVM wallet connection
- [ ] Test Solana wallet connection
- [ ] Test quote generation
- [ ] Test status tracking
- [ ] Test error scenarios
- [ ] Monitor error tracking (Sentry recommended)

---

## Performance Optimization

### Vercel Edge Network
- Automatic CDN
- Zero configuration
- Global edge caching

### Railway/Render
- Enable Redis for token caching
- Use connection pooling for PostgreSQL
- Monitor API response times

---

## Cost Estimates

### Vercel (Frontend)
- Free tier: Sufficient for MVP
- Pro: $20/month (if needed)

### Railway (Backend)
- Free tier: $5 credit/month
- Hobby: $5/month minimum
- Estimated: $10-20/month with DB

### Total MVP Cost
**$0-30/month** depending on traffic

---

## Security - Production

1. **Environment Variables**
   - Never commit `.env`
   - Use platform secret managers

2. **CORS**
   - Whitelist specific origins
   - No wildcards in production

3. **Rate Limiting**
   - Implement per-IP limits
   - Use Cloudflare (free tier)

4. **API Keys**
   - Rotate regularly
   - Monitor usage at partners portal

---

## Monitoring

### Recommended Tools

1. **Vercel Analytics** (Built-in)
   - Page views
   - Performance metrics

2. **Sentry** (Free tier)
   - Error tracking
   - Performance monitoring

3. **Railway Logs**
   - API request logs
   - Error tracking

---

## Scaling Considerations

### When to Scale

- \> 1000 daily active users
- API response time > 2 seconds
- Vercel bandwidth limits reached

### How to Scale

1. **Frontend**: Vercel scales automatically
2. **Backend**: Railway autoscaling or switch to AWS/GCP
3. **Database**: Connection pooling, read replicas
4. **Cache**: Redis cluster for high traffic

---

**Quick Deploy Commands:**

```bash
# Frontend to Vercel
cd apps/web
vercel --prod

# Backend to Railway
railway up

# Both via CI/CD
git push origin main
```

Your `.npmrc` ensures smooth installs everywhere! 🚀
