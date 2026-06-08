import { useMemo } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { StatusChip } from './StatusChip';

import { useTheme } from '../context/ThemeContext';
import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { RepairStatus } from '../types/repair';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type StatusFilter = 'all' | RepairStatus;

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
    statusFilter: StatusFilter;
    onStatusFilterChange: (key: StatusFilter) => void;
};

/* ------------------------------------------------------------------ */
/*  Filter chips data                                                  */
/* ------------------------------------------------------------------ */

const FILTER_CHIPS: readonly { key: StatusFilter; label: string; icon: string }[] = [
    { key: 'all', label: 'All', icon: '📋' },
    { key: 'pending', label: 'Pending', icon: '⏳' },
    { key: 'in_progress', label: 'In Progress', icon: '🔄' },
    { key: 'completed', label: 'Repaired', icon: '✅' },
    { key: 'delivered', label: 'Delivered', icon: '📦' },
    { key: 'cancelled', label: 'Cancelled', icon: '❌' },
] as const;

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

function createStyles(colors: AppColors) {
    const s = StyleSheet.create({
        topContainer: {
            backgroundColor: colors.surface,
            borderBottomWidth: 0,
            borderBottomColor: colors.border,
            // Premium glassmorphism shadow
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
            elevation: 3,
        },
        headerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingTop: spacing.md,
            paddingBottom: spacing.sm,
            gap: spacing.sm,
        },
        headerLeft: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            minWidth: 0,
            gap: spacing.sm,
        },

        logoWrap: { width: 32, height: 32, borderRadius: 10, overflow: 'hidden' },
        logo: { width: 32, height: 32 },
        title: {
            flex: 1,
            minWidth: 0,
            color: colors.text,
            fontSize: 18,
            fontWeight: '800',
            textAlign: 'left',
            letterSpacing: -0.5,
        },
        searchBtn: {
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface2,
        },
        searchBtnText: { color: colors.text, fontWeight: '600', fontSize: 13 },

        filterSection: {
            paddingHorizontal: spacing.sm,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        filterScroll: { flexGrow: 0 },
        filterChipsContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 4,
        },
    });
    return s as typeof s & { logo: import('react-native').ImageStyle };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HomeHeader({ navigation, statusFilter, onStatusFilterChange }: Props) {
    const { colors, mode } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <>
            {/* ── Header row ── */}
            <View style={styles.topContainer}>
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        <View style={styles.logoWrap}>
                            <Image
                                source={require('../../assets/app-logo.jpg')}
                                style={styles.logo}
                                resizeMode="cover"
                            />
                        </View>
                        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                            MCA Phone Wala
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => navigation.navigate('Search')}
                        style={styles.searchBtn}
                        android_ripple={{ color: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)' }}
                    >
                        <Text style={styles.searchBtnText}>🔍 Search</Text>
                    </Pressable>
                </View>
            </View>

            {/* ── Filter chips ── */}
            <View style={styles.filterSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipsContent}
                    style={styles.filterScroll}
                >
                    {FILTER_CHIPS.map(({ key, label, icon }) => {
                        const active = statusFilter === key;
                        return (
                            <StatusChip
                                key={key}
                                variant="filter"
                                label={label}
                                icon={icon}
                                active={active}
                                onPress={() => onStatusFilterChange(key)}
                            />
                        );
                    })}
                </ScrollView>
            </View>
        </>
    );
}