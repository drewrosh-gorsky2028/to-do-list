/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseTask } from '../src/lib/parse.ts';
import { earnsRock, shellsByCategory, totalShells } from '../src/lib/progress.ts';
import type { Task } from '../src/lib/types.ts';

// Sunday, November 8, 2026
const TODAY = '2026-11-08';

test('the example from the design: "essay due friday, big"', () => {
  assert.deepEqual(parseTask('essay due friday, big', TODAY), {
    title: 'Essay',
    category: 'School',
    size: 'big',
    due: '2026-11-13',
  });
});

test('today, tomorrow and tonight', () => {
  assert.equal(parseTask('text maya back today', TODAY).due, TODAY);
  assert.equal(parseTask('laundry tomorrow', TODAY).due, '2026-11-09');
  const tonight = parseTask('call grandma tonight', TODAY);
  assert.equal(tonight.due, TODAY);
  assert.equal(tonight.time, '19:00');
  assert.equal(tonight.title, 'Call grandma');
  assert.equal(tonight.category, 'Social');
});

test('weekdays: today counts, "next" skips today', () => {
  assert.equal(parseTask('run sunday', TODAY).due, TODAY);
  assert.equal(parseTask('run next sunday', TODAY).due, '2026-11-15');
  assert.equal(parseTask('gym on wed', TODAY).due, '2026-11-11');
});

test('times', () => {
  assert.equal(parseTask('dentist tuesday at 3pm', TODAY).time, '15:00');
  assert.equal(parseTask('dentist tuesday at 3', TODAY).time, '15:00');
  assert.equal(parseTask('meds at 9am', TODAY).time, '09:00');
  assert.equal(parseTask('study 4:30pm', TODAY).time, '16:30');
  assert.equal(parseTask('lunch with sam at noon', TODAY).time, '12:00');
  const d = parseTask('dentist tuesday at 3pm', TODAY);
  assert.equal(d.title, 'Dentist');
  assert.equal(d.category, 'Health');
  assert.equal(d.due, '2026-11-10');
});

test('month dates and slashes roll into next year when passed', () => {
  assert.equal(parseTask('history paper due nov 20', TODAY).due, '2026-11-20');
  assert.equal(parseTask('renew passport jan 5', TODAY).due, '2027-01-05');
  assert.equal(parseTask('return books 11/12', TODAY).due, '2026-11-12');
  assert.equal(parseTask('return books 11/1', TODAY).due, '2027-11-01');
  assert.equal(parseTask('pay phone bill on the 20th', TODAY).due, '2026-11-20');
  assert.equal(parseTask('pay phone bill on the 2nd', TODAY).due, '2026-12-02');
});

test('sizes', () => {
  assert.equal(parseTask('quick vacuum', TODAY).size, 'small');
  assert.equal(parseTask('big clean of my room', TODAY).size, 'big');
  assert.equal(parseTask('practice guitar, m', TODAY).size, 'medium');
  assert.equal(parseTask('practice guitar', TODAY).size, undefined);
  assert.equal(parseTask('quick vacuum', TODAY).title, 'Vacuum');
});

test('hashtag category wins over keywords', () => {
  const r = parseTask('buy paint #creative', TODAY);
  assert.equal(r.category, 'Creative');
  assert.equal(r.title, 'Buy paint');
});

test('plain text stays as the title', () => {
  assert.deepEqual(parseTask('think about life', TODAY), { title: 'Think about life' });
});

test('names that look like words are left alone', () => {
  assert.equal(parseTask('call tom', TODAY).due, undefined);
  assert.equal(parseTask('call tom', TODAY).title, 'Call tom');
});

test('shells come from finished tasks, and rocks every 10', () => {
  const base = { createdAt: '', size: 'big' as const };
  const tasks: Task[] = [
    { ...base, id: '1', title: 'a', category: 'School', doneAt: 'x', shellsEarned: 5 },
    { ...base, id: '2', title: 'b', category: 'School', doneAt: 'x', shellsEarned: 3 },
    { ...base, id: '3', title: 'c', category: 'Errands', shellsEarned: 5 },
  ];
  assert.equal(totalShells(tasks), 8);
  assert.equal(shellsByCategory(tasks).School, 8);
  assert.equal(shellsByCategory(tasks).Errands, 0);
  assert.equal(earnsRock(8, 1), false);
  assert.equal(earnsRock(8, 3), true);
  assert.equal(earnsRock(18, 5), true);
});
