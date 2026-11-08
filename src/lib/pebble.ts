// What Pebble looks like and says. Teasing the task, never the person.

import type { Mood } from '../pebble/art.ts';
import type { Task } from './types.ts';

export type Situation = {
  hour: number;
  overdue: number;
  left: number;
  doneToday: number;
};

export function moodFor(s: Situation): Mood {
  if (s.hour >= 23 || s.hour < 5) return 'sleepy';
  if (s.overdue >= 3) return 'rainy';
  if (s.overdue > 0) return 'judging';
  return 'default';
}

const pick = (lines: string[], seed: number) => lines[Math.abs(seed) % lines.length];

export function idleLine(s: Situation, seed: number, overdueTitle?: string): string {
  const mood = moodFor(s);
  if (mood === 'sleepy') {
    return pick(
      [
        "It's late. Even my rock went to bed.",
        'Whatever it is, it can wait till morning. Probably.',
        "I'm not asleep. I'm resting my eyes on your list.",
      ],
      seed,
    );
  }
  if (mood === 'rainy') {
    return pick(
      [
        `Storm over ${s.overdue} tasks. I love rain. You should hate it.`,
        `${s.overdue} overdue. I'm soaked and honestly thriving.`,
        'The cloud is getting comfortable. Evict it.',
      ],
      seed,
    );
  }
  if (mood === 'judging') {
    const title = overdueTitle?.toLowerCase();
    return pick(
      [
        title ? `"${shorten(title)}" isn't doing itself. I checked.` : "That overdue one isn't doing itself. I checked.",
        'My rock is taking notes on that overdue one.',
        'One little cloud. Tap it and it turns into sun. Just saying.',
      ],
      seed,
    );
  }
  if (s.left === 0 && s.doneToday > 0) {
    return pick(
      [
        "All done. The rock and I are speechless. Mostly the rock.",
        'Nothing left. Go do something useless. You earned it.',
        "Clean list. I'll just sit here and admire it.",
      ],
      seed,
    );
  }
  if (s.left === 0) {
    return pick(
      [
        'Empty list. Suspicious. Tap + and tell me something.',
        'Nothing to do? My rock has done more today than you.',
        "No tasks yet. I'll hold the rock till you're ready.",
      ],
      seed,
    );
  }
  return pick(
    [
      "This is my favorite rock. It's done more today than you.",
      `${s.left} to go. I believe in you. The rock is undecided.`,
      'Pick the easy one first. I won’t tell anyone.',
      "I'd help, but I'm holding a rock.",
    ],
    seed,
  );
}

export function finishLine(task: Task, wasOverdue: boolean, seed: number): string {
  if (wasOverdue) {
    return pick(
      [
        'Look at you. That cloud never saw it coming.',
        'Overdue? Never heard of it. Sun’s out.',
        `Finally. "${shorten(task.title.toLowerCase())}" can rest now.`,
      ],
      seed,
    );
  }
  if (task.size === 'big') {
    return pick(
      [
        'A BIG one! The rock and I are SO proud. Mostly the rock.',
        'That was a big one. Take a lap. A small lap.',
        'Five shells! I may have to get a second rock.',
      ],
      seed,
    );
  }
  return pick(
    [
      'You did it! The rock and I are SO proud.',
      'Splash! That one sank without a trace.',
      'Done. I barely had to tease you.',
      "Shell acquired. I'd high five you but, rock.",
    ],
    seed,
  );
}

export function addLine(draft: { size: string; due?: string; category?: string }, today: string): string {
  if (draft.size === 'big' && draft.due && draft.due > today) return "Big one. I'd start early, not the night before. Just a thought.";
  if (draft.size === 'big') return "Big one. I'll be here for moral support. And the rock.";
  if (draft.due === today) return "Due today? Bold. Let's get it in.";
  if (!draft.due) return "No due date? Living dangerously. I'll keep it on Today for you.";
  return "Got it. I'll keep an eye on this one.";
}

function shorten(s: string, max = 28): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}
