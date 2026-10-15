export type Schedule =
  | { kind: 'daily' }
  | { kind: 'weekdays'; days: number[] } // 0 = Sunday … 6 = Saturday
  | { kind: 'weekly'; timesPerWeek: number };

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string; // key into COLORS
  schedule: Schedule;
  /** How many check-ins make a day "done" (e.g. 8 glasses of water). */
  target: number;
  unit: string;
  timeOfDay: TimeOfDay;
  createdOn: string; // date key
  archived: boolean;
}

/** Per day, per habit: number of check-ins, or SKIPPED. */
export type Log = Record<string, Record<string, number>>;

export interface Settings {
  sound: boolean;
  haptics: boolean;
  name: string;
}

export interface TrackerState {
  habits: Habit[];
  log: Log;
  settings: Settings;
  /** Badge id → time it was first earned. Kept even if the underlying check-ins are later undone. */
  badges: Record<string, number>;
}
