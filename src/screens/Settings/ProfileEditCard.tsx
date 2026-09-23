import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Save, UserRound } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { createStyles } from './styles';

type Props = {
  name: string;
  shopName: string;
  isOwner: boolean;
  busy: boolean;
  onSave: (name: string, shopName: string) => void;
  colors: AppColors;
};

export const ProfileEditCard = React.memo(function ProfileEditCard({
  name,
  shopName,
  isOwner,
  busy,
  onSave,
  colors,
}: Props) {
  const styles = createStyles(colors);
  const [draftName, setDraftName] = useState(name);
  const [draftShopName, setDraftShopName] = useState(shopName);

  useEffect(() => {
    setDraftName(name);
    setDraftShopName(shopName);
  }, [name, shopName]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <UserRound size={18} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Profile Details</Text>
          <Text style={styles.cardSubtitle}>Update your name and shop name</Text>
        </View>
      </View>

      <TextInput
        value={draftName}
        onChangeText={setDraftName}
        placeholder="Your name"
        placeholderTextColor={colors.textMuted}
        editable={!busy}
        style={{
          color: colors.text,
          backgroundColor: colors.surface2,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 11,
          marginBottom: 10,
        }}
        accessibilityLabel="Your name"
      />

      {isOwner && (
        <TextInput
          value={draftShopName}
          onChangeText={setDraftShopName}
          placeholder="Shop name"
          placeholderTextColor={colors.textMuted}
          editable={!busy}
          style={{
            color: colors.text,
            backgroundColor: colors.surface2,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 11,
            marginBottom: 10,
          }}
          accessibilityLabel="Shop name"
        />
      )}

      <Pressable
        onPress={() => onSave(draftName, draftShopName)}
        disabled={busy}
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel="Save profile details"
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <View style={styles.saveBtnInner}>
            <Save size={16} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save Details</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
});
