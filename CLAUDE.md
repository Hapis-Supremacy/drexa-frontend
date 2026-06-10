@AGENTS.md

## Full System Architecture

The diagram below shows the complete Drexa Trading platform. **This repo is the CLIENT + NEXT.JS PAGES layers** — the Go API, data stores, infra, and deploy pipeline live in separate repos.

```
┌─────────────────────────────────────────────────────────────────────┐
│ CLIENT  ◄─── THIS REPO                                             │
│  Browser/web (Next.js — App Router)      Mobile (future, React     │
│                                          Native / PWA)             │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│ NEXT.JS PAGES  ◄─── THIS REPO                                       │
│  Auth (login · register · OTP)     KYC mocked (form · ID upload)   │
│  Dashboard (portfolio · PnL)       Market (/market/[symbol])       │
│  Trade (order form · book)         Wallet (deposit · withdraw)     │
│  Orders (history · open)           Admin (users · KYC review)      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
╔════════════════════════════════▼════════════════════════════════════╗
║ GATEWAY  [separate repo]                                           ║
║  Go API gateway                        Firebase Admin               ║
║  (JWT verify · rate limit ·            (ID token verify)           ║
║   routing · CORS)                                                   ║
╚════════════════════════════════╦════════════════════════════════════╝
                                 ║
┌────────────────────────────────▼────────────────────────────────────┐
│ GO BACKEND — CLEAN ARCHITECTURE  [separate repo]                    │
│  Auth (JWT · bcrypt · OTP)         KYC (mocked · status flag)      │
│  User (profile · security)         Market data (prices · WebSocket)│
│  Order (limit · market · book)     Wallet (balance · tx history)   │
│  Payment (Stripe · fiat on/off)    Notification (Twilio · SendGrid)│
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│ DATA  [separate repo]                                               │
│  MySQL                    Redis                    Firebase         │
│  (users · orders ·        (OTP · sessions ·        (identity ·     │
│   wallets · kyc)           rate limit)              auth state)    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│ INFRA — GOOGLE CLOUD PLATFORM (GKE Cluster)  [separate repo]       │
│  Go pods (HPA · rolling deploy)     MySQL pod (PersistentVolume)   │
│  Redis pod (in-memory · sidecar)    Nginx ingress (TLS · LB)       │
│  K8s Secrets (DB creds · API keys)  Cloud Storage (KYC · avatars)  │
│  Cloud CDN (static assets)          Cloud Monitoring (logs/alerts) │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│ DEPLOY — GitHub Actions · Docker · Kubernetes  [separate repo]     │
│  GitHub (monorepo · PRs)                                           │
│  → Actions CI (test · lint · build)                                │
│  → Docker build (image → GCR)                                      │
│  → kubectl apply (rolling update)                                  │
│  Environments: dev (local · hot reload) | staging (auto on PR) |   │
│                production (main branch · GKE)                      │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────┐
│ EXTERNAL SERVICES                                                   │
│  Stripe (deposit · withdrawal)     Twilio (SMS OTP · alerts)       │
│  SendGrid (email verify · notify)  Market data API (CoinGecko /    │
│                                    Binance)                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) — see AGENTS.md for version caveats |
| Language | TypeScript 5 |
| UI primitives | shadcn/ui (Radix UI v1) + Tailwind CSS v4 |
| Icons | lucide-react |
| Animation | Motion (Framer Motion successor) |
| Forms | react-hook-form v7 + zod v4 |
| Auth | Firebase v12 (client-side identity only — token sent to Go gateway) |
| Date utils | date-fns v4 |

## Project Structure

The repo uses **feature-based Clean Architecture** — each feature owns its domain logic and presentation layer. Pages in `app/` are thin shells that import from `features/`.

```
app/                        # Next.js App Router pages (thin shells)
  login/                    # → features/auth
  register/                 # multi-step: details → identity → face → pin → complete
  forgot_password/
  home/                     # → features/home
  markets/[sym]/            # → features/markets
  orders/                   # → features/orders
  portfolio/                # → features/portfolio
  trade/                    # → features/trade
  wallet/                   # → features/wallet

features/
  auth/
    domain/                 # types, use-cases, repo interfaces
    presentation/           # React components, hooks
  core/
    domain/
    presentation/
    store/                  # firebase.ts — Firebase app init
  home/presentation/
  markets/presentation/
  orders/presentation/
  portfolio/presentation/
  trade/presentation/
  wallet/
    domain/
    presentation/

