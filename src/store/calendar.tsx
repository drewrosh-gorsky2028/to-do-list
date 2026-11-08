// Google Calendar connection: today's events for the Today screen, putting tasks on the
// calendar, and pulling back changes made on the calendar side (moved or deleted events).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import {
  createTaskEvent,
  eventsOn,
  getEvent,
  getToken,
  GOOGLE_CLIENT_ID,
  signOut,
  type CalendarEvent,
} from '@/lib/google-calendar';
import type { Task } from '@/lib/types';

import { useTasks } from './tasks';

const CONNECTED_KEY = 'pebble:calendar:connected';

export type CalendarStatus =
  | 'unavailable' // phone app: calendar sync is web-only for now
  | 'not-set-up' // no Google Client ID in the app yet
  | 'off'
  | 'connecting'
  | 'needs-tap' // was connected, Google wants a tap to continue (e.g. after a reload)
  | 'on';

type Calendar = {
  status: CalendarStatus;
  error?: string;
  todayEvents: CalendarEvent[];
  connect: () => Promise<void>;
  disconnect: () => void;
  refresh: () => Promise<void>;
  putOnCalendar: (task: Task) => Promise<void>;
};

const CalendarContext = createContext<Calendar | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { tasks, today, updateTask, loaded } = useTasks();
  const [status, setStatus] = useState<CalendarStatus>(() =>
    Platform.OS !== 'web' ? 'unavailable' : GOOGLE_CLIENT_ID ? 'off' : 'not-set-up',
  );
  const [error, setError] = useState<string>();
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const sync = useCallback(async () => {
    setTodayEvents(await eventsOn(today));
    // Calendar → app: moved or deleted events update their tasks.
    for (const t of tasksRef.current) {
      if (!t.calendarEventId || t.doneAt) continue;
      const e = await getEvent(t.calendarEventId);
      if (!e) {
        updateTask(t.id, { calendarEventId: undefined, endTime: undefined });
      } else if (e.start && (e.day !== t.due || e.start !== t.time || e.end !== t.endTime)) {
        updateTask(t.id, { due: e.day, time: e.start, endTime: e.end });
      }
    }
  }, [today, updateTask]);

  const refresh = useCallback(async () => {
    if (status !== 'on') return;
    try {
      await sync();
      setError(undefined);
    } catch (e) {
      setStatus('needs-tap');
      setError((e as Error).message);
    }
  }, [status, sync]);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setError(undefined);
    try {
      await getToken(true);
      await AsyncStorage.setItem(CONNECTED_KEY, '1').catch(() => {});
      setStatus('on');
      await sync();
    } catch (e) {
      setStatus((s) => (s === 'connecting' ? 'off' : s));
      setError((e as Error).message);
    }
  }, [sync]);

  const disconnect = useCallback(() => {
    signOut();
    AsyncStorage.removeItem(CONNECTED_KEY).catch(() => {});
    setTodayEvents([]);
    setStatus(GOOGLE_CLIENT_ID ? 'off' : 'not-set-up');
  }, []);

  // Connected before? Google needs a tap to hand out a new pass after a reload.
  useEffect(() => {
    if (Platform.OS !== 'web' || !GOOGLE_CLIENT_ID || !loaded) return;
    AsyncStorage.getItem(CONNECTED_KEY)
      .then((v) => {
        if (v) setStatus((s) => (s === 'off' ? 'needs-tap' : s));
      })
      .catch(() => {});
  }, [loaded]);

  // Re-check when the app comes back to the front, and when the day changes.
  useEffect(() => {
    if (status !== 'on') return;
    refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    const timer = setInterval(refresh, 5 * 60_000);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, today]);

  const putOnCalendar = useCallback(
    async (task: Task) => {
      if (status !== 'on') throw new Error('Connect Google Calendar first.');
      const id = await createTaskEvent(task);
      updateTask(task.id, { calendarEventId: id });
      if (task.due === today) setTodayEvents(await eventsOn(today));
    },
    [status, today, updateTask],
  );

  const value = useMemo(
    () => ({ status, error, todayEvents, connect, disconnect, refresh, putOnCalendar }),
    [status, error, todayEvents, connect, disconnect, refresh, putOnCalendar],
  );
  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar(): Calendar {
  const c = useContext(CalendarContext);
  if (!c) throw new Error('useCalendar must be used inside CalendarProvider');
  return c;
}
