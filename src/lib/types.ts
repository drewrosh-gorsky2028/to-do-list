export const CATEGORIES = [
  'School',
  'Social',
  'Creative',
  'Errands',
  'Chores',
  'Fitness',
  'Health',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Size = 'small' | 'medium' | 'big';

export const SHELLS: Record<Size, number> = { small: 1, medium: 3, big: 5 };

export const SIZE_LABEL: Record<Size, string> = { small: 'Small', medium: 'Medium', big: 'Big' };

export const SIZE_SHORT: Record<Size, string> = { small: 'S', medium: 'M', big: 'L' };

/** A date with no time, in the phone's local time zone: "2026-11-13". */
export type DateKey = string;

export type Task = {
  id: string;
  title: string;
  category: Category;
  size: Size;
  /** Day the task is due, if it has one. */
  due?: DateKey;
  /** Time of day it is due, "HH:MM" in 24 hour time. Only set when `due` is set. */
  time?: string;
  createdAt: string;
  /** When it was finished (ISO time). Unset while the task is open. */
  doneAt?: string;
  /** Shells paid out when it was finished, so undo takes back exactly that many. */
  shellsEarned?: number;
  /** Google Calendar event for this task, when it was put on the calendar. */
  calendarEventId?: string;
  /** End time "HH:MM" of the calendar block, as last seen on the calendar. */
  endTime?: string;
};

/** The parts of a task someone fills in when adding it. */
export type TaskDraft = {
  title: string;
  category: Category;
  size: Size;
  due?: DateKey;
  time?: string;
  /** Put it on Google Calendar too. Only works with a day and a time. */
  onCalendar?: boolean;
};
