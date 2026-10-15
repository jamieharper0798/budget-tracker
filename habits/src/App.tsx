import type { MouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Habit } from './types';
import { useAuth } from './hooks/useAuth';
import { useTracker } from './hooks/useTracker';
import type { HabitInput } from './hooks/useTracker';
import { todayKey } from './lib/dates';
import { BADGES, computeStats, dayStatus, levelTitle } from './lib/game';
import { SKIPPED, countOn, isDone } from './lib/habits';
import { colorOf } from './lib/colors';
import { burstAt, celebrate, haptic, sounds } from './lib/feedback';
import { AuthScreen } from './screens/AuthScreen';
import { TodayScreen } from './screens/TodayScreen';
import { StatsScreen } from './screens/StatsScreen';
import { BadgesScreen } from './screens/BadgesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { BottomNav } from './components/BottomNav';
import type { Tab } from './components/BottomNav';
import { Sheet } from './components/Sheet';
import { HabitForm } from './components/HabitForm';
import { HabitDetail } from './components/HabitDetail';
import { Celebration } from './components/Celebration';
import type { CelebrationEvent } from './components/Celebration';
import { UpdateToast } from './components/UpdateToast';
import { BadgeToast } from './components/BadgeToast';
import type { Badge } from './lib/game';

function Splash() {
  return (
    <div className="bg-aurora flex min-h-dvh items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-fuchsia-400" aria-label="Loading" />
    </div>
  );
}

export default function App() {
  const { user, loading, signUp, logIn, logInWithGoogle, logOut, resetPassword } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <AuthScreen onSignUp={signUp} onLogIn={logIn} onGoogle={logInWithGoogle} onResetPassword={resetPassword} />;
  return <Main key={user.uid} uid={user.uid} email={user.email} displayName={user.displayName} onLogOut={logOut} />;
}

/** Re-evaluates "today" so the app rolls over at midnight without a reload. */
function useToday(): string {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const tick = () => setToday(todayKey());
    const id = setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return today;
}

type FormState = { mode: 'new' } | { mode: 'edit'; habit: Habit } | null;

