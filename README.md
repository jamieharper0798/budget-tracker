# Ledgerly — Bills & Savings Tracker

> This repo also hosts **Momentum**, a habit tracker that uses the same login. See [`habits/README.md`](./habits/README.md).

A personal bills & savings dashboard: what's due, what's left over each month, and how your savings goals are coming along. Everything is entered manually — there's no bank connection.

## Features

- **Overview dashboard** — a monthly "left over after bills & savings" summary, a paid/unpaid ring for the bills still owed this month, next-due and total-saved stat cards, a category breakdown donut, an upcoming-payments list, savings pots with progress rings, and a savings growth chart with a recent-deposits log
- Enter your income (any frequency) and see what's left over each month after bills and planned savings contributions
- Add subscriptions and bills with amount, frequency, account, category, and notes; flexible billing cycles (weekly, every 2 weeks, monthly, every 3 months, yearly, or a custom number of days)
- Mark bills paid/unpaid per month, with overdue highlighting, and step through past/future months
- Manage accounts (e.g. "Chase Checking", "Amex") with color tags, and categories with emoji + color
- Pause/resume a bill without deleting it
- Create savings pots with a goal, target date, and monthly contribution; log deposits against any pot
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
