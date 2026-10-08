import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radius, sizes, spacing } from '../theme';

type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  style,
}: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surface2,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function RepairCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.headerRow}>
        <Skeleton width="45%" height={18} borderRadius={radius.sm} />
        <Skeleton width="25%" height={24} borderRadius={radius.md} />
      </View>
      <Skeleton
        width="60%"
        height={14}
        borderRadius={radius.sm}
        style={{ marginTop: spacing.sm }}
      />
      <Skeleton
        width="80%"
        height={14}
        borderRadius={radius.sm}
        style={{ marginTop: spacing.xs + 2 }}
      />
      <View style={styles.footerRow}>
        <Skeleton width="30%" height={16} borderRadius={radius.sm} />
        <Skeleton width="35%" height={32} borderRadius={radius.sm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: sizes.hairline,
    padding: spacing.md - 2,
    marginBottom: spacing.sm + 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md - 2,
  },
});