function Main({ uid, email, displayName, onLogOut }: { uid: string; email: string | null; displayName: string | null; onLogOut: () => void }) {
  const t = useTracker(uid);
  const today = useToday();
  const [day, setDay] = useState(today);
  const [tab, setTab] = useState<Tab>('today');
  const [form, setForm] = useState<FormState>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [queue, setQueue] = useState<CelebrationEvent[]>([]);
  const [badgeDot, setBadgeDot] = useState(false);
  const [toasts, setToasts] = useState<Badge[]>([]);
  const nextToast = useCallback(() => setToasts((q) => q.slice(1)), []);

  // Jump the selected day forward when the date rolls over at midnight.
  const [lastToday, setLastToday] = useState(today);
  if (lastToday !== today) {
    setLastToday(today);
    setDay(today);
  }

  const stats = useMemo(() => computeStats(t.habits, t.log, today), [t.habits, t.log, today]);
  const name = t.settings.name || displayName?.split(' ')[0] || '';
  const fx = t.settings;

  // --- Rewards: badges, level-ups and perfect days, detected from state so they also fire for backfills.
  const initialized = useRef(false);
  const prevLevel = useRef(stats.level);
  const prevPerfect = useRef<{ day: string; perfect: boolean } | null>(null);
  const { ready, badges, awardBadges } = t;

  useEffect(() => {
    if (!ready) return;
    const perfect = dayStatus(t.habits, t.log, day).perfect;
    const newBadges = BADGES.filter((b) => b.earned(stats) && !badges[b.id]);
    if (newBadges.length) awardBadges(newBadges.map((b) => b.id));

    if (initialized.current) {
      const events: CelebrationEvent[] = [];
      if (prevPerfect.current?.day === day && !prevPerfect.current.perfect && perfect) {
        events.push({ kind: 'perfect', streak: stats.perfectStreak });
      }
      if (stats.level > prevLevel.current) events.push({ kind: 'level', level: stats.level, title: levelTitle(stats.level) });
      if (newBadges.length) {
        setBadgeDot(true);
        setToasts((q) => [...q, ...newBadges]);
        if (!events.length) {
          if (fx.sound) sounds.complete(4);
          if (fx.haptics) haptic([20, 50, 20]);
        }
      }
      if (events.length) {
        setTimeout(() => {
          celebrate();
          if (fx.sound) sounds.fanfare();
          if (fx.haptics) haptic([30, 60, 30, 60, 80]);
          setQueue((q) => [...q, ...events]);
        }, 450);
      }
    }
    initialized.current = true;
    prevLevel.current = stats.level;
    prevPerfect.current = { day, perfect };
  }, [ready, stats, day, t.habits, t.log, badges, awardBadges, fx.sound, fx.haptics]);

  // --- Check-in interactions
  const doneCountToday = useCallback(
    () => t.habits.filter((h) => !h.archived && isDone(h, t.log, day)).length,
    [t.habits, t.log, day],
  );

  const handleTap = (habit: Habit, e: MouseEvent<HTMLElement>) => {
    const raw = countOn(t.log, day, habit.id);
    const count = raw === SKIPPED ? 0 : raw;
    if (count >= habit.target && habit.target === 1) {
      t.setEntry(day, habit.id, 0);
      if (fx.sound) sounds.undo();
      if (fx.haptics) haptic(8);
      return;
    }
    const next = count + 1;
    t.setEntry(day, habit.id, next);
    if (next === habit.target) {
      const rect = e.currentTarget.getBoundingClientRect();
      const c = colorOf(habit.color);
      burstAt(rect.left + 40, rect.top + rect.height / 2, [c.from, c.to, '#ffffff']);
      if (fx.sound) sounds.complete(doneCountToday());
      if (fx.haptics) haptic([12, 40, 24]);
    } else {
      if (fx.sound) sounds.tick(next);
      if (fx.haptics) haptic(10);
    }
  };

  const handleDecrement = (habit: Habit) => {
    t.setEntry(day, habit.id, Math.max(0, countOn(t.log, day, habit.id) - 1));
    if (fx.sound) sounds.undo();
  };

  const handleSave = (input: HabitInput) => {
    if (form?.mode === 'edit') t.updateHabit(form.habit.id, input);
    else {
      t.addHabits([input]);
      if (fx.sound) sounds.complete(2);
      if (fx.haptics) haptic(15);
      setTab('today');
    }
    setForm(null);
  };

  const addTemplates = (inputs: HabitInput[]) => {
    t.addHabits(inputs);
    if (fx.sound) sounds.complete(2);
    if (fx.haptics) haptic([12, 40, 24]);
  };

  const detail = t.habits.find((h) => h.id === detailId) ?? null;
  const detailIndex = detail ? t.habits.indexOf(detail) : -1;

  const toggleDetailDay = (d: string) => {
    if (!detail) return;
    if (isDone(detail, t.log, d)) {
      t.setEntry(d, detail.id, 0);
      if (fx.sound) sounds.undo();
    } else {
      if (d < detail.createdOn) t.updateHabit(detail.id, { createdOn: d });
      t.setEntry(d, detail.id, detail.target);
      if (fx.sound) sounds.complete(1);
      if (fx.haptics) haptic(12);
    }
  };

  if (!t.ready) return <Splash />;

  return (
    <div className="bg-aurora min-h-dvh">
      <main className="app-shell mx-auto max-w-md px-4">
        {t.syncError && <SyncBanner kind={t.syncError} />}
        <div key={tab} className="animate-rise">
          {tab === 'today' && (
            <TodayScreen
              name={name}
              habits={t.habits}
              log={t.log}
              stats={stats}
              today={today}
              day={day}
              onSelectDay={setDay}
              onTap={handleTap}
              onDecrement={handleDecrement}
              onOpen={(h) => setDetailId(h.id)}
              onAdd={() => setForm({ mode: 'new' })}
              onAddTemplates={addTemplates}
            />
          )}
          {tab === 'stats' && <StatsScreen habits={t.habits} log={t.log} stats={stats} today={today} onOpen={(h) => setDetailId(h.id)} />}
          {tab === 'rewards' && <BadgesScreen stats={stats} earned={t.badges} />}
          {tab === 'profile' && <ProfileScreen email={email} settings={{ ...t.settings, name }} stats={stats} onUpdate={t.updateSettings} onLogOut={onLogOut} />}
        </div>
      </main>

      <BottomNav
        tab={tab}
        onTab={(next) => {
          setTab(next);
          if (next === 'rewards') {
            setBadgeDot(false);
            setToasts([]);
          }
          window.scrollTo({ top: 0 });
        }}
        onAdd={() => setForm({ mode: 'new' })}
        badgeDot={badgeDot}
      />

      <Sheet open={form !== null} onClose={() => setForm(null)} title={form?.mode === 'edit' ? 'Edit habit' : 'New habit'}>
        {form && <HabitForm key={form.mode === 'edit' ? form.habit.id : 'new'} initial={form.mode === 'edit' ? form.habit : undefined} onSave={handleSave} onCancel={() => setForm(null)} />}
      </Sheet>

      <Sheet open={detail !== null} onClose={() => setDetailId(null)}>
        {detail && (
          <HabitDetail
            key={detail.id}
            habit={detail}
            log={t.log}
            today={today}
            day={day}
            isFirst={detailIndex === 0}
            isLast={detailIndex === t.habits.length - 1}
            onToggleDay={toggleDetailDay}
            onSkip={() => t.setEntry(day, detail.id, countOn(t.log, day, detail.id) === SKIPPED ? 0 : SKIPPED)}
            onEdit={() => {
              setDetailId(null);
              setForm({ mode: 'edit', habit: detail });
            }}
            onArchive={() => {
              t.updateHabit(detail.id, { archived: !detail.archived });
              setDetailId(null);
            }}
            onDelete={() => {
              t.deleteHabit(detail.id);
              setDetailId(null);
            }}
            onMove={(dir) => t.moveHabit(detail.id, dir)}
          />
        )}
      </Sheet>

      {queue.length > 0 && <Celebration key={queue.length} event={queue[0]} onClose={() => setQueue((q) => q.slice(1))} />}
      {toasts.length > 0 && queue.length === 0 && (
        <BadgeToast
          key={toasts[0].id}
          emoji={toasts[0].emoji}
          name={toasts[0].name}
          onDone={nextToast}
          onOpen={() => {
            setToasts([]);
            setTab('rewards');
            setBadgeDot(false);
          }}
        />
      )}
      <UpdateToast />
    </div>
  );
}

function SyncBanner({ kind }: { kind: 'permission' | 'other' }) {
  return (
    <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="status">
      {kind === 'permission' ? (
        <>
          <p className="font-semibold">Your progress isn’t syncing yet</p>
          <p className="mt-0.5 text-rose-100/70">The database rules need a one-time update (see the README’s “Firestore rules” step). Changes are kept on this device until then.</p>
        </>
      ) : (
        <p>Having trouble syncing — your changes are saved on this device and will sync when the connection recovers.</p>
      )}
    </div>
  );
}
