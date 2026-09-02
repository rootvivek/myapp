import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { accentAlpha } from '../theme';

export type ThreeDIconName =
  | 'jobs'
  | 'inventory'
  | 'new'
  | 'finance'
  | 'profile'
  | 'wrench'
  | 'package'
  | 'wallet';

type ThreeDIconProps = {
  name?: ThreeDIconName;
  size?: number;
  iconComponent?: React.ReactNode;
  gradientColors?: [string, string];
  style?: ViewStyle;
  active?: boolean;
};

const ICON_ASSETS: Record<ThreeDIconName, any> = {
  jobs: require('../assets/icons/jobs_tab.png'),
  inventory: require('../assets/icons/package.png'),
  new: require('../assets/icons/new_tab.png'),
  finance: require('../assets/icons/wallet.png'),
  profile: require('../assets/icons/profile_tab.png'),
  wrench: require('../assets/icons/wrench.png'),
  package: require('../assets/icons/package.png'),
  wallet: require('../assets/icons/wallet.png'),
};

/**
 * 3D Icon Renderer:
 * Renders high-resolution 3D asset PNGs or 3D glassmorphic badge containers for vector icons.
 */
export const ThreeDIcon = React.memo(function ThreeDIcon({
  name,
  size = 32,
  iconComponent,
  gradientColors,
  style,
  active = true,
}: ThreeDIconProps) {
  const { colors } = useTheme();

  if (name && ICON_ASSETS[name]) {
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, opacity: active ? 1.0 : 0.55 },
          style,
        ]}
      >
        <Image
          source={ICON_ASSETS[name]}
          style={{ width: size, height: size, borderRadius: size / 4 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Fallback: Glassmorphic 3D Bevel Vector Container
  const defaultGrad: [string, string] = gradientColors || [
    accentAlpha(colors.accent, active ? 0.25 : 0.1),
    accentAlpha(colors.accent, 0.05),
  ];

  return (
    <LinearGradient
      colors={defaultGrad}
      style={[
        styles.glassContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 3,
          borderColor: accentAlpha(colors.accent, active ? 0.4 : 0.15),
          opacity: active ? 1.0 : 0.6,
        },
        style,
      ]}
    >
      {iconComponent}
    </LinearGradient>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassContainer: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
