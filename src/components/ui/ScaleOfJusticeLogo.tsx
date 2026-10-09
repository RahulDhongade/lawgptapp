import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

export interface ScaleOfJusticeLogoProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

export const ScaleOfJusticeLogo: React.FC<ScaleOfJusticeLogoProps> = ({ size = 32, style }) => {
  return (
    <Image
      source={require('../../../assets/logo.png')}
      style={[
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.22),
        },
        style,
      ]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="LawGPT Logo"
    />
  );
};
