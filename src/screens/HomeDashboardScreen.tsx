import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Easing,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    ArrowRight,
    BatteryCharging,
    Bell,
    Database,
    Headphones,
    Home,
    Plus,
    QrCode,
    Search,
    ShieldCheck,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Tag,
    User,
    Users,
    Wrench,
} from 'lucide-react-native';

import { showComingSoon } from '../components/ComingSoon';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { AppIconButton } from '../components/ui/AppIconButton';
import { useAuth } from '../context/AuthContext';
import { useRepairsState } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { accentAlpha, radius, sizes, spacing } from '../theme';
import type { AppColors } from '../theme';
import { useTab } from '../context/TabContext';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};



/* ------------------------------------------------------------------ */
/*  Service tile data                                                  */
/* ------------------------------------------------------------------ */

type ServiceItem = {
    key: string;
    label: string;
    /** Category identity tint. Brand services omit it → app accent colour. */
    color?: string;
    Icon: React.ComponentType<any>;
    live?: boolean; // only Repair is live right now
};

const SERVICES: ServiceItem[] = [
    { key: 'repair', label: 'Repairs', Icon: Wrench, live: true },
    { key: 'buy_sell', label: 'Buy / Sell', color: '#F97316', Icon: Smartphone },
    { key: 'accessories', label: 'Accessories', color: '#EC4899', Icon: ShoppingBag },
    { key: 'warranty', label: 'Warranty', color: '#10B981', Icon: ShieldCheck },
    { key: 'offers', label: 'Offers', color: '#EF4444', Icon: Tag },
    { key: 'support', label: 'Helpdesk', color: '#06B6D4', Icon: Headphones },
];

type PopularService = {
    key: string;
    label: string;
    desc: string;
    Icon: React.ComponentType<any>;
    /** Category identity tint. Brand services omit it → app accent colour. */
    color?: string;
};

const POPULAR_SERVICES: PopularService[] = [
    { key: 'screen', label: 'Screen Replacement', desc: 'Original & OLED screens', Icon: Smartphone },
    { key: 'battery', label: 'Battery Replacement', desc: 'High capacity cells', Icon: BatteryCharging, color: '#10B981' },
    { key: 'water', label: 'Water Damage Clean', desc: 'Ultrasonic board service', Icon: Sparkles, color: '#F59E0B' },
    { key: 'data', label: 'Data & Chip Recovery', desc: 'Dead phone storage extraction', Icon: Database },
];

/* ------------------------------------------------------------------ */
/*  Promo banners (carousel)                                           */
/* ------------------------------------------------------------------ */

type Banner = {
    key: string;
    title: string;
    subtitle?: string;
    cta: string;
    /** Flat identity fill of the tile (no gradients), resolved from design tokens. */
    color: 'accent' | 'success' | 'warning' | 'danger';
    badge?: string;
    repairs?: boolean; // CTA opens the repair flow
};

const BANNERS: Banner[] = [
    {
        key: 'expert',
        title: 'Precision Mobile\nRepair & Care',
        subtitle: 'Diagnostics, job cards & digital billing',
        cta: 'Open Repair Desk',
        color: 'accent',
        badge: 'Core Service',
        repairs: true,
    },
    {
        key: 'screen-offer',
        title: 'Instant Job\nEntry System',
        subtitle: 'Log IMEIs, passcodes & advance payment',
        cta: 'New Job Entry',
        color: 'success',
        badge: 'Fast Flow',
        repairs: true,
    },
    {
        key: 'parts',
        title: 'Spare Parts &\nStock Catalog',
        subtitle: 'Live stock count with auto deduction',
        cta: 'View Inventory',
        color: 'warning',
        badge: 'Stock Care',
    },
    {
        key: 'sell-phone',
        title: 'Refurbished &\nDevice Exchange',
        subtitle: 'Best value for used smartphone models',
        cta: 'Explore Trade-in',
        color: 'danger',
        badge: 'Upcoming',
    },
];

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

