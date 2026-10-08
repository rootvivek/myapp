import React from 'react';
import { Text, View } from 'react-native';
import { LogOut, RefreshCw, ShieldCheck } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { spacing } from '../../theme';
import { CURRENT_VERSION_NAME } from '../../components/AutoUpdater';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { createStyles } from './styles';

type Props = {
  userEmail?: string;
  checkingUpdate: boolean;
  onCheckUpdate: () => void;
  onSignOut: () => void;
  colors: AppColors;
};

export const AccountCard = React.memo(function AccountCard({
  userEmail,
  checkingUpdate,
  onCheckUpdate,
  onSignOut,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <AppCard>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <ShieldCheck size={18} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Account & App</Text>
          <Text style={styles.cardSubtitle}>{userEmail || 'Signed in'}</Text>
        </View>
      </View>

      {/* Version check */}
      <View style={[styles.row, { paddingVertical: spacing.sm }]}>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle}>App Version</Text>
          <Text style={styles.rowSubtitle}>v{CURRENT_VERSION_NAME}</Text>
        </View>
        <AppButton
          variant="secondary"
          loading={checkingUpdate}
          disabled={checkingUpdate}
          onPress={onCheckUpdate}
          leftIcon={<RefreshCw size={14} color={colors.text} strokeWidth={2} />}
          style={styles.inlineBtn}
          contentStyle={styles.inlineBtn}
          labelStyle={styles.inlineBtnLabel}
        >
          Check Update
        </AppButton>
      </View>

      {/* Sign Out Button */}
      <AppButton
        variant="danger"
        fullWidth
        onPress={onSignOut}
        leftIcon={<LogOut size={18} color="#FFFFFF" strokeWidth={2.4} />}
        containerStyle={{ marginTop: spacing.sm + 4 }}
      >
        Sign Out
      </AppButton>
    </AppCard>
  );
});
