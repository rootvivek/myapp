import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft, Edit2, Key, Plus, Shield, Trash2, UserPlus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getShopLabourList, deleteLabourUser, updateLabourUser } from '../db/database';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { accentAlpha, radius, spacing } from '../theme';
import type { UserProfile } from '../types/profile';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageLabour'>;

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radius.sm,
      backgroundColor: colors.accent,
    },
    addBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14,
    },
    list: {
      padding: spacing.md,
      paddingBottom: 40,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    cardInfo: {
      flex: 1,
    },
    cardName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    cardPhone: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 6,
      alignSelf: 'flex-start',
    },
    badgeOwner: {
      backgroundColor: accentAlpha(colors.accent, 0.15),
    },
    badgeLabour: {
      backgroundColor: accentAlpha(colors.success, 0.15),
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    deleteBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    empty: {
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 15,
      marginTop: spacing.xxl,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 16,
      marginBottom: spacing.md,
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelBtnText: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 16,
    },
    saveBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
      alignItems: 'center',
    },
    saveBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    dim: { opacity: 0.6 },
  });
}

export function ManageLabourScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { createLabourAccount, resetLabourPassword, profile } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addBusy, setAddBusy] = useState(false);

  // Reset password states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  const handleEditSave = async () => {
    if (!editingUser) return;
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert('Missing fields', 'Username and phone number are required.');
      return;
    }
    setEditBusy(true);
    try {
      await updateLabourUser(editingUser.id, editName, editPhone);
      Alert.alert('Success', 'Team member updated.');
      setShowEditModal(false);
      setEditingUser(null);
      setEditName('');
      setEditPhone('');
      await loadMembers();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update account.');
    } finally {
      setEditBusy(false);
    }
  };

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getShopLabourList();
      setMembers(list);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const handleAdd = async () => {
    if (!addName.trim() || !addPhone.trim() || !addPassword.trim()) {
      Alert.alert('Missing fields', 'Username, phone number, and password are required.');
      return;
    }
    if (addPassword.length < 6) {
      Alert.alert('Password', 'Use at least 6 characters.');
      return;
    }
    setAddBusy(true);
    try {
      await createLabourAccount(addName, addPassword, addPhone);
      Alert.alert('Success', `Team member account created for ${addName.trim()}.`);
      setShowAddModal(false);
      setAddName('');
      setAddPassword('');
      setAddPhone('');
      await loadMembers();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create account.');
    } finally {
      setAddBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resettingUser) return;
    if (!resetPassword.trim() || resetPassword.length < 6) {
      Alert.alert('Password', 'Use at least 6 characters.');
      return;
    }
    setResetBusy(true);
    try {
      await resetLabourPassword(resettingUser.id, resetPassword);
      Alert.alert('Success', `Password reset for ${resettingUser.name || 'team member'}.`);
      setShowResetModal(false);
      setResetPassword('');
      setResettingUser(null);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reset password.');
    } finally {
      setResetBusy(false);
    }
  };

  const handleDelete = (member: UserProfile) => {
    if (member.role === 'owner') return;
    Alert.alert(
      'Remove Team Member',
      `Remove ${member.name || 'this user'} from the shop?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLabourUser(member.id);
              await loadMembers();
            } catch {
              Alert.alert('Error', 'Failed to remove team member.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LinearGradient colors={colors.bgGradient} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Team</Text>
        <Pressable
          onPress={() => setShowAddModal(true)}
          style={styles.addBtn}
          android_ripple={{ color: '#fff' }}
        >
          <UserPlus size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Member</Text>
        </Pressable>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No team members yet. Add your first team member!</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name || '(No name)'}</Text>
                {item.phone ? <Text style={styles.cardPhone}>{item.phone}</Text> : null}
                {item.role === 'labour' && (
                  <Text style={[styles.cardPhone, { marginTop: 4 }]}>
                    Login ID: <Text style={{ color: colors.text, fontWeight: '700' }}>
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
              {item.role !== 'owner' && profile?.role === 'owner' && (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Pressable
                    onPress={() => {
                      setEditingUser(item);
                      setEditName(item.name);
                      setEditPhone(item.phone);
                      setShowEditModal(true);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Edit2 size={18} color={colors.accent} />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setResettingUser(item);
                      setResetPassword('');
                      setShowResetModal(true);
                    }}
                    style={styles.deleteBtn}
                  >
                    <Key size={18} color={colors.accent} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                    <Trash2 size={18} color={colors.danger} />
                  </Pressable>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* Add Labour Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Team Member</Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
              value={addName}
              onChangeText={setAddName}
              placeholder="e.g. rahul123"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone number</Text>
            <TextInput
              value={addPhone}
              onChangeText={setAddPhone}
              placeholder="9876543210"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={addPassword}
              onChangeText={setAddPassword}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowAddModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleAdd()}
                disabled={addBusy}
                style={[styles.saveBtn, addBusy && styles.dim]}
              >
                {addBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Create</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowResetModal(false);
          setResettingUser(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            {resettingUser ? (
              <Text style={[styles.label, { marginBottom: spacing.md, textTransform: 'none' }]}>
                Set new password for {resettingUser.name || 'team member'}
              </Text>
            ) : null}

            <Text style={styles.label}>New Password</Text>
            <TextInput
              value={resetPassword}
              onChangeText={setResetPassword}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowResetModal(false);
                  setResettingUser(null);
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleResetPassword()}
                disabled={resetBusy}
                style={[styles.saveBtn, resetBusy && styles.dim]}
              >
                {resetBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Reset</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Labour Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Team Member</Text>

            <Text style={styles.label}>Username</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. rahul123"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Phone number</Text>
            <TextInput
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="9876543210"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleEditSave()}
                disabled={editBusy}
                style={[styles.saveBtn, editBusy && styles.dim]}
              >
                {editBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
