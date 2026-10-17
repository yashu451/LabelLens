import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/colors';

interface OrganicHeaderDecorationProps {
  color?: string;
  secondaryColor?: string;
}

export const OrganicHeaderDecoration: React.FC<OrganicHeaderDecorationProps> = ({
  color = Colors.leafGreen,
  secondaryColor = Colors.sageLight,
}) => {
  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width="180" height="180" viewBox="0 0 180 180" fill="none">
        {/* Soft larger outer organic curve */}
        <Path
          d="M60 0C60 45 100 95 180 110V0H60Z"
          fill={color}
          opacity={0.65}
        />
        {/* Inner deeper soft curve */}
        <Path
          d="M100 0C100 35 130 70 180 80V0H100Z"
          fill={secondaryColor}
          opacity={0.4}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 0,
  },
});

export default OrganicHeaderDecoration;
