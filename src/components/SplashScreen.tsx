import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme';

export function SplashScreen() {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.4)).current;
    const translateY = useRef(new Animated.Value(40)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                friction: 5,
                tension: 60,
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                friction: 6,
                tension: 50,
                useNativeDriver: true,
            })
        ]).start();
    }, [opacity, scale, translateY]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.accent }]} edges={['top', 'bottom']}>
            <Animated.View style={[styles.content, { opacity, transform: [{ scale }, { translateY }] }]}>
                <Text style={styles.icon}>📱</Text>
                <Text style={[styles.title, { color: '#fff' }]}>MCA Phone Wala</Text>
                <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)' }]}>
                    Repair Management Made Easy
                </Text>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        gap: spacing.md,
    },
    icon: {
        fontSize: 80,
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: spacing.sm,
    },
});
