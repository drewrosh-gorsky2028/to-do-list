// All task data lives here and is saved on the device (phone storage, or the browser on web).
// Supabase sync will replace the save/load pair later without changing the screens.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';

import { toKey } from '@/lib/dates';
import { earnsRock, shellsByCategory } from '@/lib/progress';
import { SHELLS, type Category, type Task, type TaskDraft } from '@/lib/types';

const STORAGE_KEY = 'pebble:tasks:v1';

type State = { tasks: Task[]; loaded: boolean };

type Action =
  | { type: 'load'; tasks: Task[] }
  | { type: 'add'; task: Task }
  | { type: 'finish'; id: string; at: string }
  | { type: 'unfinish'; id: string }
  | { type: 'remove'; id: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load':
      return { tasks: action.tasks, loaded: true };
    case 'add':
      return { ...state, tasks: [...state.tasks, action.task] };
    case 'finish':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id && !t.doneAt ? { ...t, doneAt: action.at, shellsEarned: SHELLS[t.size] } : t,
        ),
      };
    case 'unfinish':
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, doneAt: undefined, shellsEarned: undefined } : t,
        ),
      };
    case 'remove':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
  }
}

export type FinishResult = { shells: number; newRock?: Category };

type Store = {
  tasks: Task[];
  loaded: boolean;
  today: string;
  addTask: (draft: TaskDraft) => Task;
  finishTask: (id: string) => FinishResult | undefined;
  unfinishTask: (id: string) => void;
  removeTask: (id: string) => void;
};

const TaskContext = createContext<Store | null>(null);

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** Today's date, refreshed every minute so the list rolls over at midnight. */
function useToday(): string {
  const [today, setToday] = useState(() => toKey(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setToday(toKey(new Date())), 60_000);
    return () => clearInterval(timer);
  }, []);
  return today;
}

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { tasks: [], loaded: false });
  const today = useToday();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'load', tasks: raw ? (JSON.parse(raw) as Task[]) : [] }))
      .catch(() => dispatch({ type: 'load', tasks: [] }));
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks)).catch(() => {});
  }, [state.tasks, state.loaded]);

  const addTask = useCallback((draft: TaskDraft) => {
    const task: Task = {
      id: newId(),
      title: draft.title.trim(),
      category: draft.category,
      size: draft.size,
      due: draft.due,
      time: draft.due ? draft.time : undefined,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'add', task });
    return task;
  }, []);

  const finishTask = useCallback(
    (id: string): FinishResult | undefined => {
      const task = state.tasks.find((t) => t.id === id);
      if (!task || task.doneAt) return undefined;
      const shells = SHELLS[task.size];
      const before = shellsByCategory(state.tasks)[task.category];
      dispatch({ type: 'finish', id, at: new Date().toISOString() });
      return { shells, newRock: earnsRock(before, shells) ? task.category : undefined };
    },
    [state.tasks],
  );

  const unfinishTask = useCallback((id: string) => dispatch({ type: 'unfinish', id }), []);
  const removeTask = useCallback((id: string) => dispatch({ type: 'remove', id }), []);

  const value = useMemo(
    () => ({ tasks: state.tasks, loaded: state.loaded, today, addTask, finishTask, unfinishTask, removeTask }),
    [state.tasks, state.loaded, today, addTask, finishTask, unfinishTask, removeTask],
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks(): Store {
  const store = useContext(TaskContext);
  if (!store) throw new Error('useTasks must be used inside TaskProvider');
  return store;
}

/** Lets the + button (in the tab bar) open the Add sheet from any screen. */
const AddSheetContext = createContext<{ open: () => void }>({ open: () => {} });
export const AddSheetProvider = AddSheetContext.Provider;
export const useAddSheet = () => useContext(AddSheetContext);
