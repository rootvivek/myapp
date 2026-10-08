import React from 'react';
import { Text, View } from 'react-native';
import { Edit2, Key, Trash2 } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { spacing } from '../../theme';
import type { UserProfile } from '../../types/profile';
import { AppCard } from '../../components/ui/AppCard';
import { AppChip } from '../../components/ui/AppChip';
import { AppIconButton } from '../../components/ui/AppIconButton';
import { createStyles } from './styles';

type Props = {
  item: UserProfile;
  isOwner: boolean;
  onEdit: (item: UserProfile) => void;
  onResetPassword: (item: UserProfile) => void;
  onDelete: (item: UserProfile) => void;
  colors: AppColors;
};

export const MemberCard = React.memo(function MemberCard({
  item,
  isOwner,
  onEdit,
  onResetPassword,
  onDelete,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <AppCard variant="outlined" padding={spacing.md} containerStyle={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name || '(No name)'}</Text>
        {item.phone ? <Text style={styles.cardPhone}>{item.phone}</Text> : null}
        {item.role === 'labour' && (
          <Text style={[styles.cardPhone, { marginTop: 4 }]}>
            Login ID:{' '}
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {item.username || item.name.toLowerCase().replace(/\s+/g, '')}
            </Text>
          </Text>
        )}
        <AppChip
          variant={item.role === 'owner' ? 'primary' : 'success'}
          containerStyle={styles.badge}
        >
          {item.role === 'owner' ? '👑 Owner' : '🔧 Team'}
        </AppChip>
      </View>
      {item.role !== 'owner' && isOwner && (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <AppIconButton
            variant="secondary"
            size={36}
            icon={<Edit2 size={18} color={colors.accent} />}
            onPress={() => onEdit(item)}
            accessibilityLabel={`Edit ${item.name || 'team member'}`}
          />
          <AppIconButton
            variant="secondary"
            size={36}
            icon={<Key size={18} color={colors.accent} />}
            onPress={() => onResetPassword(item)}
            accessibilityLabel={`Reset password for ${item.name || 'team member'}`}
          />
          <AppIconButton
            variant="secondary"
            size={36}
            icon={<Trash2 size={18} color={colors.danger} />}
            onPress={() => onDelete(item)}
            accessibilityLabel={`Remove ${item.name || 'team member'}`}
          />
        </View>
      )}
    </AppCard>
  );
});
