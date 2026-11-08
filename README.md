# Pebble

A personal to-do app with Pebble, an otter who carries his favorite rock. One codebase for phone (iOS, Android) and web, built with Expo.

## Run it

```bash
npm install
npm run web        # opens in the browser (at /pebble-to-do)
npm start          # scan the QR code with the Expo Go app on your phone
```

## Check it

```bash
npm test           # the sentence reader and shell math
npm run typecheck
npm run build:web  # static web build in dist/
```

## What's here (step 1)

- **Today**: overdue tasks under a storm cloud, today's tasks, and what's coming up. Pebble sits in the corner and changes mood (judging when something is overdue, rainy at 3 or more, sleepy late at night).
- **Add**: type a sentence like `essay due friday, big` and Pebble fills in the category, size and due date as chips you can tap to fix. Or use the form.
- **Finish**: tap the circle (or the storm cloud) for the stone splash. Small, medium and big tasks earn 1, 3 and 5 shells, and every 10 shells in a category earns a rock. Tap a finished task's check to undo it.
- **Pebble tab**: the rock shelf, with progress to the next rock in each category.

Tasks are saved on the device for now. Supabase sync comes later.

## Layout

- `src/app/` screens (Expo Router): Today, Week, Pebble
- `src/components/` the tab bar, Add sheet, task row and Pebble himself
- `src/lib/` plain logic with no React: the sentence reader, dates, shells and Pebble's lines
- `src/pebble/art.ts` Pebble's six moods as SVG, from the approved art
- `tests/` run with Node's built-in test runner

## Build order

1. Today, Add and Finish with Pebble (this step)
2. Week view and repeating tasks
3. Pebble tab: den, shop, rocks, outfits
4. Notifications and the nightly "Plan tomorrow"
5. Two-way Google Calendar sync

## Web address

Every merge to `main` publishes the web app to https://drewrosh-gorsky2028.github.io/pebble-to-do/ (see `.github/workflows/deploy-web.yml`).
