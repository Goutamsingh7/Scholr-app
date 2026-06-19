# 🎓 Scholr — Production-Ready Setup

## One-time setup (Windows)
```cmd
cd scholr
npm install
copy .env.example .env.local
notepad .env.local
npx prisma db push
npm run dev
```

Visit → **http://localhost:3000**

---

## Environment Variables

Edit `.env.local` with the following:

```env
# PostgreSQL (FREE at neon.tech — copy connection string)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Auth secret (any 32+ char random string)
# Windows PS:  [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
# Mac/Linux:   openssl rand -base64 32
NEXTAUTH_SECRET="paste-random-string-here"
NEXTAUTH_URL="http://localhost:3000"

# Anthropic Claude API (console.anthropic.com → API Keys)
ANTHROPIC_API_KEY="sk-ant-api03-..."

# Google OAuth (console.cloud.google.com → Credentials)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Razorpay payments (dashboard.razorpay.com → Settings → API Keys)
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Getting API Keys

| Service | Steps |
|---------|-------|
| **Neon (DB)** | neon.tech → New Project → Connection String → paste as DATABASE_URL |
| **Anthropic** | console.anthropic.com → API Keys → Create → paste as ANTHROPIC_API_KEY |
| **Google OAuth** | console.cloud.google.com → APIs & Services → Credentials → OAuth Client ID (Web) → Add redirect: `http://localhost:3000/api/auth/callback/google` |
| **Razorpay** | dashboard.razorpay.com → Settings → API Keys → Generate Test Key |

---

## Vercel Deployment

```bash
npm install -g vercel
vercel login
vercel deploy --prod
```

Then in **Vercel Dashboard → Settings → Environment Variables**, copy all your `.env.local` values.

**Update for production:**
- `NEXTAUTH_URL` → `https://your-app.vercel.app`
- `NEXT_PUBLIC_APP_URL` → `https://your-app.vercel.app`
- Razorpay: Switch to LIVE keys (`rzp_live_...`)
- Google OAuth: Add production redirect URI

---

## Feature Plan

| Feature | Free | Pro (₹149/sem or ₹249/yr) |
|---------|------|--------------------------|
| Manual timetable entry | ✅ | ✅ |
| Unlimited attendance tracking | ✅ | ✅ |
| Analytics + subject breakdown | ✅ | ✅ |
| Text notes on sessions | ✅ | ✅ |
| AI timetable parsing | 2 free | Unlimited |
| Photo notes | ❌ | ✅ |
| PDF export | ❌ | ✅ |
| Priority support | ❌ | ✅ |

---

## All Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run db:push` | Sync schema to database |
| `npm run db:studio` | Visual database editor |
| `npm run db:generate` | Regenerate Prisma client |

---

## Changelog v1.0.0 → v1.1.0 (this release)

- ✅ Razorpay payment integration (₹149 semester / ₹249 annual)
- ✅ Pro plan gating on AI parsing (2 free → upgrade modal)
- ✅ Pro plan gating on photo notes
- ✅ PDF attendance export (print-to-PDF via browser)
- ✅ Billing page with plan comparison + payment history
- ✅ Settings page with profile edit + password change
- ✅ Upgrade modal with Razorpay checkout flow
- ✅ Fixed attendance formula (needAttend = ceil(T×eff − present))
- ✅ Unreachable target detection
- ✅ Per-subject attendance criteria (set during timetable upload)
- ✅ Dedicated Notes page (subject → month → date hierarchy)
- ✅ Session modal centered correctly on all screen sizes
- ✅ Notes fetch fresh from DB on every open
- ✅ AI maintenance message + auto-switch to Manual Entry
- ✅ SEO metadata on all pages
- ✅ Route protection middleware
- ✅ 404 page
- ✅ Dashboard loading skeletons