function createStyles(colors: AppColors) {
    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.bg },
        scroll: { paddingBottom: 96 },
        content: { paddingHorizontal: spacing.md },

        /* Header */
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
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
        logoBox: {
            width: 44,
            height: 44,
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
        logo: { width: 44, height: 44 },
        brandTitleWrap: {
            flex: 1,
            justifyContent: 'center',
        },
        brandTitle: {
            fontSize: 17,
            fontWeight: '800',
            letterSpacing: 0.3,
            color: colors.text,
        },
        brandSubtitle: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.textMuted,
            marginTop: 1,
        },
        headerActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
        },

        /* Search & Scanner bar */
        searchRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginTop: spacing.xs,
            marginBottom: spacing.sm,
        },
        searchBar: {
            flex: 1,
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: spacing.md,
            borderRadius: radius.lg,
            borderWidth: sizes.hairline,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
        },
        searchText: {
            flex: 1,
            fontSize: 13.5,
            fontWeight: '500',
            color: colors.textMuted,
        },

        /* Quick Action Row */
        quickActionBar: {
            flexDirection: 'row',
            gap: 10,
            marginTop: spacing.sm,
            marginBottom: spacing.xs,
        },
        quickActionItem: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingVertical: 12,
            paddingHorizontal: spacing.sm,
            borderRadius: radius.lg,
            borderWidth: sizes.hairline,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
        },
        quickActionText: {
            fontSize: 12.5,
            fontWeight: '700',
            color: colors.text,
        },

        /* Promo banner carousel */
        bannerRow: {
            marginTop: spacing.xs,
        },
        banner: {
            borderRadius: radius.xl,
            overflow: 'hidden',
        },
        bannerInner: { padding: spacing.md + 2, gap: spacing.sm },
        bannerBadge: {
            alignSelf: 'flex-start',
            backgroundColor: colors.surface,
            paddingHorizontal: 9,
            paddingVertical: 3,
            borderRadius: radius.full,
        },
        bannerBadgeText: {
            color: colors.text,
            fontSize: 10.5,
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: 0.6,
        },
        bannerTitle: {
            fontSize: 20,
            fontWeight: '900',
            color: '#FFFFFF',
            lineHeight: 26,
        },
        bannerSubtitle: {
            fontSize: 12,
            fontWeight: '500',
            color: '#FFFFFF',
            lineHeight: 16,
        },
        bannerBtn: {
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: spacing.md,
            paddingVertical: 9,
            borderRadius: radius.full,
            marginTop: spacing.xs,
        },
        bannerBtnText: {
            fontSize: 13,
            fontWeight: '800',
        },

        /* Services grid */
        sectionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.lg,
            marginBottom: spacing.sm,
        },
        sectionTitleWrap: {
            gap: 2,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: 0.2,
        },
        sectionSubtitle: {
            fontSize: 11.5,
            color: colors.textMuted,
            fontWeight: '500',
        },
        seeAll: {
            fontSize: 13,
            fontWeight: '700',
            color: colors.accent,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
        },
        tile: {
            width: '31.3%',
            backgroundColor: colors.surface,
            borderWidth: sizes.hairline,
            borderColor: colors.border,
            borderRadius: radius.lg,
            paddingVertical: 14,
            paddingHorizontal: 6,
            alignItems: 'center',
            gap: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 3,
            elevation: 1,
        },
        tileIcon: {
            width: 44,
            height: 44,
            borderRadius: radius.full,
            alignItems: 'center',
            justifyContent: 'center',
        },
        tileLabel: {
            fontSize: 12.5,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
        },
        soonPill: {
            marginTop: 2,
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: radius.full,
            backgroundColor: accentAlpha(colors.textMuted, 0.12),
        },
        soonPillText: {
            fontSize: 9,
            fontWeight: '800',
            letterSpacing: 0.4,
            color: colors.textMuted,
            textTransform: 'uppercase',
        },
        livePill: {
            marginTop: 2,
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: radius.full,
            backgroundColor: accentAlpha(colors.success, 0.14),
        },
        livePillText: {
            fontSize: 9,
            fontWeight: '800',
            letterSpacing: 0.4,
            color: colors.success,
            textTransform: 'uppercase',
        },

        /* Popular services */
        popularScroll: { gap: 10, paddingRight: spacing.xs },
        popularCard: {
            width: 154,
            backgroundColor: colors.surface,
            borderWidth: sizes.hairline,
            borderColor: colors.border,
            borderRadius: radius.lg,
            padding: spacing.sm + 2,
            gap: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
        },
        popularIcon: {
            width: 40,
            height: 40,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 2,
        },
        popularLabel: {
            fontSize: 13,
            fontWeight: '700',
            color: colors.text,
            lineHeight: 17,
        },
        popularDesc: {
            fontSize: 11,
            fontWeight: '500',
            color: colors.textMuted,
            lineHeight: 15,
        },

        /* Trust strip */
        trustBox: {
            marginTop: spacing.xl,
            alignItems: 'center',
            gap: spacing.xs,
        },
        trustRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
        },
        trustLine: {
            flex: 1,
            height: StyleSheet.hairlineWidth,
            backgroundColor: colors.border,
        },
        trustText: {
            fontSize: 13,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: 0.2,
        },
        trustCaption: {
            fontSize: 11,
            color: colors.textMuted,
            fontWeight: '500',
            textAlign: 'center',
        },

        /* Floating "Back to home" pill (bottom center, appears on scroll) */
        backToHomeLayer: {
            position: 'absolute',
            left: 0,
            right: 0,
            alignItems: 'center',
            justifyContent: 'center',
        },
        backToHomePill: {
            borderRadius: radius.full,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 8,
            elevation: 2,
        },
    });
}

