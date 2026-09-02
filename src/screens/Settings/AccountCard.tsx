import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LogOut, RefreshCw, ShieldCheck } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { CURRENT_VERSION_NAME } from '../../components/AutoUpdater';
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
    <View style={styles.card}>
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
      <View style={[styles.row, { paddingVertical: 8 }]}>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle}>App Version</Text>
          <Text style={styles.rowSubtitle}>v{CURRENT_VERSION_NAME}</Text>
        </View>
        <Pressable
          onPress={onCheckUpdate}
          disabled={checkingUpdate}
          style={({ pressed }) => [styles.logoMiniBtn, pressed && { opacity: 0.7 }]}
        >
          {checkingUpdate ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={12} color={colors.text} />
              <Text style={styles.logoMiniBtnText}>Check Update</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Sign Out Button */}
      <Pressable
        onPress={onSignOut}
        style={({ pressed }) => [
          styles.saveBtn,
          { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', marginTop: 12 },
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={styles.saveBtnInner}>
          <LogOut size={16} color={colors.danger} strokeWidth={2.4} />
          <Text style={[styles.saveBtnText, { color: colors.danger }]}>Sign Out</Text>
        </View>
      </Pressable>
    </View>
  );
});
