import React from 'react';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native-paper';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

export interface AppActivityIndicatorProps extends Omit<ActivityIndicatorProps, 'theme' | 'color'> {
  containerStyle?: StyleProp<ViewStyle>;
  size?: 'small' | 'large';
  color?: string;
}

const AppActivityIndicator = ({
  containerStyle,
  size = 'large',
  color,
  animating = true,
  ...rest
}: AppActivityIndicatorProps) => {
  const { colors } = useAppTheme();

  return (
    <ActivityIndicator
      animating={animating}
      size={size}
      color={color || colors.accent}
      theme={{
        colors: {
          primary: colors.accent,
        },
      }}
      style={containerStyle}
      {...rest}
    />
  );
};

export { AppActivityIndicator };