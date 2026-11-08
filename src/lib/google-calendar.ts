// Google Calendar on the web: sign-in with Google Identity Services, then plain calls to the
// Calendar API. Only the OAuth Client ID lives in the app; it is public by design.

import { addDays } from './dates.ts';
import type { Size, Task } from './types.ts';

/** Paste the Client ID from Google Cloud here (ends in .apps.googleusercontent.com). */
export const GOOGLE_CLIENT_ID = '275542758841-gg578pknv6uqn344muchr3djtb0ua92g.apps.googleusercontent.com';

const SCOPE = 'https://www.googleapis.com/auth/calendar.events';
const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/** How long a calendar block lasts for each task size, in minutes. */
export const BLOCK_MINUTES: Record<Size, number> = { small: 30, medium: 60, big: 120 };

export type CalendarEvent = {
  id: string;
  title: string;
  /** "HH:MM", or undefined for an all-day event. */
  start?: string;
  end?: string;
  day: string;
  cancelled?: boolean;
};

type TokenClient = { requestAccessToken: (opts?: { prompt?: string }) => void };
type GoogleGlobal = {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        callback: (r: { access_token?: string; expires_in?: number; error?: string }) => void;
        error_callback?: (e: { type?: string; message?: string }) => void;
      }) => TokenClient;
      revoke: (token: string, done?: () => void) => void;
    };
  };
};

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('Calendar works on the web for now.'));
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Couldn't reach Google. Check your connection and try again."));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

let token: { value: string; expires: number } | null = null;

/**
 * Gets a Calendar access token. `interactive` shows Google's consent popup (needs a tap);
 * otherwise it tries quietly and fails if Google wants the person to click something.
 */
export async function getToken(interactive: boolean): Promise<string> {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  if (!GOOGLE_CLIENT_ID) throw new Error("Calendar isn't set up yet.");
  await loadScript();
  const google = (globalThis as unknown as { google?: GoogleGlobal }).google;
  if (!google) throw new Error("Couldn't reach Google. Try again.");
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (r) => {
        if (!r.access_token) return reject(new Error(r.error ?? 'Google sign-in was cancelled.'));
        token = { value: r.access_token, expires: Date.now() + (r.expires_in ?? 3600) * 1000 };
        resolve(r.access_token);
      },
      error_callback: (e) => reject(new Error(e.message ?? 'Google sign-in was closed.')),
    });
    client.requestAccessToken({ prompt: interactive ? 'consent' : '' });
  });
}

export function signOut() {
  const google = (globalThis as unknown as { google?: GoogleGlobal }).google;
  if (token && google) google.accounts.oauth2.revoke(token.value);
  token = null;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const t = await getToken(false);
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  if (res.status === 404 || res.status === 410) return null;
  if (res.status === 401) token = null;
  if (!res.ok) throw new Error(`Google Calendar said ${res.status}.`);
  if (res.status === 204) return null;
  return (await res.json()) as T;
}

type ApiEvent = {
  id: string;
  status?: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
};

const pad = (n: number) => String(n).padStart(2, '0');

function localParts(iso: string): { day: string; time: string } {
  const d = new Date(iso);
  return { day: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

export function toCalendarEvent(e: ApiEvent): CalendarEvent {
  if (e.start?.dateTime) {
    const s = localParts(e.start.dateTime);
    const end = e.end?.dateTime ? localParts(e.end.dateTime).time : undefined;
    return { id: e.id, title: e.summary ?? '(No title)', day: s.day, start: s.time, end, cancelled: e.status === 'cancelled' };
  }
  return { id: e.id, title: e.summary ?? '(No title)', day: e.start?.date ?? '', cancelled: e.status === 'cancelled' };
}

/** Events on one day of the primary calendar, all-day events first. */
export async function eventsOn(day: string): Promise<CalendarEvent[]> {
  const start = new Date(`${day}T00:00:00`).toISOString();
  const end = new Date(`${addDays(day, 1)}T00:00:00`).toISOString();
  const q = `?singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(start)}&timeMax=${encodeURIComponent(end)}`;
  const data = await call<{ items: ApiEvent[] }>(q);
  return (data?.items ?? []).map(toCalendarEvent).filter((e) => !e.cancelled);
}

function endTime(day: string, time: string, minutes: number): string {
  const d = new Date(`${day}T${time}:00`);
  d.setMinutes(d.getMinutes() + minutes);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

/** Puts a task on the calendar. Needs a due day and time. Returns the new event's id. */
export async function createTaskEvent(task: Task): Promise<string> {
  if (!task.due || !task.time) throw new Error('Give the task a day and a time first.');
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const body = {
    summary: task.title,
    description: `From Pebble · ${task.category}`,
    start: { dateTime: `${task.due}T${task.time}:00`, timeZone },
    end: { dateTime: endTime(task.due, task.time, BLOCK_MINUTES[task.size]), timeZone },
  };
  const created = await call<ApiEvent>('', { method: 'POST', body: JSON.stringify(body) });
  if (!created) throw new Error("Google Calendar didn't save it.");
  return created.id;
}

/** Reads a task's event back. `null` means it was deleted on the calendar. */
export async function getEvent(id: string): Promise<CalendarEvent | null> {
  const e = await call<ApiEvent>(`/${encodeURIComponent(id)}`);
  if (!e || e.status === 'cancelled') return null;
  return toCalendarEvent(e);
}

export async function deleteEvent(id: string): Promise<void> {
  await call(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
