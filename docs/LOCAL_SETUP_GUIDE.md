# Local Setup Guide - Sapphire Application

This guide will walk you through setting up and running the Sapphire cross-chain swap application on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20.0.0 or higher
  - Check your version: `node --version`
  - Download from: https://nodejs.org/

- **npm**: Usually comes with Node.js
  - Check your version: `npm --version`

- **1Click API Key**: Required for swap functionality
  - Get yours from: https://partners.near-intents.org

- **WalletConnect Project ID**: Required for wallet connections
  - Get yours from: https://cloud.walletconnect.com

---

## 🚀 Step-by-Step Setup

### Step 1: Navigate to Project Directory

Open your terminal and navigate to the project:

```bash
cd d:/near/sapphire
```

### Step 2: Install Dependencies

Install all project dependencies using npm with the `--legacy-peer-deps` flag to avoid peer dependency conflicts:

```bash
npm install --legacy-peer-deps
```

This command will install dependencies for all workspaces (apps and packages).

**Expected output**: You should see npm installing packages for the root, apps, and packages directories.

### Step 3: Configure Environment Variables

Your `.env` file already exists. Open it and ensure the following variables are properly set:

```bash
# Open .env file in your editor
notepad .env
```

**Required variables to set:**

```env
# 1Click API - REQUIRED
ONE_CLICK_JWT=your_actual_jwt_token_here

# WalletConnect - REQUIRED for frontend
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here

# Backend Server (usually defaults are fine)
API_PORT=3001
API_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Fee Configuration (optional, defaults provided)
APP_FEE_BPS=50
APP_FEE_RECIPIENT=sapphire.near
```

**Save and close** the file after making changes.

### Step 4: Build Shared Packages

The shared package contains TypeScript types used by both the API and web apps:

```bash
cd packages/shared && npm run build
```

**Expected output**: TypeScript compilation messages indicating successful build.

**Alternative method (from root):**
```bash
npm run build --filter=@sapphire/shared
```
(Note: This uses turbo and may show warnings about yarn.lock, but the first method works reliably with npm)

---

## 🏃 Running the Application

You'll need **two terminal windows** to run both the backend and frontend simultaneously.

### Terminal 1: Start Backend API

In your first terminal:

```bash
npm run dev:api
```

**Expected output:**
```
> @sapphire/api@0.1.0 dev
> ts-node-dev --respawn --transpile-only src/index.ts

[INFO] Server starting...
[INFO] Server running on http://localhost:3001
```

**Verify the API is running:**

Open a new terminal and test the health endpoint:

```bash
curl http://localhost:3001/health
```

You should see: `{"status":"ok"}`

**Keep this terminal running!** Do not close it.

---

### Terminal 2: Start Frontend (Web App)

In your second terminal:

```bash
npm run dev:web
```

**Expected output:**
```
> @sapphire/web@0.1.0 dev
> next dev

- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

**Keep this terminal running!** Do not close it.

---

## 🌐 Access Your Application

Once both services are running:

1. **Frontend (Web UI)**: http://localhost:3000
2. **Backend API**: http://localhost:3001

Open your web browser and navigate to **http://localhost:3000** to see the Sapphire swap interface.

---

## ✅ Verification Checklist

Use this checklist to ensure everything is working:

- [ ] Backend API server started successfully (Terminal 1 shows no errors)
- [ ] Backend health check responds: `curl http://localhost:3001/health`
- [ ] Frontend server started successfully (Terminal 2 shows no errors)
- [ ] Frontend accessible at http://localhost:3000
- [ ] No CORS errors in browser console (F12 → Console tab)
- [ ] Wallet connection button appears on the UI

---

## 🧪 Testing the API

### Test Available Tokens

```bash
curl http://localhost:3001/api/tokens
```

Should return a list of 119+ supported tokens across multiple chains.

### Test Quote Request

```bash
curl -X POST http://localhost:3001/api/quote ^
  -H "Content-Type: application/json" ^
  -d "{\"dry\":true,\"originAsset\":\"nep141:wrap.near\",\"destinationAsset\":\"nep141:usdc.near\",\"amount\":\"1000000000000000000\",\"recipient\":\"example.near\",\"refundTo\":\"example.near\",\"swapType\":\"EXACT_INPUT\",\"slippageTolerance\":100}"
```

