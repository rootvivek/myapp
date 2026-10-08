import React, { type ReactNode } from 'react';
import { Divider, type DividerProps } from 'react-native-paper';
import { type StyleProp, type ViewStyle } from 'react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

export interface AppDividerProps extends Omit<DividerProps, 'theme'> {
  containerStyle?: StyleProp<ViewStyle>;
}

/** Hairline separator built on Paper `Divider`. */
function AppDivider({ containerStyle, style, ...rest }: AppDividerProps) {
  const { colors } = useAppTheme();

  return (
    <Divider
      style={[{ backgroundColor: colors.border }, containerStyle, style]}
      {...rest}
    />
  );
}

export { AppDivider };
