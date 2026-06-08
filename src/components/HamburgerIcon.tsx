import type { ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

type Props = {
    lineColor: string;
    style?: ViewStyle;
};

export function HamburgerIcon({ lineColor, style }: Props) {
    return (
        <View style={[styles.icon, style]} accessibilityLabel="Open menu">
            <View style={[styles.line, { backgroundColor: lineColor }]} />
            <View style={[styles.line, { backgroundColor: lineColor }]} />
            <View style={[styles.line, { backgroundColor: lineColor }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    icon: {
        width: 22,
        height: 16,
        justifyContent: 'space-between',
    },
    line: {
        height: 2,
        borderRadius: 1,
        width: '100%',
    },
});
