import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { Colors } from '@/constants/colors';

interface LeafLogoProps {
  size?: number;
  color?: string;
}

export const LeafLogo: React.FC<LeafLogoProps> = ({
  size = 48,
  color = Colors.forestGreen,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <G>
        {/* Left / Main leaf */}
        <Path
          d="M32 54C32 54 20 48 16 36C12 24 18 12 34 10C34 10 32 20 35 28C38 36 44 42 44 42C44 42 36 46 32 54Z"
          fill={color}
        />
        {/* Right / Accent leaf */}
        <Path
          d="M36 28C36 28 44 26 48 20C52 14 50 8 46 8C42 8 36 12 34 18C33 21 34 25 36 28Z"
          fill={color}
          opacity={0.88}
        />
        {/* Central delicate stem curve */}
        <Path
          d="M32 54C32 46 33 34 35 24"
          stroke="#FAF9F6"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </G>
    </Svg>
  );
};

export default LeafLogo;
