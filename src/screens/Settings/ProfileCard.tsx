import React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { User } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { createStyles } from './styles';

type Props = {
  profileName: string;
  setProfileName: (val: string) => void;
  profileSaving: boolean;
  onSaveProfileName: () => void;
  colors: AppColors;
};

export const ProfileCard = React.memo(function ProfileCard({
  profileName,
  setProfileName,
  profileSaving,
  onSaveProfileName,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <User size={18} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Profile Information</Text>
          <Text style={styles.cardSubtitle}>Update your personal display name</Text>
        </View>
      </View>

      <Text style={styles.label}>Your Name</Text>
      <View style={styles.inputContainer}>
        <View style={styles.inputIconBox}>
          <User size={16} color={colors.accent} />
        </View>
        <TextInput
          style={styles.input}
          value={profileName}
          onChangeText={setProfileName}
          placeholder="Enter your name"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <Pressable
        onPress={onSaveProfileName}
        disabled={profileSaving}
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
      >
        {profileSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveBtnText}>Save Profile Name</Text>
        )}
      </Pressable>
    </View>
  );
});
