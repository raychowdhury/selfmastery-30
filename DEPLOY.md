# Deploying SelfMastery for free

This app runs permanently free on **Vercel Hobby + Neon Postgres**, with no
credit card at any step. Both are real free tiers, not trials.

| Piece | Provider | Free allowance | Card needed |
| --- | --- | --- | --- |
| App hosting | [Vercel Hobby](https://vercel.com/docs/plans/hobby) | 100 GB transfer, 1M function invocations/month | No |
| Database | [Neon](https://neon.com/) | 0.5 GB storage, 100 compute-hours/month, scales to zero | No |
| Rate limiting | [Upstash Redis](https://upstash.com/redis) | 500K commands/month, 256 MB | No |
| Domain | `*.vercel.app` | Included | No |
| Nicer domain (optional) | [is-a.dev](https://github.com/is-a-dev/register) | Free subdomain via pull request | No |

**One caveat worth knowing up front:** Vercel's Hobby plan is for
non-commercial, personal projects. Free for a public app people sign up to and
use; the moment it earns money, their terms require Pro ($20/month).

---

## 1. Create the database (3 minutes)

1. Sign up at [neon.com](https://neon.com) — GitHub sign-in, no card.
2. Create a project. Any region near your users.
3. From the dashboard, copy **two** connection strings:
   - **Pooled** (the default, host contains `-pooler`) → this becomes `DATABASE_URL`
   - **Direct** (toggle "Connection pooling" off) → this becomes `DIRECT_URL`

Both matter. The app runs through the pooler; migrations need the direct
connection, because a pooler can't run schema changes inside a transaction.

## 2. Create the rate-limit store (2 minutes)

Anonymous sign-up needs a throttle before the link goes anywhere public.
Serverless functions share no memory, so the counter has to live somewhere
shared.

1. Sign up at [upstash.com](https://upstash.com) — GitHub sign-in, no card.
2. Create a Redis database. Pick the region closest to your Vercel region.
3. Copy **`UPSTASH_REDIS_REST_URL`** and **`UPSTASH_REDIS_REST_TOKEN`** from the
   REST API section.

Current limits, set in `lib/security/rate-limit.ts`: **5 sign-ups per hour** per
IP, and **10 sign-in attempts per 15 minutes** per IP + email pair. Sign-in is
keyed by both so nobody can lock a real user out of their own account by
hammering their address from elsewhere.

If the store is unreachable the limiter allows the request rather than taking
auth down with it — a limiter outage should not be an outage.

## 3. Push the code to GitHub

```bash
gh repo create selfmastery-30 --public --source=. --remote=origin --push
```

## 4. Deploy on Vercel (5 minutes)

1. Sign up at [vercel.com](https://vercel.com) with GitHub — no card.
2. **Add New → Project**, import the repository. It detects Next.js on its own.
3. Add these environment variables (Production, Preview and Development):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** string, ending `?sslmode=require` |
   | `DIRECT_URL` | Neon **direct** string, ending `?sslmode=require` |
   | `AUTH_SECRET` | Output of `openssl rand -base64 32` |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-project>.vercel.app` |
   | `UPSTASH_REDIS_REST_URL` | From Upstash |
   | `UPSTASH_REDIS_REST_TOKEN` | From Upstash |

4. Deploy.

`vercel.json` already sets the build command to
`prisma migrate deploy && next build`, so the schema is created on the first
deploy and updated on every one after. Nothing to run by hand.

Your app is live at `https://<your-project>.vercel.app` and anyone can sign up.

> Do **not** run `npm run db:seed` against production — it deletes and rebuilds
> the demo account. The seed refuses to run with `NODE_ENV=production` unless
> `ALLOW_SEED=true`, precisely so this can't happen by accident.

## 5. A free custom domain (optional, ~1 day)

`.vercel.app` is already yours. For something like
`selfmastery.is-a.dev`:

1. In Vercel: **Settings → Domains**, add `selfmastery.is-a.dev`. Vercel shows
   you a `CNAME` target (`cname.vercel-dns.com`).
2. Fork [`is-a-dev/register`](https://github.com/is-a-dev/register).
3. Add `domains/selfmastery.json`:

   ```json
   {
     "owner": { "username": "your-github-username" },
     "records": { "CNAME": "cname.vercel-dns.com" }
   }
   ```

4. Open a pull request. Once merged it resolves within minutes.
5. Set `NEXT_PUBLIC_SITE_URL` to the new domain and redeploy.

Other free options: [`js.org`](https://github.com/js-org/js.org) (same PR
model), or [`eu.org`](https://nic.eu.org/) for an actual free domain — approval
takes weeks.

## 6. Transactional email (5 minutes + DNS wait)

Without this, password reset returns a clear 503 and is unavailable. The app
does not pretend to send. But a locked-out person has no way back in, and App
Review will tap "Forgot password" and find an error.

1. Create a [Resend](https://resend.com) account. Free tier is 3,000 emails a
   month with no card (check their pricing page for the current daily cap).
2. **Domains → Add Domain.** Use a subdomain you only send from, e.g.
   `send.your-domain` — keeps sending reputation separate from your main domain.
3. Add the DNS records Resend shows you (a DKIM `TXT`, plus `MX` and `TXT` for
   the sending subdomain) at whoever hosts your DNS. Wait for it to verify.
4. **API Keys → Create API Key**, permission **Sending access**, scoped to that
   domain. The key starts `re_` and is shown once — copy it now.
5. In Vercel: **Settings → Environment Variables**, add both, then redeploy.

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
MAIL_FROM=SelfMastery <hello@send.your-domain>
```

Verify against the deployment:

```bash
curl -s https://your-domain/api/mobile/v1/health | grep email
```

`"email": true` means configured. The smoke test then asserts a 200 from
forgot-password instead of a 503:

```bash
API_BASE=https://your-domain ./scripts/mobile-api-smoke.sh
```

**Skipping domain verification does not work.** Resend's shared test sender
`onboarding@resend.dev` only delivers to the address you signed up with, so
every other user's reset silently goes nowhere — the exact failure the 503 was
written to avoid.

---

## Staying inside the free tiers

Neon's free compute **scales to zero after 5 minutes idle**, so a quiet app
costs nothing. The first request after idling takes an extra second or so to
wake the database — normal, and invisible once there is steady traffic.

Rough capacity on free tiers: a few hundred active users. What runs out first
is Neon's 100 compute-hours, and only if the database is genuinely busy most of
the day. Storage is not a concern — a user with a finished 30-day challenge is
a few hundred kilobytes.

If you outgrow it: Neon Launch is $5/month, Vercel Pro is $20/month. Nothing in
the code changes.

## Before you share the link widely

The app is functional and safe for personal use, but a few things are worth
knowing:

- **No email verification.** Anyone can sign up with any address.
- **Password reset needs step 6.** Until `RESEND_API_KEY` and `MAIL_FROM` are
  set, the endpoint returns 503 and says so; a forgotten password means a new
  account.
- **Rate limiting is in place** (step 2) but only if you set the two Upstash
  variables. Without them the app still runs, and warns in the logs that
  sign-up is unthrottled.
- **Backups.** Neon's free plan keeps 6 hours of history. Fine for a personal
  project; not a backup strategy for other people's data.

None of these block a friends-and-family launch. All three matter if it grows.

## Alternatives, briefly

- **Netlify** — free tier, but Next.js 16 support trails Vercel's.
- **Render** — free web services sleep after 15 minutes and free Postgres
  expires after 30 days.
- **Fly.io / Railway** — both now require a card.
- **Cloudflare Workers** — cheapest at scale, but the Postgres driver here
  opens a TCP connection, which Workers only allow through Hyperdrive. It would
  work; it is more setup than this is worth.

Vercel + Neon is the shortest path that stays free and needs no card.
