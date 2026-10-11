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
    BookOpen,
    Database,
    Headphones,
    Home,
    QrCode,
    Search,
    ShieldCheck,
    ShoppingBag,
    Smartphone,
    Sparkles,
    User,
    Users,
    Wrench,
} from 'lucide-react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { AppButton } from '../components/ui/AppButton';
import { AppCard } from '../components/ui/AppCard';
import { AppIconButton } from '../components/ui/AppIconButton';
import { ThreeDIcon } from '../components/ui/ThreeDIcon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { accentAlpha, radius, sizes, spacing } from '../theme';
import type { AppColors } from '../theme';
import { useTab } from '../context/TabContext';
import { dialPhone } from '../utils/phone';

const HELPDESK_PHONE = '8881765192';

type Props = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};



/* ------------------------------------------------------------------ */
/*  Service tile data                                                  */
/* ------------------------------------------------------------------ */

type ServiceItem = {
    key: string;
    label: string;
    Icon: React.ComponentType<any>;
    /** Category identity tint. Brand services omit it → app accent colour. */
    color?: string;
    action?: 'jobs' | 'inventory' | 'helpdesk';
    route?: keyof RootStackParamList;
    requiresAuth?: boolean;
};
const SERVICES: ServiceItem[] = [
    { key: 'repair', label: 'Repairs', Icon: Wrench, action: 'jobs', requiresAuth: true },
    { key: 'khata_book', label: 'Khata Book', color: '#F97316', Icon: BookOpen, route: 'Khata', requiresAuth: true },
    { key: 'accessories', label: 'Accessories', color: '#EC4899', Icon: ShoppingBag, action: 'inventory', requiresAuth: true },
    { key: 'warranty', label: 'Warranty', color: '#10B981', Icon: ShieldCheck, action: 'jobs', requiresAuth: true },
    { key: 'customers', label: 'Customers', Icon: Users, route: 'CustomerDirectory', requiresAuth: true },
    { key: 'support', label: 'Helpdesk', color: '#06B6D4', Icon: Headphones, action: 'helpdesk' },
];

type PopularService = {
    key: string;
    label: string;
    Icon: React.ComponentType<any>;
    /** Category identity tint. Brand services omit it → app accent colour. */
    color?: string;
};

const POPULAR_SERVICES: PopularService[] = [
    { key: 'screen', label: 'Screen Replacement', Icon: Smartphone },
    { key: 'battery', label: 'Battery Replacement', Icon: BatteryCharging, color: '#10B981' },
    { key: 'water', label: 'Water Damage Clean', Icon: Sparkles, color: '#F59E0B' },
    { key: 'data', label: 'Data & Chip Recovery', Icon: Database },
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
    inventory?: boolean;
    support?: boolean;
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
        inventory: true,
    },
    {
        key: 'helpdesk',
        title: 'Need help with\nyour device?',
        subtitle: 'Call our team for repair support',
        cta: 'Contact Helpdesk',
        color: 'danger',
        support: true,
    },
];

