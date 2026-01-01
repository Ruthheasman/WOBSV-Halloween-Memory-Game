# BSV Halloween Memory Game

## Overview
A Halloween-themed memory card matching game where users can win and mint unique Halloween NFTs by logging in with HandCash. The minting costs $0.25 USD in BSV.

## Recent Changes
- **January 2026**: Updated HandCash authentication flow to use client-generated key pairs
  - Keys are now generated client-side using @noble/secp256k1
  - Private key stored in secure HTTPOnly cookie (not localStorage)
  - Public key sent to HandCash during redirect
  - Private key used as authToken for validation

## Project Architecture

### Technology Stack
- **Backend**: Node.js with Express
- **Frontend**: Vanilla JavaScript (ES Modules)
- **Authentication**: HandCash Connect with client-generated key pairs
- **NFT Minting**: HandCash Minter SDK

### Key Files
- `server.js` - Express server with auth and payment endpoints
- `public/script.js` - Game logic and authentication flow
- `public/index.html` - Main HTML page
- `public/styles.css` - Styling

### Authentication Flow
1. User clicks "Log in with HandCash" button
2. Client generates secp256k1 key pair using @noble/secp256k1
3. Client sends keys to `/auth/init` endpoint
4. Server stores privateKey in HTTPOnly cookie
5. Server redirects to `handcash.io/connect?appId=...&publicKey=...`
6. HandCash redirects back to `/auth/callback`
7. Server reads privateKey from cookie, validates with HandCash SDK
8. User is authenticated

### Environment Variables
- `HANDCASH_APP_ID` - HandCash app ID
- `HANDCASH_APP_SECRET` - HandCash app secret
- `HANDCASH_ACCESS_TOKEN` - Token for NFT minting

### Endpoints
- `POST /auth/init` - Initialize auth, store keys, return redirect URL
- `GET /auth/callback` - Handle HandCash callback, validate auth
- `GET /pay` - Create payment request for NFT minting
- `POST /payment/webhook` - Handle payment webhook, mint NFT

## User Preferences
- Callback URL must remain: https://bsv-halloween-snap-game.replit.app/auth/callback
