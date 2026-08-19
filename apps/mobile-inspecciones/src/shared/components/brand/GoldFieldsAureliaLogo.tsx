import React from 'react';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';

interface Props {
  width?: number;
  height?: number;
  variant?: 'blue' | 'white';
}

export function GoldFieldsAureliaLogo({ width = 137, height = 44, variant = 'blue' }: Props) {
  const blue = variant === 'white' ? '#FFFFFF' : '#24588B';
  const muted = variant === 'white' ? 'rgba(255,255,255,0.68)' : '#6E87A7';
  const gold = '#C8A064';

  return (
    <Svg width={width} height={height} viewBox="0 0 137 44">
      <Circle cx={22} cy={22} r={20.5} fill="none" stroke={blue} strokeWidth={3} />
      <Path d="M22 9.5c-5.5 4.8-10.2 5-10.2 5 1.4 2 2 4.1 1.7 6.4-.6 4.9 2.7 9.1 8.5 12.5 5.8-3.4 9.1-7.6 8.5-12.5-.3-2.3.3-4.4 1.7-6.4 0 0-4.7-.2-10.2-5Z" fill="none" stroke={blue} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M15.5 18.2c2.2-1.8 4.2-2.6 6.5-2.6s4.3.8 6.5 2.6M17.4 23.4c1.5-1.3 3-1.9 4.6-1.9s3.1.6 4.6 1.9M20 28.1c.8-.6 1.4-.9 2-.9s1.2.3 2 .9" stroke={blue} strokeWidth={1.3} strokeLinecap="round" />
      <Rect x={48.5} y={8} width={88} height={11.2} fill={variant === 'white' ? '#FFFFFF' : blue} />
      <SvgText x={53} y={16.8} fontSize={8.2} fontWeight="700" letterSpacing={1.8} fill={variant === 'white' ? '#24588B' : '#FFFFFF'}>GOLD FIELDS</SvgText>
      <SvgText x={48.5} y={34} fontSize={18} letterSpacing={7.2} fill={muted}>AUREL</SvgText>
      <SvgText x={120} y={34} fontSize={18} letterSpacing={0} fill={gold}>IA</SvgText>
    </Svg>
  );
}
