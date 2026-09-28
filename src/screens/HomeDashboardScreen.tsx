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
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    ArrowRight,
    BatteryCharging,
    Bell,
    CheckCircle2,
    Clock,
    Database,
    Headphones,
    Home,
    Package,
    Plus,
    QrCode,
    Search,
    ShieldCheck,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Tag,
    TrendingUp,
    User,
    Users,
    Wrench,
} from 'lucide-react-native';

import { showComingSoon } from '../components/ComingSoon';
import { useAuth } from '../context/AuthContext';
import { useRepairsState } from '../context/RepairsContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { accentAlpha, radius, spacing } from '../theme';
import type { AppColors } from '../theme';
import { formatCurrency } from '../utils/format';
import { useTab } from './MainTabScreen';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};



/* ------------------------------------------------------------------ */
/*  Service tile data                                                  */
/* ------------------------------------------------------------------ */

type ServiceItem = {
    key: string;
    label: string;
    color: string;
    Icon: React.ComponentType<any>;
    live?: boolean; // only Repair is live right now
};

const SERVICES: ServiceItem[] = [
    { key: 'repair', label: 'Repairs', color: '#6366F1', Icon: Wrench, live: true },
    { key: 'buy_sell', label: 'Buy / Sell', color: '#F97316', Icon: Smartphone },
    { key: 'accessories', label: 'Accessories', color: '#EC4899', Icon: ShoppingBag },
    { key: 'warranty', label: 'Warranty', color: '#10B981', Icon: ShieldCheck },
    { key: 'offers', label: 'Offers', color: '#EF4444', Icon: Tag },
    { key: 'support', label: 'Helpdesk', color: '#06B6D4', Icon: Headphones },
];

const POPULAR_SERVICES = [
    { key: 'screen', label: 'Screen Replacement', desc: 'Original & OLED screens', Icon: Smartphone, color: '#3B82F6' },
    { key: 'battery', label: 'Battery Replacement', desc: 'High capacity cells', Icon: BatteryCharging, color: '#10B981' },
    { key: 'water', label: 'Water Damage Clean', desc: 'Ultrasonic board service', Icon: Sparkles, color: '#F59E0B' },
    { key: 'data', label: 'Data & Chip Recovery', desc: 'Dead phone storage extraction', Icon: Database, color: '#8B5CF6' },
];

/* ------------------------------------------------------------------ */
/*  Promo banners (carousel)                                           */
/* ------------------------------------------------------------------ */

type Banner = {
    key: string;
    title: string;
    subtitle?: string;
    cta: string;
    gradient: [string, string];
    ctaColor: string;
    badge?: string;
    repairs?: boolean; // CTA opens the repair flow
};

const BANNERS: Banner[] = [
    {
        key: 'expert',
        title: 'Precision Mobile\nRepair & Care',
        subtitle: 'Diagnostics, job cards & digital billing',
        cta: 'Open Repair Desk',
        gradient: ['#4F46E5', '#312E81'],
        ctaColor: '#4338CA',
        badge: 'Core Service',
        repairs: true,
    },
    {
        key: 'screen-offer',
        title: 'Instant Job\nEntry System',
        subtitle: 'Log IMEIs, passcodes & advance payment',
        cta: 'New Job Entry',
        gradient: ['#7C3AED', '#4C1D95'],
        ctaColor: '#6D28D9',
        badge: 'Fast Flow',
        repairs: true,
    },
    {
        key: 'parts',
        title: 'Spare Parts &\nStock Catalog',
        subtitle: 'Live stock count with auto deduction',
        cta: 'View Inventory',
        gradient: ['#059669', '#064E3B'],
        ctaColor: '#047857',
        badge: 'Stock Care',
    },
    {
        key: 'sell-phone',
        title: 'Refurbished &\nDevice Exchange',
        subtitle: 'Best value for used smartphone models',
        cta: 'Explore Trade-in',
        gradient: ['#EA580C', '#7C2D12'],
        ctaColor: '#C2410C',
        badge: 'Upcoming',
    },
];

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

function createStyles(colors: AppColors, mode: 'light' | 'dark') {
    const isDark = mode === 'dark';
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
            backgroundColor: isDark ? '#1E293B' : '#0F172A',
            borderWidth: 1,
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
            gap: 8,
        },
        iconBtn: {
            width: 40,
            height: 40,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
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
            borderWidth: 1,
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
        scanBtn: {
            width: 44,
            height: 44,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 3,
            elevation: 1,
        },

        /* Stat Insights */
        statsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 10,
            marginTop: spacing.xs,
            marginBottom: spacing.sm,
        },
        statCard: {
            width: '48.5%',
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 12,
            gap: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
        },
        statHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        statIconWrap: {
            width: 32,
            height: 32,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
        },
        statBadge: {
            fontSize: 10,
            fontWeight: '700',
            color: colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
        },
        statValue: {
            fontSize: 20,
            fontWeight: '900',
            color: colors.text,
            letterSpacing: -0.5,
        },
        statLabel: {
            fontSize: 12,
            fontWeight: '600',
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
            gap: 8,
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRadius: radius.lg,
            borderWidth: 1,
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
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 4,
        },
        bannerInner: { padding: spacing.md + 2, gap: 8 },
        bannerBadge: {
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.22)',
            paddingHorizontal: 9,
            paddingVertical: 3,
            borderRadius: radius.full,
        },
        bannerBadgeText: {
            color: '#FFFFFF',
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
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: 16,
        },
        bannerBtn: {
            alignSelf: 'flex-start',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderRadius: radius.full,
            marginTop: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
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
            borderWidth: 1,
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
            backgroundColor: 'rgba(16, 185, 129, 0.14)',
        },
        livePillText: {
            fontSize: 9,
            fontWeight: '800',
            letterSpacing: 0.4,
            color: '#10B981',
            textTransform: 'uppercase',
        },

        /* Popular services */
        popularScroll: { gap: 10, paddingRight: spacing.xs },
        popularCard: {
            width: 154,
            backgroundColor: colors.surface,
            borderWidth: 1,
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
            padding: spacing.md,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
            gap: 4,
        },
        trustRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
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
        backToHomePressable: {
            borderRadius: radius.full,
            overflow: 'hidden',
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 8,
        },
        backToHomeGradient: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 7,
            paddingHorizontal: 18,
            paddingVertical: 11,
            borderRadius: radius.full,
        },
        backToHomeText: {
            color: '#FFFFFF',
            fontSize: 13.5,
            fontWeight: '800',
            letterSpacing: 0.2,
        },
    });
}

