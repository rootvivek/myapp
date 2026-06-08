import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Lock, RefreshCw, X, Check } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { accentAlpha } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_SIZE = 300;
const DOT_RADIUS = 10;
const TOUCH_RADIUS = 30;

// Coordinates for the 9-dot grid (300x300 space)
const DOTS = [
  { id: 0, x: 50, y: 50 },
  { id: 1, x: 150, y: 50 },
  { id: 2, x: 250, y: 50 },
  { id: 3, x: 50, y: 150 },
  { id: 4, x: 150, y: 150 },
  { id: 5, x: 250, y: 150 },
  { id: 6, x: 50, y: 250 },
  { id: 7, x: 150, y: 250 },
  { id: 8, x: 250, y: 250 },
];

interface PatternDrawingModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (patternPath: string) => void;
  initialPattern?: string;
}

export function PatternDrawingModal({
  visible,
  onClose,
  onSave,
  initialPattern = '',
}: PatternDrawingModalProps) {
  const { colors, mode } = useTheme();
  const [path, setPath] = useState<number[]>([]);
  const [currentTouch, setCurrentTouch] = useState<{ x: number; y: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Helper to parse initial pattern string (e.g. "0-1-2-5" to [0, 1, 2, 5])
  React.useEffect(() => {
    if (visible) {
      if (initialPattern) {
        const parsed = initialPattern
          .split('-')
          .map(Number)
          .filter((n) => !isNaN(n) && n >= 0 && n <= 8);
        setPath(parsed);
      } else {
        setPath([]);
      }
      setCurrentTouch(null);
      setIsDrawing(false);
    }
  }, [visible, initialPattern]);

  const detectDot = (x: number, y: number): number | null => {
    for (const dot of DOTS) {
      const distance = Math.sqrt(Math.pow(x - dot.x, 2) + Math.pow(y - dot.y, 2));
      if (distance < TOUCH_RADIUS) {
        return dot.id;
      }
    }
    return null;
  };

  const handleTouchStart = (e: any) => {
    const { locationX, locationY } = e.nativeEvent;
    const dotId = detectDot(locationX, locationY);
    setIsDrawing(true);
    if (dotId !== null) {
      setPath([dotId]);
      setCurrentTouch({ x: DOTS[dotId].x, y: DOTS[dotId].y });
    } else {
      setPath([]);
      setCurrentTouch({ x: locationX, y: locationY });
    }
  };

  const handleTouchMove = (e: any) => {
    if (!isDrawing) return;
    const { locationX, locationY } = e.nativeEvent;
    setCurrentTouch({ x: locationX, y: locationY });

    const dotId = detectDot(locationX, locationY);
    if (dotId !== null && !path.includes(dotId)) {
      setPath((prev) => [...prev, dotId]);
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
    setCurrentTouch(null);
  };

  const handleClear = () => {
    setPath([]);
    setCurrentTouch(null);
  };

  const handleSave = () => {
    if (path.length < 4) {
      Alert.alert('Invalid pattern', 'Connect at least 4 dots to create a valid pattern.');
      return;
    }
    const patternStr = path.join('-');
    onSave(patternStr);
    onClose();
  };

  const inactiveDotColor = mode === 'dark' ? '#1F3250' : '#D1CFC9';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: mode === 'dark' ? 'rgba(2, 6, 23, 0.85)' : 'rgba(0, 0, 0, 0.5)' }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Lock color={colors.accent} size={24} style={styles.titleIcon} />
              <Text style={[styles.titleText, { color: colors.text }]}>Draw Pattern</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textMuted} size={24} />
            </Pressable>
          </View>

          {/* Subtitle / Hints */}
          <Text style={[styles.hintText, { color: colors.textMuted }]}>
            {path.length < 4
              ? `Connect at least 4 dots (Current: ${path.length})`
              : 'Pattern looks good! Press save to continue.'}
          </Text>

          {/* Drawing Grid */}
          <View
            style={[styles.gridContainer, { backgroundColor: colors.surface2, borderColor: colors.border }]}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* SVG lines drawing */}
            <View style={styles.svgOverlay} pointerEvents="none">
              <Svg width={GRID_SIZE} height={GRID_SIZE}>
                {/* Connecting lines */}
                {path.map((dotId, index) => {
                  if (index === 0) return null;
                  const prevDot = DOTS[path[index - 1]];
                  const currentDot = DOTS[dotId];
                  return (
                    <Line
                      key={`line-${index}`}
                      x1={prevDot.x}
                      y1={prevDot.y}
                      x2={currentDot.x}
                      y2={currentDot.y}
                      stroke={colors.accent}
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Direct line to user's finger */}
                {isDrawing && path.length > 0 && currentTouch && (
                  <Line
                    x1={DOTS[path[path.length - 1]].x}
                    y1={DOTS[path[path.length - 1]].y}
                    x2={currentTouch.x}
                    y2={currentTouch.y}
                    stroke={accentAlpha(colors.accent, 0.5)}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                )}

                {/* Render the 9 dots */}
                {DOTS.map((dot) => {
                  const isActive = path.includes(dot.id);
                  const isLast = path[path.length - 1] === dot.id;

                  return (
                    <React.Fragment key={`dot-${dot.id}`}>
                      {/* Active glowing ring */}
                      {isActive && (
                        <Circle
                          cx={dot.x}
                          cy={dot.y}
                          r={isLast ? 22 : 18}
                          fill={accentAlpha(colors.accent, 0.25)}
                        />
                      )}
                      {/* Central dot */}
                      <Circle
                        cx={dot.x}
                        cy={dot.y}
                        r={isActive ? DOT_RADIUS + 2 : DOT_RADIUS}
                        fill={isActive ? colors.accent : inactiveDotColor}
                      />
                    </React.Fragment>
                  );
                })}
              </Svg>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleClear}
              style={[styles.actionBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
              android_ripple={{ color: colors.border }}
            >
              <RefreshCw color={colors.textMuted} size={18} style={styles.actionIcon} />
              <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>Clear</Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.accent }, path.length < 4 && styles.saveBtnDisabled]}
              disabled={path.length < 4}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
            >
              <Check color="#fff" size={18} style={styles.actionIcon} />
              <Text style={styles.saveBtnText}>Save Pattern</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// A reusable miniature visualizer component for list cards and details screens
interface PatternPreviewProps {
  path: string;
  size?: number;
  color?: string;
  dotColor?: string;
}

export function PatternPreview({
  path,
  size = 60,
  color,
  dotColor,
}: PatternPreviewProps) {
  const { colors, mode } = useTheme();
  if (!path) return null;

  const parsedPath = path
    .split('-')
    .map(Number)
    .filter((n) => !isNaN(n) && n >= 0 && n <= 8);

  const scale = size / GRID_SIZE;
  const lineColor = color ?? colors.accent;
  const defaultDotColor = dotColor ?? (mode === 'dark' ? '#1F3250' : '#E6E1DA');

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Draw miniature lines */}
        {parsedPath.map((dotId, index) => {
          if (index === 0) return null;
          const prevDot = DOTS[parsedPath[index - 1]];
          const currentDot = DOTS[dotId];
          return (
            <Line
              key={`prev-line-${index}`}
              x1={prevDot.x * scale}
              y1={prevDot.y * scale}
              x2={currentDot.x * scale}
              y2={currentDot.y * scale}
              stroke={lineColor}
              strokeWidth={Math.max(2, 5 * scale)}
              strokeLinecap="round"
            />
          );
        })}

        {/* Draw miniature dots */}
        {DOTS.map((dot) => {
          const isActive = parsedPath.includes(dot.id);
          return (
            <Circle
              key={`prev-dot-${dot.id}`}
              cx={dot.x * scale}
              cy={dot.y * scale}
              r={isActive ? (DOT_RADIUS * scale) + 1 : DOT_RADIUS * scale}
              fill={isActive ? lineColor : defaultDotColor}
            />
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: Math.min(SCREEN_WIDTH - 36, 400),
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  gridContainer: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 24,
  },
  svgOverlay: {
    width: '100%',
    height: '100%',
  },
  actionRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.3,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
