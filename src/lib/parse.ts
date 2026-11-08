// Turns a sentence like "essay due friday, big" into a task draft.
// Everything it finds is shown back as chips on the Add sheet, so a wrong guess is one tap to fix.

import { addDays, fromKey, toKey } from './dates.ts';
import { CATEGORIES, type Category, type DateKey, type Size } from './types.ts';

export type ParseResult = {
  title: string;
  category?: Category;
  size?: Size;
  due?: DateKey;
  time?: string;
};

const CATEGORY_WORDS: Record<Category, string[]> = {
  School: [
    'school', 'essay', 'homework', 'hw', 'study', 'studying', 'exam', 'test', 'quiz', 'class', 'lecture',
    'paper', 'assignment', 'lab', 'math', 'history', 'english', 'chem', 'chemistry', 'bio', 'biology',
    'physics', 'spanish', 'french', 'reading', 'chapter', 'project', 'presentation', 'worksheet', 'college',
    'application', 'teacher', 'notes',
  ],
  Social: [
    'social', 'text', 'call', 'facetime', 'meet', 'hang', 'hangout', 'party', 'birthday', 'friend', 'friends',
    'mom', 'dad', 'grandma', 'grandpa', 'family', 'reply', 'invite', 'date', 'visit', 'card', 'gift',
  ],
  Creative: [
    'creative', 'draw', 'drawing', 'paint', 'painting', 'sketch', 'song', 'music', 'guitar', 'piano', 'drums',
    'sing', 'poem', 'story', 'write', 'writing', 'film', 'video', 'photo', 'photos', 'craft', 'knit', 'design',
    'edit', 'compose', 'art',
  ],
  Errands: [
    'errand', 'errands', 'buy', 'pick', 'groceries', 'grocery', 'store', 'return', 'mail', 'ship', 'bank',
    'pharmacy', 'library', 'drop', 'order', 'pay', 'post', 'gas', 'shop', 'shopping', 'renew',
  ],
  Chores: [
    'chore', 'chores', 'laundry', 'clean', 'dishes', 'vacuum', 'trash', 'tidy', 'wash', 'cook', 'sweep', 'mop',
    'bed', 'organize', 'fold', 'garbage', 'recycling', 'dust', 'room', 'kitchen', 'bathroom',
  ],
  Fitness: [
    'fitness', 'run', 'running', 'jog', 'gym', 'workout', 'lift', 'lifting', 'yoga', 'swim', 'bike', 'ride',
    'hike', 'stretch', 'miles', 'mile', 'pushups', 'situps', 'soccer', 'basketball', 'tennis', 'practice',
    'cardio', 'abs', 'walk', 'steps',
  ],
  Health: [
    'health', 'doctor', 'dentist', 'meds', 'medicine', 'pills', 'therapy', 'therapist', 'appointment',
    'checkup', 'vitamins', 'sleep', 'water', 'prescription', 'refill', 'orthodontist', 'eye', 'meditate',
  ],
};

const SIZE_WORDS: [words: string, letter: string, size: Size][] = [
  ['big|large|huge|long|hard', 'l', 'big'],
  ['medium|med', 'm', 'medium'],
  ['small|quick|tiny|short|easy', 's', 'small'],
];

const DAY_NAMES: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5,
  jul: 6, july: 6, aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10,
  november: 10, dec: 11, december: 11,
};

const DAY_RE = Object.keys(DAY_NAMES).sort((a, b) => b.length - a.length).join('|');
const MONTH_RE = Object.keys(MONTH_NAMES).sort((a, b) => b.length - a.length).join('|');
// Words that only glue a date or time to the task: "due friday", "by 5pm", "on the 12th".
const LEAD = String.raw`(?:(?:due|by|on|at|for|this|before)\s+)*`;

const pad = (n: number) => String(n).padStart(2, '0');

/** Upcoming date for a weekday: today counts unless `strictlyAfter`. */
function nextWeekday(today: DateKey, weekday: number, strictlyAfter: boolean): DateKey {
  const current = fromKey(today).getDay();
  let diff = (weekday - current + 7) % 7;
  if (diff === 0 && strictlyAfter) diff = 7;
  return addDays(today, diff);
}

/** A month/day with no year: the next time that date comes around (today counts). */
function nextMonthDay(today: DateKey, month: number, day: number): DateKey | undefined {
  const t = fromKey(today);
  for (const year of [t.getFullYear(), t.getFullYear() + 1]) {
    const d = new Date(year, month, day);
    if (d.getMonth() !== month) return undefined; // e.g. Feb 31
    const key = toKey(d);
    if (key >= today) return key;
  }
  return undefined;
}

function to24(hour: number, minute: number, ampm?: string): string | undefined {
  if (minute > 59) return undefined;
  if (ampm) {
    if (hour < 1 || hour > 12) return undefined;
    if (ampm.startsWith('p') && hour !== 12) hour += 12;
    if (ampm.startsWith('a') && hour === 12) hour = 0;
  } else {
    if (hour > 23) return undefined;
    // "at 3" almost always means the afternoon for a to-do.
    if (hour >= 1 && hour <= 7) hour += 12;
  }
  return `${pad(hour)}:${pad(minute)}`;
}

