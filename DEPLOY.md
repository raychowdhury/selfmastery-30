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

## 5. A custom domain (optional)

`.vercel.app` is already yours and is enough to launch — Apple accepts it for
the support and privacy URLs, and step 6(a) does not need a domain at all.

**The free-subdomain services do not fit this project.** `is-a.dev` forbids
commercial and for-profit use, forbids root subdomains sitting behind a login
page, and explicitly forbids AI-generated pull requests; `js.org` is for
JavaScript project pages and is `CNAME`-only. Read a service's terms before
registering — having a domain pulled after the App Store listing points at it
is a worse problem than not having one.

Two options that do fit:

- **Buy one.** ~$10–15/year for a `.com` at
  [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/), which
  sells at cost. Watch renewal pricing elsewhere — a $2 first year often renews
  at $12. This also fills the `[YOUR-DOMAIN]` placeholders in the App Store
  metadata and gives the legal pages a real contact address.
- **[`eu.org`](https://nic.eu.org/)** — genuinely free and permanent, but
  approval is manual and takes weeks. Delegate `NS` to Cloudflare afterwards
  for full record control.

Once you have one: add it in Vercel under **Settings → Domains**, follow the
records it shows, then set `NEXT_PUBLIC_SITE_URL` and redeploy.

## 6. Transactional email (10 minutes, free, no domain)

Without this, password reset returns a clear 503 and is unavailable. The app
does not pretend to send. But a locked-out person has no way back in, and App
Review will tap "Forgot password" and find an error.

Two transports are supported. **Gmail needs no domain and is free** — start
there. Move to Resend if you later buy a domain.

### (a) Gmail over SMTP — free, no domain

Mail goes out through Google from a `@gmail.com` address you own, so SPF and
DKIM align with the From header and DMARC passes. This is the one place a
`@gmail.com` sender is legitimate: send the same From address through anyone
*other* than Google and it is spoofing, which lands in spam.

1. **Make a separate Gmail account for the app.** Not your personal one.
   Google suspends accounts whose sending looks automated, and you do not want
   that to take your own mail down with it.
2. Enable **2-Step Verification** on it. App Passwords do not exist without it.
3. [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   → create one, name it `SelfMastery`. You get 16 characters. Copy it now.
4. In Vercel: **Settings → Environment Variables**, add five, then redeploy.

```
MAIL_FROM=SelfMastery <selfmastery.app@gmail.com>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=selfmastery.app@gmail.com
SMTP_PASSWORD=<the 16-character App Password>
```

An App Password is a credential with full send rights on that mailbox. It goes
in Vercel's environment, never in the repository, and never in a commit.

**Limits.** ~500 recipients a day, which is far above what password resets for
a launching app need. Gmail is not built for bulk sending — if this app ever
sends anything other than transactional mail, move to (b) first.

### (b) Resend — once you own a domain

Better deliverability and a sender at your own domain. Free tier is 3,000
emails a month with no card, but the free tier requires **one verified domain**
— there is no way around that, and the shared `onboarding@resend.dev` sender
only delivers to your own signup address.

1. [resend.com](https://resend.com) → **Domains → Add Domain**. Use a sending
   subdomain, e.g. `send.your-domain`, to keep sending reputation separate.
2. Add the DNS records it shows (a DKIM `TXT`, plus `MX` and `TXT`). Wait for
   verification.
3. **API Keys → Create API Key**, permission **Sending access**. Starts `re_`,
   shown once.
4. Set `RESEND_API_KEY` and point `MAIL_FROM` at the verified domain. Resend
   takes precedence over the SMTP variables, so you can leave those in place.

> **Free subdomain services do not work for this.** `is-a.dev` and similar
> forbid commercial use in their terms, and `js.org` is `CNAME`-only, which
> cannot coexist with the `MX` and `TXT` records email verification needs.

### Verify either one

```bash
curl -s https://your-domain/api/mobile/v1/health | grep -A1 '"email"'
```

`"email": true` means configured, and the note names which transport is live.
The smoke test then asserts a 200 from forgot-password instead of a 503:

```bash
API_BASE=https://your-domain ./scripts/mobile-api-smoke.sh
```

Then actually send yourself one. Request a reset for an account you own and
confirm the mail arrives — **and check the spam folder**. A reset sitting in
spam is the same as no reset at all.

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
- **Password reset needs step 6.** Until a mail transport is configured, the
  endpoint returns 503 and says so; a forgotten password means a new account.
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
