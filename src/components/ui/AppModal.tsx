import React, { type ReactNode, useCallback } from 'react';
import { Modal, Portal, type ModalProps } from 'react-native-paper';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme as useAppTheme } from '../../context/ThemeContext';
import { radius, sizes, spacing } from '../../theme';
import { AppIconButton } from './AppIconButton';

export interface AppModalProps
  extends Omit<ModalProps, 'visible' | 'onDismiss' | 'style' | 'theme' | 'children' | 'contentContainerStyle'> {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayPress?: boolean;
  footer?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

const sizeConfig = {
  small: { maxWidth: 320, width: '90%' as const },
  medium: { maxWidth: 400, width: '90%' as const },
  large: { maxWidth: 500, width: '95%' as const },
  full: { maxWidth: '100%' as const, width: '100%' as const },
};

/**
 * The app's single modal: Paper `Portal` + `Modal` with the design-system
 * sheet radius, title row, optional footer and close affordance.
 */
function AppModal({
  visible,
  onClose,
  children,
  title,
  subtitle,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayPress = true,
  footer,
  containerStyle,
  dismissable,
  ...rest
}: AppModalProps) {
  const { colors } = useAppTheme();
  const sizeStyles = sizeConfig[size];

  const handleClose = useCallback(() => onClose(), [onClose]);

  if (!visible) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        dismissable={closeOnOverlayPress && dismissable !== false}
        contentContainerStyle={overlayStyle}
        {...rest}
      >
        <View style={[sheetOuterStyle, sizeStyles]}>
          <View style={[sheetStyle, { backgroundColor: colors.surface, borderColor: colors.border }, containerStyle]}>
            {(title || showCloseButton) && (
              <View style={headerStyle}>
                {title ? (
                  <Text style={[titleTextStyle, { color: colors.text }]} numberOfLines={1}>
                    {title}
                  </Text>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
                {showCloseButton && (
                  <AppIconButton
                    variant="ghost"
                    size={32}
                    icon={<X size={18} color={colors.textMuted} strokeWidth={2.2} />}
                    accessibilityLabel="Close"
                    onPress={handleClose}
                  />
                )}
              </View>
            )}
            {subtitle ? <Text style={[subtitleTextStyle, { color: colors.textMuted }]}>{subtitle}</Text> : null}
            <View style={contentStyle}>{children}</View>
            {footer ? <View style={[footerStyle, { borderTopColor: colors.border }]}>{footer}</View> : null}
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const overlayStyle: StyleProp<ViewStyle> = {
  flex: 1,
  justifyContent: 'center',
  paddingHorizontal: spacing.md,
};

const sheetOuterStyle: StyleProp<ViewStyle> = {
  alignSelf: 'center',
};

const sheetStyle: StyleProp<ViewStyle> = {
  borderRadius: radius.xl,
  borderWidth: sizes.hairline,
  overflow: 'hidden',
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 24,
  elevation: 8,
};

const headerStyle: StyleProp<ViewStyle> = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing.sm,
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg,
  paddingBottom: spacing.xs,
};

const titleTextStyle = {
  flex: 1,
  fontSize: 17,
  fontWeight: '700' as const,
  letterSpacing: -0.3,
};

const subtitleTextStyle = {
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.sm,
  fontSize: 14,
  lineHeight: 19,
};

const contentStyle: StyleProp<ViewStyle> = {
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.lg,
};

const footerStyle: StyleProp<ViewStyle> = {
  flexDirection: 'row',
  gap: spacing.sm,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.md,
  borderTopWidth: sizes.hairline,
};

export { AppModal };
