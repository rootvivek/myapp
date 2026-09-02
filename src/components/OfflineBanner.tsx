import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

type OfflineBannerProps = {
  onRetry?: () => void;
};

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const { colors } = useTheme();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.danger || '#ef4444' }]}>
      <WifiOff size={16} color="#ffffff" style={styles.icon} />
      <Text style={styles.text}>Offline Mode — Changes will sync when reconnected</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={styles.retryBtn}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
        >
          <RefreshCw size={14} color="#ffffff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  retryBtn: {
    padding: 6,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
