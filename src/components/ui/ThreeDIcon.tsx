import React from 'react';
import { StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type ThreeDIconProps = {
  icon: React.ElementType;
  color: string;
  size?: number;
  iconSize?: number;
};

function adjustHex(hex: string, amount: number): string {
  const value = hex.replace('#', '');
  if (!/^[\da-f]{6}$/i.test(value)) return hex;

  const channels = [0, 2, 4].map((offset) =>
    Math.max(0, Math.min(255, parseInt(value.slice(offset, offset + 2), 16) + amount)),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/** Small layered gradient icon that gives tab and service glyphs a raised 3D look. */
export function ThreeDIcon({ icon: Icon, color, size = 38, iconSize }: ThreeDIconProps) {
  const radius = Math.round(size * 0.29);
  const glyphSize = iconSize ?? Math.round(size * 0.52);

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.wrap, { width: size, height: size }]}
    >
      <View
        style={[
          styles.depth,
          {
            backgroundColor: adjustHex(color, -48),
            borderRadius: radius,
          },
        ]}
      />
      <LinearGradient
        colors={[adjustHex(color, 32), color]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.face, { borderRadius: radius, bottom: Math.max(3, size * 0.1) }]}
      >
        <Icon size={glyphSize} color="#FFFFFF" strokeWidth={2.25} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  depth: {
    position: 'absolute',
    top: 4,
    left: 1,
    right: 1,
    bottom: 0,
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
});