components/ui/              # shadcn/ui generated components (do not edit manually)
lib/utils.ts                # cn() helper (clsx + tailwind-merge)
public/                     # Static assets (logo, icons, SVGs)
```

## Key Conventions

- **Pages are thin** — `app/**/page.tsx` should only import and render the feature's root component. Business logic belongs in `features/`.
- **Domain vs Presentation** — `domain/` holds types, interfaces, and use-case logic with no React imports. `presentation/` holds components and hooks.
- **Firebase is auth-only** — Firebase is used exclusively for identity (ID token). All other data goes through the Go API gateway. Do not use Firestore or Realtime Database.
- **Forms** — use react-hook-form + zod. Define schemas in the feature's `domain/` layer.
- **Styling** — Tailwind CSS v4 utility classes only. Use `cn()` from `lib/utils.ts` for conditional classes. Do not write custom CSS outside `app/globals.css`.
- **shadcn components** — live in `components/ui/`. Add new ones with `npx shadcn add <component>`, do not hand-edit generated files.
- **Environment variables** — see `.env-example` for the full list. The only `NEXT_PUBLIC_*` vars are Firebase config and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Backend secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Twilio, SendGrid keys) never appear in this repo.

## Authentication Flow

1. User logs in via Firebase (email/password or Google OAuth).
2. Firebase returns an **ID token**.
3. The ID token is attached as a `Bearer` header on every request to the Go API gateway.
4. The gateway calls Firebase Admin to verify the token, then issues its own JWT for downstream services.
5. The frontend never stores or manages JWTs directly — only the Firebase session state.

## KYC Flow (mocked)

The multi-step register flow (`/register/*`) collects user details, identity document upload, facial verification, and PIN setup. These steps are currently mocked on the frontend — no real ID verification service is wired up yet.

## External Services

### Stripe — Deposits & Wallet

**Frontend integration point:** `features/wallet/presentation/pages/wallet_page.tsx` → `DepositPanel`

**Packages (install before implementing):**
```
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Frontend env var:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_test_*` dev, `pk_live_*` prod)
**Backend-only (never in this repo):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**Endpoints (from Go routes.go):**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/payments/deposit/intent` | JWT | Returns `clientSecret` for Stripe.js |
| `POST` | `/api/v1/payments/webhook` | Public (sig-verified) | Stripe webhook — never call from frontend |
| `POST` | `/api/v1/payments/withdraw` | JWT | Debit wallet (crypto withdraw) |
| `GET` | `/api/v1/wallet/balance` | JWT | Current balance in **cents** |
| `GET` | `/api/v1/wallet/transactions` | JWT | Paginated transaction history |

**PaymentIntent flow:**
```
User picks amount in DepositPanel
  → POST /api/v1/payments/deposit/intent  { amount: number (cents), currency: "usd" }
  ← { clientSecret: "pi_xxx_secret_xxx" }

// Module level — never inside a component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

<Elements stripe={stripePromise} options={{ clientSecret }}>
  <PaymentElement />
  <button onClick={() => stripe.confirmPayment({
    elements,
    confirmParams: { return_url: `${origin}/wallet` }
  })} />
</Elements>

Stripe redirects → /wallet?payment_intent_client_secret=xxx
  → stripe.retrievePaymentIntent(clientSecret)
  ← { status: "succeeded" | "processing" | "requires_payment_method" }

Backend webhook (POST /api/v1/payments/webhook) credits the wallet — frontend never calls it
```

**Rules:**
- `loadStripe()` must be called at **module level**, outside any React component
- `useStripe()` and `useElements()` only work inside an `<Elements>` subtree
- All amounts are **cents** (integer). Divide by 100 for display (`12345` → `$123.45`)
- Error types: `"card_error"` (card declined), `"validation_error"` (form invalid)

---

### Twilio Verify — SMS OTP

**Frontend integration point:** `features/auth/presentation/pages/email_verification_page.tsx`

**No frontend SDK or env vars** — all Twilio calls are made by the Go backend.

**Endpoints:**

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Creates account + triggers Twilio OTP SMS |
| `POST` | `/api/v1/auth/verify-email` | Public | Submits OTP code |
| `POST` | `/api/v1/auth/resend-otp` | Public | Re-sends OTP |

**OTP flow:**
```
POST /api/v1/auth/register { email, password }
  ← backend calls Twilio Verify → SMS sent to user's phone
  ← { message: "OTP sent" }
  → store pending_email in localStorage, route to email_verification_page

User enters 4-digit code
POST /api/v1/auth/verify-email { email, otp }
  ← { status: "approved" } → route to /register/details
  ← { status: "pending"  } → show "Invalid code" error
  ← { status: "canceled" } → OTP expired, prompt resend

POST /api/v1/auth/resend-otp { email }
  ← { message: "OTP resent" }
```

**Twilio status values:** `"approved"` (correct), `"pending"` (wrong), `"canceled"` (expired)

**Rules:**
- OTP is **4 digits** (Go backend configures Twilio Verify Service with `code_length: 4`)
- The page is named "email_verification" but verifies via **SMS** — not email
- Phone number normalisation to E.164 format is done by the backend from the KYC details step

---

### CoinGecko — Market Data

**Frontend integration points:**
- `features/markets/presentation/pages/markets_page.tsx` — coin list, prices, sparklines
- `features/markets/presentation/pages/asset_page.tsx` — live price, market stats, historical chart

**API client:** `lib/coingecko.ts` — all CoinGecko calls go through here.

**Optional env var:** `NEXT_PUBLIC_COINGECKO_API_KEY` — free Demo key from coingecko.com/api. Without it the public API still works but is rate-limited at ~30 req/min. With a key, the `x-cg-demo-api-key` header is added automatically.

**Symbol → CoinGecko ID mapping** (defined in `lib/coingecko.ts`):
```
BTC → bitcoin  |  ETH → ethereum  |  SOL → solana
BNB → binancecoin  |  XRP → ripple  |  ADA → cardano
AVAX → avalanche-2  |  LINK → chainlink  |  DOGE → dogecoin
```

**Endpoints used:**

| Function | Endpoint | Used by |
|---|---|---|
| `fetchMarkets()` | `GET /coins/markets?sparkline=true` | markets_page (list), asset_page (live price) |
| `fetchChartData(sym, range)` | `GET /coins/{id}/market_chart?days=N` | asset_page (AreaChart) |

**Chart range → CoinGecko `days` + auto-granularity:**

| Range | `days` | CoinGecko granularity | Points |
|---|---|---|---|
| 1H | 1 | 5-min intervals | last 12 of ~288 |
| 1D | 1 | 5-min intervals | ~288 |
| 1W | 7 | hourly | ~168 |
| 1M | 30 | hourly | ~720 |
| 1Y | 365 | daily | ~365 |

**Data flow:**
```
fetchMarkets() → CgMarketCoin[] → cgToCoinData() → CoinData[]
                                                     ↓
                                    setCoins(data) in markets_page
                                    setCoin(live)  in asset_page

fetchChartData(sym, range) → number[] → setChartData() → <AreaChart data={chartData} />
```

**Rules:**
- Both pages use `COINS` mock data as initial state — instant paint before the fetch resolves
- On fetch error, mock data is kept silently (no error UI needed for market data)
- `Sparkline` and `AreaChart` guard against empty arrays (`data.length < 2 → return null`)
- Do not call CoinGecko endpoints directly from components — always go through `lib/coingecko.ts`

---

### SendGrid — Transactional Email

**Frontend integration point:** `features/auth/presentation/pages/forgot_password_page.tsx`

**No frontend SDK or env vars** — all SendGrid calls are made by the Go backend.

**Email-triggered endpoints:**

| User Action | Frontend Calls | Email Sent |
|---|---|---|
| Forgot password | `POST /api/v1/auth/forgot-password { email }` | Password reset link |
| Password reset | `POST /api/v1/auth/reset-password { token, newPassword }` | Confirmation |
| KYC submitted | automatic after PIN step | "Under review" notice |
| KYC approved/rejected | — (backend webhook) | Status update |
| Withdrawal | — (backend event) | Transaction receipt |

**Rules:**
- Frontend never imports or calls SendGrid
- After `POST /api/v1/auth/forgot-password`, show `"Check your inbox for a reset link"` — do not poll
- Reset link contains a single-use short-lived token; read via `useSearchParams()` and pass in `POST /api/v1/auth/reset-password`
- All template variables (`{{name}}`, `{{reset_link}}`) are filled server-side by the Go backend
