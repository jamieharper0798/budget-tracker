import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { Habit, Log, Settings, TrackerState } from '../types';
import { db } from '../lib/firebase';
import { SKIPPED } from '../lib/habits';
import { todayKey } from '../lib/dates';

/** Firestore collection holding one tracker document per user (see firestore.rules). */
const COLLECTION = 'habits';

const DEFAULT_SETTINGS: Settings = { sound: true, haptics: true, name: '' };

const EMPTY: TrackerState = { habits: [], log: {}, settings: DEFAULT_SETTINGS, badges: {} };

function normalize(data: Partial<TrackerState> | undefined): TrackerState {
  return {
    habits: data?.habits ?? [],
    log: data?.log ?? {},
    settings: { ...DEFAULT_SETTINGS, ...data?.settings },
    badges: data?.badges ?? {},
  };
}

export type HabitInput = Omit<Habit, 'id' | 'createdOn' | 'archived'>;

export type SyncError = 'permission' | 'other' | null;

function syncErrorOf(err: unknown): SyncError {
  return (err as { code?: string })?.code === 'permission-denied' ? 'permission' : 'other';
}

function setCount(log: Log, day: string, habitId: string, value: number): Log {
  const dayLog = { ...log[day] };
  if (value === 0) delete dayLog[habitId];
  else dayLog[habitId] = value;
  const next = { ...log };
  if (Object.keys(dayLog).length === 0) delete next[day];
  else next[day] = dayLog;
  return next;
}

export function useTracker(uid: string) {
  const [state, setState] = useState<TrackerState>(EMPTY);
  const [ready, setReady] = useState(db === null);
  const [syncError, setSyncError] = useState<SyncError>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    if (!db) return;
    const ref = doc(db, COLLECTION, uid);
    return onSnapshot(
      ref,
      (snap) => {
        const next = normalize(snap.exists() ? (snap.data() as Partial<TrackerState>) : undefined);
        stateRef.current = next;
        setState(next);
        setSyncError(null);
        setReady(true);
      },
      (err) => {
        setSyncError(syncErrorOf(err));
        setReady(true);
      },
    );
  }, [uid]);

  const commit = useCallback(
    (updater: (prev: TrackerState) => TrackerState) => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      setState(next);
      if (db) setDoc(doc(db, COLLECTION, uid), next).catch((err) => setSyncError(syncErrorOf(err)));
    },
    [uid],
  );

  const addHabits = useCallback(
    (inputs: HabitInput[]) => {
      const added: Habit[] = inputs.map((input) => ({ ...input, id: crypto.randomUUID(), createdOn: todayKey(), archived: false }));
      commit((prev) => ({ ...prev, habits: [...prev.habits, ...added] }));
    },
    [commit],
  );

  const updateHabit = useCallback(
    (id: string, input: Partial<Habit>) => {
      commit((prev) => ({ ...prev, habits: prev.habits.map((h) => (h.id === id ? { ...h, ...input } : h)) }));
    },
    [commit],
  );

  const deleteHabit = useCallback(
    (id: string) => {
      commit((prev) => {
        const log: Log = {};
        for (const [day, entries] of Object.entries(prev.log)) {
          const { [id]: _removed, ...rest } = entries;
          if (Object.keys(rest).length) log[day] = rest;
        }
        return { ...prev, habits: prev.habits.filter((h) => h.id !== id), log };
      });
    },
    [commit],
  );

  const moveHabit = useCallback(
    (id: string, dir: -1 | 1) => {
      commit((prev) => {
        const habits = [...prev.habits];
        const i = habits.findIndex((h) => h.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= habits.length) return prev;
        [habits[i], habits[j]] = [habits[j], habits[i]];
        return { ...prev, habits };
      });
    },
    [commit],
  );

  /** Sets the raw check-in count for a habit on a day (0 clears, SKIPPED marks a skip). */
  const setEntry = useCallback(
    (day: string, habitId: string, value: number) => {
      commit((prev) => ({ ...prev, log: setCount(prev.log, day, habitId, Math.max(SKIPPED, value)) }));
    },
    [commit],
  );

  const updateSettings = useCallback(
    (settings: Partial<Settings>) => commit((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } })),
    [commit],
  );

  const awardBadges = useCallback(
    (ids: string[]) => {
      const now = Date.now();
      commit((prev) => ({ ...prev, badges: { ...prev.badges, ...Object.fromEntries(ids.map((id) => [id, now])) } }));
    },
    [commit],
  );

  return { ...state, ready, syncError, addHabits, updateHabit, deleteHabit, moveHabit, setEntry, updateSettings, awardBadges };
}
