import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useTheme } from '../context/ThemeContext';
import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';

const DRAWER_WIDTH = Math.min(304, Math.round(Dimensions.get('window').width * 0.82));

type Props = {
  open: boolean;
  onClose: () => void;
  onPressShop: () => void;
  onPressCustomers: () => void;
  topInset: number;
};

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: 'row',
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    drawer: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      zIndex: 1,
      elevation: 20,
      shadowColor: '#000',
      shadowOffset: { width: 6, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    drawerTitle: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: spacing.lg,
    },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    menuTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    menuLabel: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    menuHint: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 3,
      fontWeight: '500',
    },
    chev: {
      color: colors.accent,
      fontSize: 26,
      fontWeight: '300',
      marginLeft: spacing.sm,
    },
  });
}

export function HomeSideMenu({ open, onClose, onPressShop, onPressCustomers, topInset }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    if (open) {
      translateX.setValue(-DRAWER_WIDTH);
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 65,
      }).start();
    }
  }, [open, translateX]);

  function closeAnimated(): void {
    Animated.timing(translateX, {
      toValue: -DRAWER_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onClose();
    });
  }

  function navigateAndClose(action: () => void): void {
    Animated.timing(translateX, {
      toValue: -DRAWER_WIDTH,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      onClose();
      requestAnimationFrame(() => action());
    });
  }

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeAnimated}
    >
      <View style={styles.root} pointerEvents={open ? 'auto' : 'box-none'}>
        <Pressable style={styles.backdrop} onPress={closeAnimated} accessibilityLabel="Close menu" />
        <Animated.View
          style={[
            styles.drawer,
            {
              width: DRAWER_WIDTH,
              paddingTop: topInset + spacing.md,
              transform: [{ translateX }],
            },
          ]}
        >
          <Text style={styles.drawerTitle}>Menu</Text>
          <Pressable
            onPress={() => navigateAndClose(onPressShop)}
            style={styles.menuRow}
            android_ripple={{ color: colors.border }}
          >
            <View style={styles.menuTextBlock}>
              <Text style={styles.menuLabel}>Shop & invoice</Text>
              <Text style={styles.menuHint}>Name, logo, sign out</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
          <Pressable
            onPress={() => navigateAndClose(onPressCustomers)}
            style={styles.menuRow}
            android_ripple={{ color: colors.border }}
          >
            <View style={styles.menuTextBlock}>
              <Text style={styles.menuLabel}>List of Customers</Text>
              <Text style={styles.menuHint}>Names & numbers from jobs</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