export function parseTask(input: string, today: DateKey): ParseResult {
  let text = ` ${input.trim()} `;
  const result: ParseResult = { title: '' };

  const take = (re: RegExp, fn: (m: RegExpMatchArray) => boolean) => {
    const m = text.toLowerCase().match(re);
    if (!m || m.index === undefined) return;
    if (fn(m)) text = text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length);
  };

  // Times first, so "at 3" is not read as a date.
  take(new RegExp(String.raw`\s${LEAD}(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|a|p)(?=[\s,.!]|$)`), (m) => {
    const t = to24(Number(m[1]), Number(m[2] ?? 0), m[3]);
    if (t) result.time = t;
    return !!t;
  });
  if (!result.time) {
    take(new RegExp(String.raw`\s(?:at|by)\s+(\d{1,2})(?::(\d{2}))?(?=[\s,.!]|$)`), (m) => {
      const t = to24(Number(m[1]), Number(m[2] ?? 0));
      if (t) result.time = t;
      return !!t;
    });
  }
  if (!result.time) {
    take(new RegExp(String.raw`\s${LEAD}(\d{1,2}):(\d{2})(?=[\s,.!]|$)`), (m) => {
      const t = to24(Number(m[1]), Number(m[2]));
      if (t) result.time = t;
      return !!t;
    });
  }
  if (!result.time) {
    take(new RegExp(String.raw`\s${LEAD}(noon|midday|midnight)(?=[\s,.!]|$)`), (m) => {
      result.time = m[1] === 'midnight' ? '23:59' : '12:00';
      return true;
    });
  }

  // Dates.
  take(new RegExp(String.raw`\s${LEAD}(today|tonight|tomorrow|tmrw|tmr)(?=[\s,.!]|$)`), (m) => {
    const word = m[1];
    result.due = word === 'today' || word === 'tonight' ? today : addDays(today, 1);
    if (word === 'tonight' && !result.time) result.time = '19:00';
    return true;
  });
  if (!result.due) {
    take(new RegExp(String.raw`\s${LEAD}(next\s+)?(${DAY_RE})(?=[\s,.!]|$)`), (m) => {
      result.due = nextWeekday(today, DAY_NAMES[m[2]], !!m[1]);
      return true;
    });
  }
  if (!result.due) {
    take(new RegExp(String.raw`\s${LEAD}next\s+week(?=[\s,.!]|$)`), () => {
      result.due = nextWeekday(today, 1, true);
      return true;
    });
  }
  if (!result.due) {
    take(new RegExp(String.raw`\s${LEAD}in\s+(\d{1,2}|a|one|two|three)\s+(day|days|week|weeks)(?=[\s,.!]|$)`), (m) => {
      const words: Record<string, number> = { a: 1, one: 1, two: 2, three: 3 };
      const n = words[m[1]] ?? Number(m[1]);
      result.due = addDays(today, m[2].startsWith('week') ? n * 7 : n);
      return true;
    });
  }
  if (!result.due) {
    take(new RegExp(String.raw`\s${LEAD}(${MONTH_RE})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?=[\s,.!]|$)`), (m) => {
      const due = nextMonthDay(today, MONTH_NAMES[m[1]], Number(m[2]));
      if (due) result.due = due;
      return !!due;
    });
  }
  if (!result.due) {
    take(new RegExp(String.raw`\s${LEAD}(\d{1,2})/(\d{1,2})(?=[\s,.!]|$)`), (m) => {
      const due = nextMonthDay(today, Number(m[1]) - 1, Number(m[2]));
      if (due) result.due = due;
      return !!due;
    });
  }
  if (!result.due) {
    take(new RegExp(String.raw`\s${LEAD}(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)(?=[\s,.!]|$)`), (m) => {
      const t = fromKey(today);
      const day = Number(m[1]);
      let due = nextMonthDay(today, t.getMonth(), day);
      if (!due || due.slice(0, 7) !== today.slice(0, 7)) due = nextMonthDay(today, (t.getMonth() + 1) % 12, day);
      if (due) result.due = due;
      return !!due;
    });
  }
  if (!result.time) {
    take(new RegExp(String.raw`\s(?:in\s+the\s+|this\s+)?(morning|afternoon|evening)(?=[\s,.!]|$)`), (m) => {
      result.time = { morning: '09:00', afternoon: '15:00', evening: '19:00' }[m[1]];
      return true;
    });
  }

  // Size: a word anywhere ("big essay"), or a lone letter after a comma ("essay, l").
  for (const [words, letter, size] of SIZE_WORDS) {
    let matched = false;
    take(new RegExp(String.raw`(?:,\s*|\s)(?:${words})(?:\s+(?:one|task))?(?=[\s,.!]|$)`), () => (matched = true));
    if (!matched) take(new RegExp(String.raw`,\s*${letter}(?=[\s,.!]|$)`), () => (matched = true));
    if (matched) {
      result.size = size;
      break;
    }
  }

  // Category: an explicit "#school" wins, then the first keyword we recognise.
  take(/\s#(\w+)(?=[\s,.!]|$)/, (m) => {
    const cat = CATEGORIES.find((c) => c.toLowerCase() === m[1]);
    if (cat) result.category = cat;
    return !!cat;
  });
  if (!result.category) {
    const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
    outer: for (const word of words) {
      for (const cat of CATEGORIES) {
        if (CATEGORY_WORDS[cat].includes(word)) {
          result.category = cat;
          break outer;
        }
      }
    }
  }

  result.title = cleanTitle(text);
  return result;
}

function cleanTitle(text: string): string {
  let t = text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!])/g, '$1')
    .trim()
    // Leftover glue words at the end: "essay due" -> "essay".
    .replace(/(?:[\s,]+(?:due|by|on|at|for|this|before|and))+[\s,.]*$/i, '')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '');
  if (t) t = t[0].toUpperCase() + t.slice(1);
  return t;
}
