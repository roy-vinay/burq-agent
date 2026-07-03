# Pulse AI — Provider Selection Agent

A real-time delivery provider selection agent for last-mile delivery. Demonstrates multi-step AI reasoning for optimal provider assignment across cost, reliability, coverage, and order-specific requirements.

## What it does

Takes an incoming order (pre-filled with a Safeway pharmacy scenario) and reasons through 5 steps to select the optimal delivery provider from a network of 6 providers — eliminating unqualified candidates, evaluating fit, ranking options, and delivering a final recommendation with cost and reliability estimates.

## Deploy to Vercel

1. Push this repo to GitHub
2. Import into Vercel
3. Add environment variable: `ANTHROPIC_API_KEY` = your Anthropic API key
4. Deploy

## Run locally

```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000