/** Scroll distance (px) after which the floating "Back to home" pill appears. */
const BACK_TO_HOME_THRESHOLD = 320;

const gradientStyle = StyleSheet.absoluteFill;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HomeDashboardScreen({ navigation }: Props) {
    const { colors, mode } = useTheme();
    const styles = useMemo(() => createStyles(colors, mode), [colors, mode]);
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

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <LinearGradient
                colors={colors.bgGradient}
                style={gradientStyle}
                pointerEvents="none"
            />

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
                    <Pressable
                        onPress={() => showComingSoon('Notifications')}
                        style={styles.iconBtn}
                        android_ripple={{ color: accentAlpha(colors.accent, 0.15) }}
                        accessibilityRole="button"
                        accessibilityLabel="Notifications"
                    >
                        <Bell size={18} color={colors.text} strokeWidth={2.2} />
                    </Pressable>
                    <Pressable
                        onPress={() => setActiveTab('settings')}
                        style={styles.iconBtn}
                        android_ripple={{ color: accentAlpha(colors.accent, 0.15) }}
                        accessibilityRole="button"
                        accessibilityLabel={session ? 'Profile settings' : 'Sign in'}
                    >
                        <User size={18} color={colors.accent} strokeWidth={2.2} />
                    </Pressable>
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

                        <Pressable
                            onPress={handleScanQr}
                            style={styles.scanBtn}
                            android_ripple={{ color: accentAlpha(colors.accent, 0.15) }}
                            accessibilityRole="button"
                            accessibilityLabel="Scan QR code"
                        >
                            <QrCode size={20} color={colors.accent} strokeWidth={2.2} />
                        </Pressable>
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
                            <LinearGradient
                                key={banner.key}
                                colors={banner.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.banner, { width: bannerWidth, marginRight: 12 }]}
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
                                        android_ripple={{ color: 'rgba(0, 0, 0, 0.08)' }}
                                        accessibilityRole="button"
                                        accessibilityLabel={banner.cta}
                                    >
                                        <Text style={[styles.bannerBtnText, { color: banner.ctaColor }]}>
                                            {banner.cta}
                                        </Text>
                                        <ArrowRight size={16} color={banner.ctaColor} strokeWidth={2.6} />
                                    </Pressable>
                                </View>
                            </LinearGradient>
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
                            <Wrench size={16} color="#6366F1" strokeWidth={2.4} />
                            <Text style={styles.quickActionText} numberOfLines={1}>Job Desk</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleCustomers}
                            style={styles.quickActionItem}
                            android_ripple={{ color: accentAlpha(colors.accent, 0.1) }}
                            accessibilityRole="button"
                        >
                            <Users size={16} color="#059669" strokeWidth={2.4} />
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
                                            { backgroundColor: accentAlpha(service.color, 0.14) },
                                        ]}
                                    >
                                        <Icon size={22} color={service.color} strokeWidth={2.2} />
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
                        {POPULAR_SERVICES.map(({ key, label, desc, Icon, color }) => (
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
                                        { backgroundColor: accentAlpha(color, 0.14) },
                                    ]}
                                >
                                    <Icon size={22} color={color} strokeWidth={2.3} />
                                </View>
                                <Text style={styles.popularLabel}>{label}</Text>
                                <Text style={styles.popularDesc} numberOfLines={2}>
                                    {desc}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    {/* ── Trust strip ── */}
                    <View style={styles.trustBox}>
                        <View style={styles.trustRow}>
                            <View style={styles.trustLine} />
                            <Text style={styles.trustText}>Trusted by Hundreds</Text>
                            <View style={styles.trustLine} />
                        </View>
                        <Text style={styles.trustCaption}>
                            of Happy Customers • Your Device, Our Priority
                        </Text>
                    </View>
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
                <Pressable
                    onPress={handleBackToHome}
                    style={styles.backToHomePressable}
                    android_ripple={{
                        color: 'rgba(255, 255, 255, 0.3)',
                        borderless: true,
                        radius: radius.full,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Back to home"
                    accessibilityHint="Scrolls the home page back to the top"
                >
                    <LinearGradient
                        colors={['#8B5CF6', '#6366F1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.backToHomeGradient}
                    >
                        <Home size={16} color="#FFFFFF" strokeWidth={2.5} />
                        <Text style={styles.backToHomeText}>Back to home</Text>
                    </LinearGradient>
                </Pressable>
            </Animated.View>
        </SafeAreaView>
    );
}