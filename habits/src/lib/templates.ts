import type { HabitInput } from '../hooks/useTracker';

export const TEMPLATES: HabitInput[] = [
  { name: 'Drink water', emoji: '💧', color: 'teal', schedule: { kind: 'daily' }, target: 8, unit: 'glasses', timeOfDay: 'anytime' },
  { name: 'Move your body', emoji: '🏃', color: 'orange', schedule: { kind: 'weekly', timesPerWeek: 4 }, target: 1, unit: '', timeOfDay: 'morning' },
  { name: 'Read', emoji: '📚', color: 'violet', schedule: { kind: 'daily' }, target: 1, unit: '', timeOfDay: 'evening' },
  { name: 'Meditate', emoji: '🧘', color: 'sky', schedule: { kind: 'daily' }, target: 1, unit: '', timeOfDay: 'morning' },
  { name: 'Sleep by 11pm', emoji: '😴', color: 'slate', schedule: { kind: 'daily' }, target: 1, unit: '', timeOfDay: 'evening' },
  { name: 'Eat veggies', emoji: '🥦', color: 'lime', schedule: { kind: 'daily' }, target: 3, unit: 'servings', timeOfDay: 'anytime' },
  { name: 'Journal', emoji: '✍️', color: 'amber', schedule: { kind: 'daily' }, target: 1, unit: '', timeOfDay: 'evening' },
  { name: 'No social media', emoji: '📵', color: 'pink', schedule: { kind: 'weekdays', days: [1, 2, 3, 4, 5] }, target: 1, unit: '', timeOfDay: 'anytime' },
];

export const EMOJIS = ['💧', '🏋️', '🏃', '📚', '🧘', '😴', '🥦', '✍️', '📵', '💪', '🚶', '🧠', '🎸', '🧹', '💊', '🌱', '☀️', '🍎', '🚴', '🙏', '💰', '🎨', '🗣️', '🦷', '❤️'];
