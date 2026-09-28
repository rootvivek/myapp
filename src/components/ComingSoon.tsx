import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Construction } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';
import type { AppColors } from '../theme';
import { accentAlpha, radius, spacing } from '../theme';

/** Global helper: show a lightweight "Coming Soon" alert for any feature. */
export function showComingSoon(feature: string): void {
    Alert.alert('🚧 Coming Soon', `${feature} is coming soon. Stay tuned!`);
}

type ScreenProps = {
    title: string;
    description?: string;
    icon?: React.ReactNode;
};

function createStyles(colors: AppColors) {
    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.bg },
        container: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
        },
        iconWrap: {
            width: 88,
            height: 88,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: accentAlpha(colors.accent, 0.12),
            borderWidth: 1,
            borderColor: accentAlpha(colors.accent, 0.25),
            marginBottom: spacing.md,
        },
        badge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: radius.full,
            backgroundColor: accentAlpha(colors.accent, 0.14),
            borderWidth: 1,
            borderColor: accentAlpha(colors.accent, 0.3),
            marginBottom: spacing.md,
        },
        badgeText: {
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 0.4,
            color: colors.accent,
            textTransform: 'uppercase',
        },
        title: {
            fontSize: 22,
            fontWeight: '800',
            color: colors.text,
            textAlign: 'center',
            marginBottom: spacing.sm,
        },
        description: {
            fontSize: 14.5,
            lineHeight: 21,
            color: colors.textMuted,
            textAlign: 'center',
        },
    });
}

/** Full-screen placeholder for features that are not live yet. */
export function ComingSoonScreen({ title, description, icon }: ScreenProps) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.container}>
                <View style={styles.iconWrap}>
                    {icon ?? <Construction size={38} color={colors.accent} strokeWidth={2.2} />}
                </View>

                <View style={styles.badge}>
                    <Construction size={13} color={colors.accent} strokeWidth={2.4} />
                    <Text style={styles.badgeText}>Coming Soon</Text>
                </View>

                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>
                    {description ??
                        `The ${title} feature is under construction. Repair is fully live today — more modules are on the way.`}
                </Text>
            </View>
        </SafeAreaView>
    );
}