/** Decorative, locally-rendered mobile shop artwork for each promo banner. */
function BannerArtwork({ type }: { type: Banner['key'] }) {
    const screenColor = type === 'parts' ? '#FDBA74' : type === 'helpdesk' ? '#67E8F9' : '#A5B4FC';

    return (
        <Svg width="100%" height="100%" viewBox="0 0 156 180" preserveAspectRatio="xMidYMid slice">
            <Circle cx="111" cy="90" r="68" fill="#FFFFFF" fillOpacity={0.13} />
            <Circle cx="143" cy="37" r="23" fill="#FFFFFF" fillOpacity={0.1} />
            <Path d="M66 180 144 84l42 96H66Z" fill="#FFFFFF" fillOpacity={0.08} />

            {/* Smartphone with a colorful service screen */}
            <G rotation={8} origin="111, 99">
                <Rect x="86" y="36" width="54" height="112" rx="13" fill="#111827" fillOpacity={0.3} />
                <Rect x="83" y="31" width="54" height="112" rx="13" fill="#0F172A" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth="1.5" />
                <Rect x="88" y="40" width="44" height="94" rx="8" fill="#F8FAFC" />
                <Rect x="88" y="40" width="44" height="39" rx="8" fill={screenColor} />
                <Rect x="101" y="45" width="18" height="3" rx="1.5" fill="#0F172A" fillOpacity={0.62} />
                <Circle cx="110" cy="65" r="9" fill="#FFFFFF" fillOpacity={0.78} />
                <Path d="m106 65 3 3 6-7" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <Rect x="94" y="87" width="32" height="6" rx="3" fill="#CBD5E1" />
                <Rect x="94" y="99" width="23" height="5" rx="2.5" fill="#E2E8F0" />
                <Rect x="94" y="111" width="32" height="13" rx="4" fill={screenColor} fillOpacity={0.7} />
            </G>

            {/* Small themed details make each banner artwork distinct. */}
            {type === 'expert' ? (
                <G rotation={-35} origin="58, 106">
                    <Rect x="54" y="88" width="8" height="39" rx="4" fill="#FDE68A" />
                    <Rect x="52" y="83" width="12" height="12" rx="4" fill="#FFFFFF" />
                    <Path d="M58 127v9" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
                </G>
            ) : null}
            {type === 'screen-offer' ? (
                <G>
                    <Circle cx="63" cy="65" r="17" fill="#34D399" />
                    <Path d="m56 65 5 5 10-11" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx="66" cy="128" r="5" fill="#FDE68A" />
                </G>
            ) : null}
            {type === 'parts' ? (
                <G>
                    <Rect x="47" y="107" width="24" height="27" rx="4" fill="#FDBA74" />
                    <Path d="m47 114 12 7 12-7M59 121v13" fill="none" stroke="#FFFFFF" strokeWidth="1.7" strokeLinejoin="round" />
                    <Rect x="53" y="82" width="16" height="16" rx="4" fill="#FFFFFF" fillOpacity={0.85} />
                    <Circle cx="61" cy="90" r="4" fill="#FB923C" />
                </G>
            ) : null}
            {type === 'helpdesk' ? (
                <G>
                    <Path d="M47 97v-8a18 18 0 0 1 36 0v8" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" />
                    <Rect x="45" y="91" width="10" height="19" rx="5" fill="#67E8F9" />
                    <Rect x="75" y="91" width="10" height="19" rx="5" fill="#67E8F9" />
                    <Path d="M80 108c-3 8-9 11-17 11" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                    <Circle cx="60" cy="119" r="4" fill="#FDE68A" />
                </G>
            ) : null}
            <Ellipse cx="112" cy="155" rx="39" ry="6" fill="#0F172A" fillOpacity={0.18} />
        </Svg>
    );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

function createStyles(colors: AppColors) {
    return StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.bg },
        scroll: { paddingBottom: 96 },
        content: { paddingHorizontal: spacing.gutter },

        /* Header */
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

        /* Promo banner carousel */
        bannerRow: {
            marginTop: spacing.xs,
        },
        banner: {
            borderRadius: radius.xl,
            overflow: 'hidden',
        },
        bannerArtwork: {
            ...StyleSheet.absoluteFillObject,
            left: '52%',
        },
        bannerScrim: {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: '#0F172A',
            opacity: 0.22,
        },
        bannerInner: {
            minHeight: 194,
            padding: spacing.md + 2,
            paddingRight: '30%',
            gap: spacing.sm,
            justifyContent: 'center',
        },
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
        sectionTitle: {
            fontSize: 16,
            fontWeight: '800',
            color: colors.text,
            letterSpacing: 0.2,
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
            width: 42,
            height: 42,
            alignItems: 'center',
            justifyContent: 'center',
        },
        tileLabel: {
            fontSize: 12.5,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
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

    const handleOpenRepairs = useCallback(() => {
        if (!session) {
            setActiveTab('settings');
            return;
        }
        setActiveTab('jobs');
    }, [session, setActiveTab]);

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

    const handleServicePress = useCallback(
        (service: ServiceItem) => {
            if (service.requiresAuth && !session) {
                setActiveTab('settings');
                return;
            }
            if (service.route) {
                navigation.navigate(service.route as 'Khata' | 'CustomerDirectory');
                return;
            }
            if (service.action === 'helpdesk') {
                void dialPhone(HELPDESK_PHONE);
                return;
            }
            if (service.action === 'inventory') {
                setActiveTab('inventory');
                return;
            }
            if (service.action === 'jobs') {
                handleOpenRepairs();
            }
        },
        [handleOpenRepairs, navigation, session, setActiveTab]
    );

    const shopTitle = profile?.shopName || 'MCA Phone Wala';

    /** Banner base colors are resolved from the active theme; artwork overlays them. */
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
                                <View pointerEvents="none" style={styles.bannerArtwork}>
                                    <BannerArtwork type={banner.key} />
                                </View>
                                <View pointerEvents="none" style={styles.bannerScrim} />
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
                                        onPress={() => {
                                            if (banner.repairs) {
                                                handleOpenRepairs();
                                            } else if (banner.inventory) {
                                                if (session) setActiveTab('inventory');
                                                else setActiveTab('settings');
                                            } else if (banner.support) {
                                                void dialPhone(HELPDESK_PHONE);
                                            }
                                        }}
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

                    {/* ── Services grid ── */}
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Our Services</Text>
                    </View>

                    <View style={styles.grid}>
                        {SERVICES.map((service) => {
                            return (
                                <Pressable
                                    key={service.key}
                                    onPress={() => handleServicePress(service)}
                                    style={styles.tile}
                                    android_ripple={{ color: accentAlpha(colors.accent, 0.1) }}
                                    accessibilityRole="button"
                                    accessibilityLabel={service.label}
                                >
                                    <View style={styles.tileIcon}>
                                        <ThreeDIcon
                                            icon={service.Icon}
                                            color={service.color ?? colors.accent}
                                            size={36}
                                            iconSize={19}
                                        />
                                    </View>
                                    <Text style={styles.tileLabel}>{service.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* ── Popular services ── */}
                    <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Popular Services</Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.popularScroll}
                    >
                        {POPULAR_SERVICES.map(({ key, label, Icon, color }) => {
                            const tint = color ?? colors.accent;
                            return (
                                <Pressable
                                    key={key}
                                    onPress={handleOpenRepairs}
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