import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme';

export function SplashScreen() {
    const { colors } = useTheme();
    const [fadeAnim, setFadeAnim] = useState(0);

    useEffect(() => {
        const fadeIn = setTimeout(() => setFadeAnim(1), 100);
        return () => clearTimeout(fadeIn);
    }, []);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.accent }]} edges={['top', 'bottom']}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.icon}>📱</Text>
                </View>
                <Text style={[styles.title, { color: '#fff', opacity: fadeAnim }]}>MCA Phone Wala</Text>
                <Text style={[styles.subtitle, { color: 'rgba(255,255,255,0.8)', opacity: fadeAnim }]}>
                    Repair Management Made Easy
                </Text>
            </View>
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
    iconContainer: {
        marginBottom: spacing.lg,
    },
    icon: {
        fontSize: 80,
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
