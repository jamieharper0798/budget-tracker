# Ledger — Budget & Bill Tracker

Track every subscription and recurring bill in one place: what it costs, which account it's paid from, when it's due, and how it adds up.

## Features

- Enter your income (any frequency) and see what's left over each month after all active bills
- Add subscriptions and bills with amount, frequency, account, category, and notes
- Flexible billing cycles: weekly, every 2 weeks, monthly, every 3 months, yearly, or a custom number of days — the app computes each bill's next due date automatically
- Dashboard with monthly total, yearly total, what's due in the next 7 days, and active bill count
- Upcoming payments list for the next 30 days, with overdue and due-soon highlighting
- Spend breakdowns by category and by account (with normalized monthly cost, regardless of billing frequency)
- Manage accounts (e.g. "Chase Checking", "Amex") with color tags — add one inline while creating a bill, or manage them fully from the accounts screen
- Built-in categories (Streaming, Software, Utilities, Insurance, etc.) plus your own custom categories with emoji + color
- Pause/resume a bill without deleting it (e.g. a paused gym membership), and it drops out of totals while you decide
- Search and filter by status, account, and category
- Currency symbol picker ($, £, €, ¥, ₹, A$, C$)
- Log in with email/password and your data syncs live across every device — powered by Firebase Auth + Firestore, with offline support (Firestore's local cache keeps the app usable offline and syncs once back online)
- Installable PWA: manifest, offline-capable service worker, an in-app "Install App" button, and an update toast when a new version is deployed

## Getting started

```bash
npm install
npm run dev
```

Without a configured Firebase project (see below), the app shows a "Firebase isn't set up yet" screen instead of the login form.

## Login & multi-device sync (Firebase)

The app requires a free Firebase project to handle login and to store your data so it syncs across devices. One-time setup:

1. Go to the [Firebase console](https://console.firebase.google.com), create a project (the free Spark plan is enough).
2. **Build → Authentication → Get started → Sign-in method** — enable **Email/Password**.
3. **Build → Firestore Database → Create database** — any region is fine; start in production mode.
4. Open the **Rules** tab and paste in the contents of [`firestore.rules`](./firestore.rules) (restricts each account to its own data), then **Publish**. If you have the [Firebase CLI](https://firebase.google.com/docs/cli) installed, `firebase deploy --only firestore:rules` does the same thing.
5. **Project settings (gear icon) → General → Your apps → Add app → Web** (`</>` icon) — register an app (no need to set up Firebase Hosting). Copy the `firebaseConfig` object it gives you.
6. Paste those values into [`src/lib/firebaseConfig.ts`](./src/lib/firebaseConfig.ts), replacing the `YOUR_...` placeholders. These values aren't secret — they identify the project, not a credential — so it's safe to commit them.
7. Commit and push; the site redeploys automatically and the login screen goes live.

If you were already using this app before login was added, the first time you log in on the device that has your existing data, it's automatically imported into your new account.

## Scripts

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run lint` — lint with oxlint
- `npm run preview` — preview the production build

### Icons

App icons are generated from `scripts/icon.svg` / `scripts/icon-maskable.svg` via `node scripts/gen-icons.mjs` (requires `sharp`, installed on demand: `npm install -D sharp`). Output lands in `public/icons/`.

## Deployment (GitHub Pages)

`.github/workflows/deploy-pages.yml` builds this app and deploys it to GitHub Pages on every push to `main`. It sets `VITE_BASE_PATH` from the repository name so asset paths resolve correctly under `https://<owner>.github.io/<repo>/`.

One-time setup in the repo's Settings:
1. **Settings → Pages → Build and deployment → Source** — set to "GitHub Actions".

After that, every push to `main` redeploys automatically. Live at: https://jamieharper0798.github.io/budget-tracker/

To build for a different base path locally: `VITE_BASE_PATH=/your-path/ npm run build`.
