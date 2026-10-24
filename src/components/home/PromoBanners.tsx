import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../ui/AppCard';
import { useTheme } from '../../context/ThemeContext';
import type { AppColors } from '../../theme';
import { radius, sizes, spacing } from '../../theme';

export type BannerItem = {
    key: string;
    image: any; // Supports PNG/JPG image source (require or uri)
    repairs?: boolean;
    inventory?: boolean;
    support?: boolean;
};

type Props = {
    banners: BannerItem[];
    bannerWidth: number;
    onBannerPress: (banner: BannerItem) => void;
    scrollRef?: React.RefObject<ScrollView | null>;
};

function createStyles(colors: AppColors) {
    return StyleSheet.create({
        bannerRow: { gap: 12, paddingRight: spacing.gutter, marginBottom: spacing.md },
        banner: {
            borderRadius: radius.xl,
            overflow: 'hidden',
            height: 160,
            backgroundColor: colors.surface2,
        },
        bannerImage: {
            width: '100%',
            height: '100%',
        },
    });
}

export function PromoBanners({ banners, bannerWidth, onBannerPress, scrollRef }: Props) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
        <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={bannerWidth + 12}
            decelerationRate="fast"
            contentContainerStyle={styles.bannerRow}
            accessibilityLabel="Promotional banners"
        >
            {banners.map((banner) => (
                <AppCard
                    key={banner.key}
                    variant="elevated"
                    padding={0}
                    containerStyle={[
                        styles.banner,
                        { width: bannerWidth, marginRight: 12 },
                    ]}
                >
                    <Pressable
                        onPress={() => onBannerPress(banner)}
                        style={{ flex: 1 }}
                        accessibilityRole="button"
                        accessibilityLabel={`Banner ${banner.key}`}
                    >
                        <Image source={banner.image} style={styles.bannerImage} resizeMode="cover" />
                    </Pressable>
                </AppCard>
            ))}
        </ScrollView>
    );
}

