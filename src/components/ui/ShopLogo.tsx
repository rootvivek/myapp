import React, { useState } from 'react';
import { Image, StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { Store } from 'lucide-react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { radius, sizes } from '../../theme';

export interface ShopLogoProps {
  /** Optional logo image URI (remote or local). */
  uri?: string | null;
  /** Size of the logo container (width and height). Defaults to 44. */
  size?: number;
  /** Container style overrides. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Image style overrides. */
  imageStyle?: StyleProp<ImageStyle>;
  /** Fallback icon or node if URI fails or is absent. */
  fallbackIcon?: React.ReactNode;
}

/**
  * Centralized shop logo component with fallback handling, shadow, and border styling
  * tied directly to the design system (`src/theme.ts`).
  */
export function ShopLogo({
  uri,
  size = 44,
  containerStyle,
  imageStyle,
  fallbackIcon,
}: ShopLogoProps) {
  const { colors } = useAppTheme();
  const [hasError, setHasError] = useState(false);

  const showImage = Boolean(uri) && !hasError;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.md,
          overflow: 'hidden',
          backgroundColor: colors.surface2,
          borderWidth: sizes.hairline,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
        containerStyle,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={[{ width: size, height: size }, imageStyle]}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : uri && hasError ? (
        // If remote image failed, try fallback asset or icon
        <Image
          source={require('../../../assets/icon.png')}
          style={[{ width: size, height: size }, imageStyle]}
          resizeMode="cover"
        />
      ) : (
        fallbackIcon || (
          <Store size={size * 0.45} color={colors.textMuted} strokeWidth={2} />
        )
      )}
    </View>
  );
}
