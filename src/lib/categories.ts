import type { Category } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'streaming', name: 'Streaming & Media', icon: '🎬', color: '#f43f5e', builtIn: true },
  { id: 'software', name: 'Software & Apps', icon: '💻', color: '#6366f1', builtIn: true },
  { id: 'utilities', name: 'Utilities', icon: '⚡', color: '#f59e0b', builtIn: true },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', color: '#0ea5e9', builtIn: true },
  { id: 'fitness', name: 'Health & Fitness', icon: '💪', color: '#10b981', builtIn: true },
  { id: 'housing', name: 'Housing & Rent', icon: '🏠', color: '#a855f7', builtIn: true },
  { id: 'loans', name: 'Loans & Debt', icon: '💳', color: '#ef4444', builtIn: true },
  { id: 'phone', name: 'Phone & Internet', icon: '📶', color: '#14b8a6', builtIn: true },
  { id: 'memberships', name: 'Memberships', icon: '🎟️', color: '#eab308', builtIn: true },
  { id: 'other', name: 'Other', icon: '🗂️', color: '#64748b', builtIn: true },
];

export const ACCOUNT_COLORS = [
  '#10b981',
  '#0ea5e9',
  '#a855f7',
  '#f59e0b',
  '#f43f5e',
  '#14b8a6',
  '#6366f1',
  '#eab308',
];

export const CATEGORY_COLORS = ACCOUNT_COLORS;