Should return a quote with deposit address and estimated amounts.

---

## 📊 What's Running

When both services are active, here's what you have:

### Backend API (Port 3001)
- Express server
- 1Click SDK integration
- API endpoints:
  - `GET /health` - Health check
  - `GET /api/tokens` - Supported tokens
  - `POST /api/quote` - Request swap quote
  - `POST /api/deposit/submit` - Submit deposit transaction
  - `GET /api/status/:depositAddress` - Check swap status

### Frontend Web App (Port 3000)
- Next.js application
- Multi-chain wallet support:
  - EVM chains (MetaMask, WalletConnect)
  - Solana (Phantom, Solflare)
  - NEAR (NEAR Wallet, Meteor)
  - Sui (Sui Wallet)
  - Starknet (ArgentX, Braavos)
  - Stellar (Freighter)
  - TON (TonKeeper, TonHub)
  - TRON (TronLink)
  - Bitcoin (Xverse, Leather)
- Swap interface
- Transaction status tracking

---

## 🛑 Stopping the Application

To stop the services:

1. In **Terminal 1** (Backend): Press `Ctrl + C`
2. In **Terminal 2** (Frontend): Press `Ctrl + C`

---

## 🔧 Troubleshooting

### Issue: Port Already in Use

**Error**: `Port 3001 (or 3000) is already in use`

**Solution**:
```bash
# Find what's using the port
netstat -ano | findstr :3001
# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue: Module Not Found Errors

**Error**: `Cannot find module '@sapphire/shared'`

**Solution**:
```bash
# Rebuild shared package
npm run build --filter=@sapphire/shared
# Restart the affected service
```

### Issue: TypeScript Compilation Errors

**Solution**:
```bash
# Clean and rebuild
npm run clean
npm install --legacy-peer-deps
npm run build --filter=@sapphire/shared
```

### Issue: CORS Errors in Browser

**Error**: Browser console shows CORS errors

**Solution**:
- Verify `CORS_ORIGIN=http://localhost:3000` in `.env`
- Restart the backend API
- Clear browser cache (Ctrl + Shift + Delete)

### Issue: Wallet Connection Not Working

**Solution**:
- Ensure `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set in `.env`
- Install the wallet extension in your browser
- Restart the frontend

### Issue: API Returns 401 Unauthorized

**Error**: API requests fail with 401

**Solution**:
- Verify `ONE_CLICK_JWT` is correctly set in `.env`
- Check that the JWT token is valid and not expired
- Restart the backend API

---

## 📚 Additional Resources

- **Architecture Overview**: [`plans/sapphire-architecture.md`](../plans/sapphire-architecture.md)
- **API Testing Guide**: [`docs/API_TESTING.md`](./API_TESTING.md)
- **Database Setup**: [`docs/DATABASE_SETUP.md`](./DATABASE_SETUP.md) (for production)
- **Troubleshooting Guide**: [`docs/TROUBLESHOOTING.md`](./TROUBLESHOOTING.md)
- **NEAR Intents Documentation**: https://docs.near-intents.org
- **Partners Portal**: https://partners.near-intents.org

---

## 🎯 Next Steps

Once your local environment is running:

1. **Test wallet connections** with different chains
2. **Perform test swaps** using testnet tokens
3. **Monitor console logs** in both terminals for debugging
4. **Check browser console** (F12) for frontend errors
5. **Review documentation** for advanced features

---

## 💡 Quick Reference Commands

```bash
# Full restart
npm run dev:api     # Terminal 1
npm run dev:web     # Terminal 2

# Health check
curl http://localhost:3001/health

# View logs
# Backend: Check Terminal 1
# Frontend: Check Terminal 2
# Browser: Press F12 → Console tab

# Rebuild everything
npm run clean
npm install --legacy-peer-deps
npm run build --filter=@sapphire/shared
```

---

**Need help?** Check the troubleshooting section above or review the documentation in the `docs/` directory.

**Happy swapping! 🚀**
