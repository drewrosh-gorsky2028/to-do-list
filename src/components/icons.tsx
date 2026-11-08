import Svg, { Circle, Path } from 'react-native-svg';

export function CloudIcon({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 17h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 17z"
        fill="#FFFFFF"
        stroke="#3A4853"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M12 17l-2 4h3l-1.5 3" stroke="#3A4853" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SunIcon({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={4.5} fill="#FFD27A" stroke="#C7772A" strokeWidth={2} />
      <Path
        d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"
        stroke="#C7772A"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CheckIcon({ size = 16, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 26, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function TodayIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={2.2} />
      <Path d="M8.5 12.2l2.4 2.4 4.6-4.8" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function WeekIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V8A1.5 1.5 0 0 1 5 6.5z" stroke={color} strokeWidth={2.2} />
      <Path d="M3.5 10.5h17M8 4v4M16 4v4" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function StoneIcon({ size = 24, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 15.5c0-4.4 3.6-8 8.2-8 4.2 0 7.8 2.9 7.8 6.6 0 3-2.7 4.9-7.6 4.9C7.3 19 4 18 4 15.5z"
        stroke={color}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <Path d="M9 11.5c.8-.9 2-1.4 3.2-1.4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** A collectible rock, tinted with its category color. */
export function RockIcon({ size = 40, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Path d="M5 26c0-8 6.5-15 15.5-15C29 11 35 16.5 35 23.5 35 30 29.5 33 20 33 11 33 5 31 5 26z" fill={color} />
      <Path d="M12 19.5c2-2.6 5-4 8.2-4" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={2.6} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
