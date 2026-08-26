# ScanEase Admin

A **separate, standalone** Next.js app for managing ScanEase — not a section of the customer
site. Deploy it independently (its own domain/subdomain, its own hosting, its own access
rules) while it talks to the same backend API as the customer-facing site.

## Three separate projects, one backend

```
scanease/          the customer-facing site (customers browse, book, pay)
scanease-admin/     ← you are here — internal tool for your team
scanease-backend/   the Express + PostgreSQL API both frontends call
```

Both frontends are independent Next.js apps that call the same backend over HTTP. Neither
frontend talks to the database directly, and neither frontend depends on the other being
deployed anywhere in particular — you could host `scanease-admin` on a private subdomain
behind a VPN while `scanease` is fully public, for example.

## Setup

```bash
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL — point this at your backend
npm install
npm run dev                         # runs on http://localhost:3001 (not 3000 —
                                     # avoids clashing if you're also running the
                                     # customer site locally at the same time)
```

Make sure `scanease-backend` is running first (see its own README). Its `.env`'s
`FRONTEND_URL` already defaults to allowing both `http://localhost:3000` (the customer site)
and `http://localhost:3001` (this app) — if you deploy either to a real domain, update
`FRONTEND_URL` to a comma-separated list of both real URLs.

## Logging in

There's no self-registration here on purpose. Admin accounts are created the normal way —
register on the customer site — then promoted from the backend:

```bash
cd scanease-backend
npm run make-admin -- <phone-number>
```

Log in on this app with that phone number and password. Non-admin accounts, and anyone not
logged in, are redirected/blocked with a clear message — but that's just UX. The real
security boundary is the backend: every `/api/admin/*` endpoint independently checks
`is_admin = true` via the `requireAdmin` middleware, so even a direct API call without this
frontend can't get in without a real admin token.

## What's here

- **`/dashboard`** — total/pending/assigned/completed bookings, today's count, revenue, and
  bookings-per-center at a glance.
- **`/bookings`** — every booking across all customers. Assign or reassign one to a
  diagnostic center (flips status `Pending` -> `Assigned`), adjust priority, change status,
  and — for bookings that include a pathology test — track sample status (Pending Collection
  through Report Ready). Response time ticks live for pending bookings and freezes once
  assigned. Auto-refreshes every 10 seconds.
- **`/tracker`** — a daily heatmap grid showing how many bookings were created per
  diagnostic center, per day, for a chosen month — mirrors a typical ops "monthly report"
  view. Bookings not yet assigned to any center show up under "Unassigned."
- **`/leads`** — every submission from the customer site's contact form. Update status
  (New / Contacted / Converted / Closed), and click "Create booking" to open a form
  pre-filled with the lead's name and phone — pick tests from the live catalog, a date and
  slot, and submit. This is the telecaller flow: no customer self-registration needed: the
  backend finds or creates the account automatically, and marks the lead Converted.
- **`/inbox`** — a two-pane chat view of every customer support conversation. Reply, mark a
  conversation closed/reopened. Polls for new messages every 8 seconds, so a customer's
  reply shows up without a manual refresh.
- **`/centers`** — create/edit/delete diagnostic centers, and set up each one's diagnostic
  portal login (staff name/phone/password) right in the same form — no separate CLI step
  needed for centers created here. Each row links to **`/centers/[id]/pricing`**, where you
  set what that specific center charges for each test — this is what the Bookings page's
  "Assign" dropdown uses to show centers cheapest-first for that booking's specific tests.
  A test with no custom price for a center just uses the catalog's normal price. This never
  changes what the customer pays — it's purely for deciding who to assign a case to.
- **`/catalog`** — create/edit/delete every scan, pathology test, and package shown on the
  customer site.
- **`/body-parts`**, **`/concerns`** — the categories that power "Browse by body part" and
  "Browse by health concern" on the customer site.
- **`/hero-slides`** — the homepage hero carousel slides.

The five simpler CRUD sections (centers, catalog, body-parts, concerns, hero-slides) are
built on one shared component, `components/AdminCrudTable.tsx` — add a new admin section by
giving it a column/field config, not by rewriting a table+form from scratch. Bookings,
Tracker, Leads, and Inbox have their own dedicated pages since their interactions (assign,
report grid, convert-to-booking, chat) don't fit that generic pattern.

## Project structure

```
app/
  layout.tsx        Root layout — AuthProvider + AppShell
  page.tsx          Redirects to /bookings
  login/page.tsx     Phone + password, no registration
  bookings/page.tsx  The assignment workflow
  centers/, catalog/, body-parts/, concerns/, hero-slides/   CRUD pages
components/
  AppShell.tsx        Login/dashboard layout switch + the auth/admin gate
  Sidebar.tsx          Left nav
  AdminCrudTable.tsx   Shared table + form-modal used by every CRUD page
lib/
  api.ts              Every backend call this app makes (auth + all /api/admin/* endpoints)
  auth-context.tsx     JWT stored in localStorage under a different key than the customer
                        site (scanease_admin_token vs scanease_token), so logging into
                        one doesn't affect the other even in the same browser
  types.ts, catalog.ts  Shared types + the fmtPrice/offPct helpers
```

## Notes on scope

- No audit log of who changed what — every admin action just overwrites the row. Worth
  adding (updated_by, updated_at columns, or a separate audit table) before this is used
  by more than one or two trusted people.
- No pagination on the bookings/catalog tables — fine at current scale, will need it once
  you have hundreds of bookings.
- No image upload for hero slides — illustrations are chosen from a fixed set of keys that
  match the frontend's HeroIllustrations.tsx. Adding a truly custom slide image would need
  file upload support added to the backend.
