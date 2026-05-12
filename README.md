# Create or Consume

Personal daily accountability tracker. Every night at 10pm you get an SMS: "Create or Consume today?" Reply C or X. Logged. Streak shown. Miss it? Auto-logged as Consume.

---

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind)
- **Supabase** (Postgres)
- **Twilio** (SMS)
- **Vercel** (hosting + cron jobs)

---

## 1. Supabase Setup

### Create a new Supabase project

Go to [https://supabase.com](https://supabase.com) → New project.

### Run SQL

Open the SQL Editor and run:

```sql
create table entries (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  choice text not null check (choice in ('create', 'consume')),
  why_word text,
  created_at timestamptz default now(),
  auto_logged boolean default false
);

create table tokens (
  token text primary key,
  date date not null,
  used boolean default false,
  expires_at timestamptz not null
);

create table settings (
  id int primary key default 1,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  phone text not null,
  last_summary_sent date,
  constraint single_row check (id = 1)
);
```

### Insert your settings row (replace phone number)

```sql
insert into settings (id, timezone, phone)
values (1, 'America/Argentina/Buenos_Aires', '+1XXXXXXXXXX');
```

Use E.164 format for the phone: `+54911XXXXXXXX` for Argentina, etc.

---

## 2. Environment Variables

Add all of these in **Vercel → Project → Settings → Environment Variables** (all environments):

| Variable | Where to find it |
|---|---|
| `SUPABASE_URL` | Supabase → Project → Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Project → Settings → API → service_role key |
| `TWILIO_SID` | Twilio Console → Account SID |
| `TWILIO_AUTH` | Twilio Console → Auth Token |
| `TWILIO_FROM` | Your Twilio phone number (E.164, e.g. `+15005550006`) |
| `MY_PHONE` | Your personal phone number (E.164) — used only if you hardcode it |
| `ACCESS_PASSWORD` | Any string — used to log into the web UI |
| `COOKIE_SECRET` | A random 32+ char string (run: `openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | Your production URL, e.g. `https://honest.edmundzheng.com` |
| `CRON_SECRET` | A random secret Vercel passes to cron routes as Bearer token |

> **CRON_SECRET**: Vercel automatically injects this for cron jobs. Generate a random string in Vercel's environment settings and also add it to the env vars with key `CRON_SECRET`.

---

## 3. Twilio Webhook Configuration

1. Go to Twilio Console → Phone Numbers → Manage → Active Numbers
2. Click your number
3. Under **Messaging** → **A message comes in**, set:
   - **Webhook**: `https://honest.edmundzheng.com/api/sms/inbound`
   - **Method**: `HTTP POST`
4. Save.

---

## 4. Testing Crons Manually with curl

Replace `YOUR_CRON_SECRET` and `YOUR_DOMAIN` in the commands below.

### Send SMS (runs at 22:00 user local time)
```bash
curl -X POST https://YOUR_DOMAIN/api/cron/send-sms \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Auto-default consume (runs at 00:05)
```bash
curl -X POST https://YOUR_DOMAIN/api/cron/auto-default \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Weekly summary (runs Sunday 20:00)
```bash
curl -X POST https://YOUR_DOMAIN/api/cron/weekly-summary \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

> All three return JSON. Check the `skipped` key — if true, the local time condition wasn't met.

---

## 5. Custom Domain: honest.edmundzheng.com

### In Vercel

1. Vercel → Project → Settings → Domains
2. Add `honest.edmundzheng.com`
3. Vercel will show you a CNAME or A record to add

### DNS Record

In your DNS provider (wherever `edmundzheng.com` is managed):

| Type | Name | Value |
|---|---|---|
| `CNAME` | `honest` | `cname.vercel-dns.com` |

Or if your DNS doesn't support CNAME at subdomain, use the A record Vercel provides (76.76.21.21 is common but verify in your Vercel dashboard).

Propagation can take a few minutes. Vercel auto-provisions SSL.

---

## 6. Seeding a First Entry to Test the Flow

### Option A: Direct SQL in Supabase

```sql
insert into entries (date, choice, why_word)
values (current_date, 'create', 'test');
```

### Option B: curl the log API directly

First, create a token:
```sql
insert into tokens (token, date, used, expires_at)
values (
  'testtoken123456789012345678901234',
  current_date,
  false,
  now() + interval '2 hours'
);
```

Then open `https://your-domain/log/testtoken123456789012345678901234` in a browser and tap a button.

### Option C: Simulate an SMS reply

```bash
curl -X POST https://YOUR_DOMAIN/api/sms/inbound \
  -d "Body=C" \
  -d "From=%2B1XXXXXXXXXX"
```

(URL-encode the phone number: `+` → `%2B`)

---

## 7. Project Structure

```
app/
  page.tsx                    → redirects to /calendar
  login/page.tsx              → password login
  log/[token]/
    page.tsx                  → server: validate token
    LogClient.tsx             → client: create/consume buttons
  calendar/
    page.tsx                  → server: fetch entries
    CalendarClient.tsx        → client: monthly grid
  settings/
    page.tsx                  → server: fetch stats
    SettingsClient.tsx        → client: timezone dropdown
  api/
    auth/login/route.ts       → set session cookie
    auth/logout/route.ts      → clear session cookie
    log/[token]/route.ts      → submit entry from token page
    entries/route.ts          → fetch entries by month (calendar nav)
    settings/route.ts         → update timezone
    cron/
      send-sms/route.ts       → nightly 10pm SMS
      auto-default/route.ts   → midnight auto-consume
      weekly-summary/route.ts → Sunday summary
    sms/inbound/route.ts      → Twilio webhook
    streak/route.ts           → public streak JSON
lib/
  supabase.ts                 → DB client + typed queries
  auth.ts                     → HMAC cookie helpers
  streak.ts                   → streak calculation
  twilio.ts                   → SMS send + XML response
  timezone.ts                 → timezone utilities
  token.ts                    → token generation
middleware.ts                 → auth gate (all routes except public ones)
vercel.json                   → cron schedule
```

---

## Local Development

```bash
npm install
cp .env.example .env.local
# fill in .env.local
npm run dev
```

The app runs on `http://localhost:3000`. Crons won't fire locally; test them with curl against your Vercel preview URL.
