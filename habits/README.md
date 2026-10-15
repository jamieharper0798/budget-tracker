# Momentum — Habit Tracker

A mobile-first habit tracker built for that "one more check-in" feeling. It uses the same Firebase project as Ledger, so one account logs into both apps.

Live (after deploy): https://jamieharper0798.github.io/budget-tracker/habits/

## Features

- **Login**: email/password or Google, password reset, and live sync across devices (Firestore, works offline)
- **Today view**: a daily progress ring, XP/level bar, a 7-day strip you can tap to log past days, and habits grouped by morning / midday / evening / anytime
- **Flexible habits**: every day, specific weekdays, or X times per week; counted goals (e.g. 8 glasses of water); emoji + gradient color
- **Rewards**: confetti bursts, chimes that climb in pitch as you go, haptics, a floating "+10 XP", a full-screen moment for perfect days and level-ups, and 15 unlockable badges
- **Streaks**: per-habit streaks (skips protect a streak), perfect-day streaks, and best streaks
- **Stats**: totals, a last-7-days chart, an 18-week heatmap, and a 30-day completion rate per habit
- **Habit detail**: a month calendar you can tap to backfill, plus skip, edit, reorder, archive and delete
- **Installable PWA** with an in-app install prompt and update toast; respects reduced-motion

## One-time setup

1. **Firestore rules** — publish the updated [`../firestore.rules`](../firestore.rules) (Firebase console → Firestore → Rules, or `firebase deploy --only firestore:rules`). It adds the `habits/{uid}` collection. Until you do, the app shows a "not syncing yet" banner.
2. **Google sign-in (optional)** — Firebase console → Authentication → Sign-in method → enable **Google**. Email/password works without this.

## Develop

```bash
cd habits
npm install
npm run dev
```

The GitHub Pages workflow builds this app into `dist/habits/` next to Ledger. Icons: `npm install -D sharp && node scripts/gen-icons.mjs`.