/** Scroll distance (px) after which the floating "Back to home" pill appears. */
const BACK_TO_HOME_THRESHOLD = 320;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HomeDashboardScreen({ navigation }: Props) {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);
    const { width: windowWidth } = useWindowDimensions();
    const bannerWidth = windowWidth - spacing.md * 2;
    const { setActiveTab } = useTab();
    const { session, profile, isOwner } = useAuth();
    const { repairs } = useRepairsState();

    /* ── Floating "Back to home" pill (smooth-scrolls the page back to top) ── */
    const insets = useSafeAreaInsets();
    const scrollRef = useRef<ScrollView>(null);
    const backToHomeAnim = useRef(new Animated.Value(0)).current;
    const [showBackToHome, setShowBackToHome] = useState(false);

    const showBackToHomeRef = useRef(false);

    /* ── Auto-swipe promo banners ── */
    const bannerScrollRef = useRef<ScrollView>(null);
    const bannerIndexRef = useRef(0);

    useEffect(() => {
        const interval = setInterval(() => {
            if (bannerScrollRef.current && BANNERS.length > 1) {
                bannerIndexRef.current = (bannerIndexRef.current + 1) % BANNERS.length;
                bannerScrollRef.current.scrollTo({
                    x: bannerIndexRef.current * (bannerWidth + 12),
                    animated: true,
                });
            }
        }, 4000);
        return () => clearInterval(interval);
    }, [bannerWidth]);

    const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset } = e.nativeEvent;
        const y = contentOffset ? contentOffset.y : 0;
        const shouldShow = y > BACK_TO_HOME_THRESHOLD;
        if (showBackToHomeRef.current !== shouldShow) {
            showBackToHomeRef.current = shouldShow;
            setShowBackToHome(shouldShow);
        }
    }, []);

    const handleBackToHome = useCallback(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        setShowBackToHome(false);
    }, []);

    useEffect(() => {
        Animated.timing(backToHomeAnim, {
            toValue: showBackToHome ? 1 : 0,
            duration: showBackToHome ? 190 : 140,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [showBackToHome, backToHomeAnim]);

    const backToHomeAnimStyle = useMemo(
        () => ({
            opacity: backToHomeAnim,
            transform: [
                {
                    translateY: backToHomeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                    }),
                },
            ],
        }),
        [backToHomeAnim]
    );

    const pendingCount = useMemo(
        () => repairs.filter((r) => r.status === 'pending' || r.status === 'in_progress').length,
        [repairs]
    );
    const readyCount = useMemo(
        () => repairs.filter((r) => r.status === 'completed').length,
        [repairs]
    );
    const duesTotal = useMemo(() => {
        return repairs.reduce((sum, r) => {
            const cost = Number(r.repairCost) || 0;
            const adv = Number(r.advanceAmount) || 0;
            const due = Math.max(0, cost - adv);
            return sum + (r.isPaid ? 0 : due);
        }, 0);
    }, [repairs]);

    const handleOpenRepairs = useCallback(() => {
        if (!session) {
            setActiveTab('settings');
            return;
        }
        setActiveTab('jobs');
    }, [session, setActiveTab]);

    const handleNewRepair = useCallback(() => {
        if (!session) {
            setActiveTab('settings');
            return;
        }
        navigation.navigate('AddRepair', {});
    }, [session, setActiveTab, navigation]);

    const handleSearch = useCallback(() => {
        if (!session) {
            setActiveTab('settings');
            return;
        }
        navigation.navigate('Search');
    }, [session, setActiveTab, navigation]);

    const handleScanQr = useCallback(() => {
        if (!session) {
            setActiveTab('settings');
            return;
        }
        navigation.navigate('ScanQr');
    }, [session, setActiveTab, navigation]);

    const handleCustomers = useCallback(() => {
        if (!session) {
            setActiveTab('settings');
            return;
        }
        navigation.navigate('CustomerDirectory');
    }, [session, setActiveTab, navigation]);

    const handleServicePress = useCallback(
        (service: ServiceItem) => {
            if (service.live) {
                handleOpenRepairs();
                return;
            }
            showComingSoon(service.label);
        },
        [handleOpenRepairs]
    );

    const shopTitle = profile?.shopName || 'MCA Phone Wala';

    /** Flat tile fills for the promo banners, resolved from the active theme. */
    const bannerTints: Record<Banner['color'], string> = {
        accent: colors.accent,
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>

            {/* ── Brand header ── */}
            <View style={styles.header}>
                <View style={styles.brandWrap}>
                    <View style={styles.logoBox}>
                        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="cover" />
                    </View>
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
                        icon={<Bell size={18} color={colors.text} strokeWidth={2.2} />}
                        onPress={() => showComingSoon('Notifications')}
                        accessibilityRole="button"
                        accessibilityLabel="Notifications"
                    />
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

            <ScrollView
                ref={scrollRef}
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                <View style={styles.content}>
                    {/* ── Search & Scan bar ── */}
                    <View style={styles.searchRow}>
                        <Pressable
                            onPress={handleSearch}
                            style={styles.searchBar}
                            android_ripple={{ color: accentAlpha(colors.accent, 0.1) }}
                            accessibilityRole="button"
                            accessibilityLabel="Search repairs, customers, or devices"
                        >
                            <Search size={18} color={colors.textMuted} strokeWidth={2.2} />
                            <Text style={styles.searchText} numberOfLines={1}>
                                Search job card, phone, customer...
                            </Text>
                        </Pressable>

                        <AppIconButton
                            variant="secondary"
                            size={44}
                            icon={<QrCode size={20} color={colors.accent} strokeWidth={2.2} />}
                            onPress={handleScanQr}
                            accessibilityRole="button"
                            accessibilityLabel="Scan QR code"
                        />
                    </View>

                    <ScrollView
                        ref={bannerScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={bannerWidth + 12}
                        decelerationRate="fast"
                        contentContainerStyle={styles.bannerRow}
                        accessibilityLabel="Promotional banners"
                    >
                        {BANNERS.map((banner) => (
                            <AppCard
                                key={banner.key}
                                variant="elevated"
                                padding={0}
                                containerStyle={[
                                    styles.banner,
                                    { width: bannerWidth, marginRight: 12, backgroundColor: bannerTints[banner.color] },
                                ]}
                            >
                                <View style={styles.bannerInner}>
                                    {banner.badge ? (
                                        <View style={styles.bannerBadge}>
                                            <Text style={styles.bannerBadgeText}>{banner.badge}</Text>
                                        </View>
                                    ) : null}
                                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                                    {banner.subtitle ? (
                                        <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                                    ) : null}
                                    <Pressable
                                        onPress={() =>
                                            banner.repairs
                                                ? handleOpenRepairs()
                                                : showComingSoon(banner.title.replace('\n', ' '))
                                        }
                                        style={styles.bannerBtn}
                                        android_ripple={{ color: accentAlpha(colors.accent, 0.1) }}
                                        accessibilityRole="button"
                                        accessibilityLabel={banner.cta}
                                    >
                                        <Text style={[styles.bannerBtnText, { color: bannerTints[banner.color] }]}>
                                            {banner.cta}
                                        </Text>
                                        <ArrowRight size={16} color={bannerTints[banner.color]} strokeWidth={2.6} />
                                    </Pressable>
                                </View>
                            </AppCard>
                        ))}
                    </ScrollView>

                    {/* ── Quick action shortcuts ── */}
                    <View style={styles.quickActionBar}>
                        <Pressable
                            onPress={handleNewRepair}
                            style={styles.quickActionItem}
                            android_ripple={{ color: accentAlpha(colors.accent, 0.1) }}
                            accessibilityRole="button"
                        >
                            <Plus size={16} color={colors.accent} strokeWidth={2.6} />
                            <Text style={styles.quickActionText} numberOfLines={1}>New Repair</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleOpenRepairs}
                            style={styles.quickActionItem}
                            android_ripple={{ color: accentAlpha(colors.accent, 0.1) }}
                            accessibilityRole="button"
                        >
                            <Wrench size={16} color={colors.accent} strokeWidth={2.4} />
                            <Text style={styles.quickActionText} numberOfLines={1}>Job Desk</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleCustomers}
                            style={styles.quickActionItem}
                            android_ripple={{ color: accentAlpha(colors.accent, 0.1) }}
                            accessibilityRole="button"
                        >
                            <Users size={16} color={colors.accent} strokeWidth={2.4} />
                            <Text style={styles.quickActionText} numberOfLines={1}>Customers</Text>
                        </Pressable>
                    </View>

                    {/* ── Services grid ── */}
                    <View style={styles.sectionRow}>
                        <View style={styles.sectionTitleWrap}>
                            <Text style={styles.sectionTitle}>Our Services</Text>
                            <Text style={styles.sectionSubtitle}>One tap for every counter service</Text>
                        </View>
                        <Pressable
                            onPress={() => showComingSoon('All services')}
                            accessibilityRole="button"
                        >
                            <Text style={styles.seeAll}>See All</Text>
                        </Pressable>
                    </View>

                    <View style={styles.grid}>
                        {SERVICES.map((service) => {
                            const { Icon } = service;
                            const tint = service.color ?? colors.accent;
                            return (
                                <Pressable
                                    key={service.key}
                                    onPress={() => handleServicePress(service)}
                                    style={styles.tile}
                                    android_ripple={{ color: accentAlpha(colors.accent, 0.1) }}
                                    accessibilityRole="button"
                                    accessibilityLabel={service.label}
                                >
                                    <View
                                        style={[
                                            styles.tileIcon,
                                            { backgroundColor: accentAlpha(tint, 0.14) },
                                        ]}
                                    >
                                        <Icon size={22} color={tint} strokeWidth={2.2} />
                                    </View>
                                    <Text style={styles.tileLabel}>{service.label}</Text>
                                    <View style={service.live ? styles.livePill : styles.soonPill}>
                                        <Text style={service.live ? styles.livePillText : styles.soonPillText}>
                                            {service.live ? 'Live' : 'Coming Soon'}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* ── Popular services ── */}
                    <View style={styles.sectionRow}>
                        <View style={styles.sectionTitleWrap}>
                            <Text style={styles.sectionTitle}>Popular Services</Text>
                            <Text style={styles.sectionSubtitle}>Most booked repairs this month</Text>
                        </View>
                        <Pressable
                            onPress={() => showComingSoon('Popular services')}
                            accessibilityRole="button"
                        >
                            <Text style={styles.seeAll}>See All</Text>
                        </Pressable>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.popularScroll}
                    >
                        {POPULAR_SERVICES.map(({ key, label, desc, Icon, color }) => {
                            const tint = color ?? colors.accent;
                            return (
                                <Pressable
                                    key={key}
                                    onPress={() => showComingSoon(label)}
                                    style={styles.popularCard}
                                    android_ripple={{ color: accentAlpha(colors.accent, 0.1) }}
                                    accessibilityRole="button"
                                    accessibilityLabel={label}
                                >
                                    <View
                                        style={[
                                            styles.popularIcon,
                                            { backgroundColor: accentAlpha(tint, 0.14) },
                                        ]}
                                    >
                                        <Icon size={22} color={tint} strokeWidth={2.3} />
                                    </View>
                                    <Text style={styles.popularLabel}>{label}</Text>
                                    <Text style={styles.popularDesc} numberOfLines={2}>
                                        {desc}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* ── Trust strip ── */}
                    <AppCard containerStyle={styles.trustBox}>
                        <View style={styles.trustRow}>
                            <View style={styles.trustLine} />
                            <Text style={styles.trustText}>Trusted by Hundreds</Text>
                            <View style={styles.trustLine} />
                        </View>
                        <Text style={styles.trustCaption}>
                            of Happy Customers • Your Device, Our Priority
                        </Text>
                    </AppCard>
                </View>
            </ScrollView>

            {/* ── Floating "Back to home" pill (bottom center, appears on scroll) ── */}
            <Animated.View
                pointerEvents={showBackToHome ? 'auto' : 'none'}
                style={[
                    styles.backToHomeLayer,
                    { bottom: Math.max(insets.bottom, spacing.lg) },
                    backToHomeAnimStyle,
                ]}
            >
                <AppButton
                    variant="primary"
                    leftIcon={<Home size={16} color="#FFFFFF" strokeWidth={2.5} />}
                    onPress={handleBackToHome}
                    accessibilityLabel="Back to home"
                    accessibilityHint="Scrolls the home page back to the top"
                    containerStyle={styles.backToHomePill}
                >
                    Back to home
                </AppButton>
            </Animated.View>
        </SafeAreaView>
    );
}