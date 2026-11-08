// Shells and rocks. Shells are worked out from finished tasks, so undoing a finish
// takes its shells back and nothing can drift out of sync.

import { CATEGORIES, type Category, type Task } from './types.ts';

export const SHELLS_PER_ROCK = 10;

export function shellsByCategory(tasks: Task[]): Record<Category, number> {
  const out = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const t of tasks) if (t.doneAt && t.shellsEarned) out[t.category] += t.shellsEarned;
  return out;
}

export function totalShells(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.doneAt ? (t.shellsEarned ?? 0) : 0), 0);
}

export function rocksFor(shells: number): number {
  return Math.floor(shells / SHELLS_PER_ROCK);
}

/** True when earning `gained` more shells in a category crosses into a new rock. */
export function earnsRock(before: number, gained: number): boolean {
  return rocksFor(before + gained) > rocksFor(before);
}
