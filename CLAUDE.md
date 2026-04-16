# LUCI AI DATA — Project Context

## What It Is
A B2B SaaS platform for lead generation and email verification. Two core products:
- **Luci Radar** (Lead Finder): Search 250M+ verified B2B contacts, filter by title/industry/location, export CSV
- **Luci Verifier** (Email Verifier): Bulk CSV email verification with syntax, MX, SMTP, disposable checks

Users buy credits via Razorpay to use these services. Trial credits granted on signup (10 leads, 100 verifications).

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + React Router DOM 7
- **Backend**: Supabase (PostgreSQL + Edge Functions on Deno runtime)
- **Auth**: Supabase email/password + OAuth, JWT sessions
- **Payments**: Razorpay (Indian payment gateway), HMAC-SHA256 signature verification
- **Email Verifier API**: External Railway-hosted service at `email-verifier-production-ab45.up.railway.app`
- **Icons**: Lucide React
- **Linting**: ESLint + TypeScript strict mode

## Directory Structure
```
src/
  App.tsx              # Root router
  main.tsx             # Entry point
  config.ts            # Brand constants (BrandTheme, colors)
  index.css            # Global styles

  pages/
    LandingPage.tsx         # Public marketing page
    AuthPage.tsx            # Login / Sign-up
    Dashboard.tsx           # Protected hub (view switching via ?view= param)
    LeadFinderPage.tsx      # Public product preview
    EmailVerifierPage.tsx   # Public product preview
    VerifyEmailPage.tsx     # Email confirmation
    AuthCallbackPage.tsx    # OAuth redirect handler
    ForgotPasswordPage.tsx  # Password reset

  components/
    LoginForm.tsx / SignUpForm.tsx
    ProtectedRoute.tsx
    dashboard/
      LeadFinder.tsx          # Lead search UI
      EmailVerifier.tsx       # Bulk verification UI (large ~51KB)
      billing/
        BillingView.tsx
        CreditBalanceCard.tsx
        PricingPlanSelector.tsx
        PurchaseModal.tsx
        TransactionHistory.tsx
    landing/
      EmailVerifierSimulator.tsx

  contexts/
    AuthContext.tsx     # Global user + credits state (useAuth hook)

  hooks/
    useRazorpay.ts      # Dynamic Razorpay checkout loader

  services/
    authService.ts           # Supabase auth wrapper (signUp, login, logout, reset)
    paymentService.ts        # Orders, payment verification, credit deduction, history
    emailVerifierService.ts  # Railway API wrapper (upload, poll, download)

  lib/
    supabase.ts         # Supabase client init

supabase/
  schema.sql            # DB schema (6 tables + triggers + RLS)
  functions/
    create-order/       # Edge fn: create Razorpay order
    verify-payment/     # Edge fn: verify signature + add credits
    deduct-credits/     # Edge fn: deduct service credits
    webhook/            # Edge fn: Razorpay webhook processor
```

## Routes
| Path | Component | Access |
|------|-----------|--------|
| `/` | LandingPage | Public |
| `/auth` | AuthPage | Public |
| `/verify-email` | VerifyEmailPage | Public |
| `/auth/callback` | AuthCallbackPage | Public |
| `/product/lead-finder` | LeadFinderPage | Public |
| `/product/email-verifier` | EmailVerifierPage | Public |
| `/dashboard?view=home\|lead-finder\|email-verifier\|billing` | Dashboard | Protected |

## Database Tables (all prefixed `luciAI_`)
1. `luciAI_profiles` — user profile (name, email)
2. `luciAI_credit_balances` — credit per service (lead_finder / email_verifier)
3. `luciAI_orders` — Razorpay order records
4. `luciAI_payment_transactions` — completed payment records
5. `luciAI_credit_usage_log` — audit log (purchase / deduction / refund)
6. `luciAI_webhook_events` — Razorpay webhook audit trail

RLS enabled on all user-facing tables. Trigger auto-creates profile + credit rows on signup.

## Key Patterns
- **Auth**: `useAuth()` from AuthContext; token refreshed before every edge function call
- **Credits**: Two independent pools per user; balance updated in context after purchase
- **Payment flow**: Client creates order → Razorpay modal → server verifies signature → credits added
- **Email verification jobs**: Persisted to localStorage; polled with jittered intervals (3-7s)
- **Styling**: Tailwind utility-first; brand orange `#F25912`; dark slate theme; glassmorphism effects
- **Prices**: Hardcoded in both client (display) and server (validation) — keep in sync when changing

## Environment Variables
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
RAZORPAY_TEST_MODE
RAZORPAY_TEST_KEY_ID / RAZORPAY_TEST_KEY_SECRET
RAZORPAY_LIVE_KEY_ID / RAZORPAY_LIVE_KEY_SECRET
```

## Dev Commands
```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run typecheck # TypeScript check
npm run lint      # ESLint
```

## Working Branch
Always work on `sam_dev` branch.

## Important Notes
- Never commit `.env` files
- Lead Finder pricing is USD-displayed; Email Verifier pricing is INR
- The external email verifier API (Railway) is a separate service — not Supabase
