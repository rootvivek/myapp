import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { User } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTab } from '../../context/TabContext';
import { AppIconButton } from '../ui/AppIconButton';
import { ShopLogo } from '../ui/ShopLogo';
import type { AppColors } from '../../theme';
import { radius, sizes, spacing } from '../../theme';

function createStyles(colors: AppColors) {
    return StyleSheet.create({
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.gutter,
            paddingTop: spacing.xs,
            paddingBottom: spacing.sm,
            gap: 12,
        },
        brandWrap: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        brandTitleWrap: {
            flex: 1,
            justifyContent: 'center',
        },
        brandTitle: {
            fontSize: 17,
            fontWeight: '800',
            letterSpacing: 0.2,
            color: colors.text,
        },
        brandSubtitle: {
            fontSize: 11.5,
            fontWeight: '600',
            color: colors.textMuted,
            marginTop: 1,
        },
        headerActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
    });
}

export function HomeBrandHeader() {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { session, profile, isOwner } = useAuth();
    const { setActiveTab } = useTab();

    const shopTitle = profile?.shopName || 'MCA Phone Wala';
    const shopLogoUrl = profile?.shopLogoUrl;

    return (
        <View style={styles.header}>
            <View style={styles.brandWrap}>
                <ShopLogo uri={shopLogoUrl} size={44} />
                <View style={styles.brandTitleWrap}>
                    <Text style={styles.brandTitle} numberOfLines={1}>
                        {shopTitle}
                    </Text>
                    <Text style={styles.brandSubtitle}>
                        {session ? (isOwner ? 'Owner Dashboard' : 'Team Portal') : 'Mobile Repair & Care'}
                    </Text>
                </View>
            </View>

            <View style={styles.headerActions}>
                <AppIconButton
                    variant="secondary"
                    size={40}
                    icon={<User size={18} color={colors.accent} strokeWidth={2.2} />}
                    onPress={() => setActiveTab('settings')}
                    accessibilityRole="button"
                    accessibilityLabel={session ? 'Profile settings' : 'Sign in'}
                />
            </View>
        </View>
    );
}

