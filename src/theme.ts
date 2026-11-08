import type { Category } from './lib/types';

// Riverbank palette (locked in the design doc).
export const colors = {
  river: '#2F6F9F',
  riverDark: '#1F4F75',
  riverTint: '#DCE8F1',
  sand: '#E9DCC4',
  sandLight: '#F7F1E6',
  mist: '#F3F6F7',
  wetStone: '#1F2A33',
  card: '#FFFFFF',
  muted: '#4A5A66',
  body: '#3A4853',
  line: '#DCE3E7',
  overdue: '#DDE4E8',
  sunTint: '#FFF6DE',
  sun: '#FFD27A',
  splash: '#9CC3E0',
} as const;

export const categoryColors: Record<Category, string> = {
  School: '#3D6FB6',
  Social: '#C2527A',
  Creative: '#8A5CC2',
  Errands: '#C7772A',
  Chores: '#5F7F8C',
  Fitness: '#3E8E5A',
  Health: '#C24B4B',
};

export const fonts = {
  heading: 'Baloo2_800ExtraBold',
  headingBold: 'Baloo2_700Bold',
  body: 'NunitoSans_400Regular',
  bodySemi: 'NunitoSans_600SemiBold',
  bodyBold: 'NunitoSans_700Bold',
} as const;

export const eyebrow = {
  fontFamily: fonts.bodyBold,
  fontSize: 12,
  letterSpacing: 0.7,
  textTransform: 'uppercase' as const,
  color: colors.muted,
};

/** Content never gets wider than this on web. */
export const MAX_WIDTH = 640;

/** Width where web switches the bottom bar for a left sidebar. */
export const WIDE = 900;
