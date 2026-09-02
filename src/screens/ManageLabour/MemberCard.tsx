import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Edit2, Key, Trash2 } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { spacing } from '../../theme';
import type { UserProfile } from '../../types/profile';
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
    <View style={styles.card}>
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
        <View
          style={[
            styles.badge,
            item.role === 'owner' ? styles.badgeOwner : styles.badgeLabour,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: item.role === 'owner' ? colors.accent : colors.success },
            ]}
          >
            {item.role === 'owner' ? '👑 Owner' : '🔧 Team'}
          </Text>
        </View>
      </View>
      {item.role !== 'owner' && isOwner && (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable onPress={() => onEdit(item)} style={styles.deleteBtn}>
            <Edit2 size={18} color={colors.accent} />
          </Pressable>
          <Pressable onPress={() => onResetPassword(item)} style={styles.deleteBtn}>
            <Key size={18} color={colors.accent} />
          </Pressable>
          <Pressable onPress={() => onDelete(item)} style={styles.deleteBtn}>
            <Trash2 size={18} color={colors.danger} />
          </Pressable>
        </View>
      )}
    </View>
  );
});
