import React from 'react';
import Svg, { Circle, Rect, Path, Line } from 'react-native-svg';
import { Colors } from '@/constants/theme';

interface LogoProps {
  size?: number;
}

export const Logo = ({ size = 100 }: LogoProps) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Magnifying Glass Handle */}
    <Line x1="62" y1="62" x2="84" y2="84" stroke={Colors.primaryOrange} strokeWidth="12" strokeLinecap="round" />
    
    {/* Magnifying Glass Circle */}
    <Circle cx="44" cy="44" r="30" fill="none" stroke={Colors.primaryOrange} strokeWidth="10" />
    
    {/* Food Label inside */}
    <Rect x="32" y="28" width="24" height="32" rx="3" fill={Colors.darkOrange} />
    <Line x1="37" y1="36" x2="51" y2="36" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="37" y1="44" x2="47" y2="44" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    <Line x1="37" y1="52" x2="49" y2="52" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Green Leaf Accent */}
    <Path d="M68,22 Q85,10 90,28 Q75,40 68,22 Z" fill="#22C55E" />
  </Svg>
);
