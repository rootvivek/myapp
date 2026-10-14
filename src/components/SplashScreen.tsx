import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench } from 'lucide-react-native';
import { accentAlpha, radius, spacing } from '../theme';

export function SplashScreen() {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.5)).current;
    const translateY = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                friction: 6,
                tension: 50,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                friction: 7,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();

        // Continuous pulse & shimmer loop
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        const shimmerLoop = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        pulseLoop.start();
        shimmerLoop.start();

        return () => {
            pulseLoop.stop();
            shimmerLoop.stop();
        };
    }, [opacity, scale, translateY, pulseAnim, shimmerAnim]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.bgGlow} />
            <Animated.View style={[styles.content, { opacity, transform: [{ scale }, { translateY }] }]}>
                {/* Pulsing outer aura ring */}
                <Animated.View style={[styles.auraRing, { transform: [{ scale: pulseAnim }] }]} />

                {/* Logo Badge Container */}
                <View style={styles.logoBadge}>
                    <Wrench size={42} color="#0A84FF" strokeWidth={2.4} />
                </View>

                {/* Brand Titles */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>MCA Phone Wala</Text>
                    <Text style={styles.subtitle}>Repair Management Made Easy</Text>
                </View>

                {/* Loading indicator dots */}
                <View style={styles.loaderRow}>
                    <View style={[styles.dot, styles.dotActive]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0C', // Dark matte background
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgGlow: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
        backgroundColor: accentAlpha('#0A84FF', 0.08),
        transform: [{ scale: 1.5 }],
    },
    content: {
        alignItems: 'center',
        gap: spacing.lg,
        paddingHorizontal: spacing.xl,
    },
    auraRing: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: accentAlpha('#0A84FF', 0.14),
        borderWidth: 1.5,
        borderColor: accentAlpha('#0A84FF', 0.3),
        top: -12,
    },
    logoBadge: {
        width: 86,
        height: 86,
        borderRadius: radius.xl,
        backgroundColor: '#141416',
        borderWidth: 1.5,
        borderColor: '#2A2A2E',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0A84FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 10,
    },
    textContainer: {
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#F5F5F7',
        letterSpacing: -0.6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#98989E',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    loaderRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2A2A2E',
    },
    dotActive: {
        backgroundColor: '#0A84FF',
        width: 22,
    },
});

