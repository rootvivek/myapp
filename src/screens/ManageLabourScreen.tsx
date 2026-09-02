import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UserPlus } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { labourService } from '../services/labourService';
import type { RootStackParamList } from '../navigation/types';
import type { UserProfile } from '../types/profile';

import { AddMemberModal } from './ManageLabour/AddMemberModal';
import { EditMemberModal } from './ManageLabour/EditMemberModal';
import { MemberCard } from './ManageLabour/MemberCard';
import { ResetPasswordModal } from './ManageLabour/ResetPasswordModal';
import { createStyles } from './ManageLabour/styles';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageLabour'>;

export function ManageLabourScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { profile, createLabourAccount, resetLabourPassword } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addBusy, setAddBusy] = useState(false);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  // Reset password modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  // Sync locks & lifecycle
  const actionBusyRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await labourService.getShopList();
      if (mountedRef.current) {
        setMembers(list);
      }
    } catch {
      if (mountedRef.current) {
        Alert.alert('Error', 'Failed to load team list.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const handleAdd = useCallback(async () => {
    const username = addName.trim().toLowerCase();
    const phone = addPhone.trim();
    const password = addPassword.trim();

    if (!username) {
      Alert.alert('Required', 'Please enter a username.');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Required', 'Password must be at least 6 characters.');
      return;
    }
    if (actionBusyRef.current) return;
    actionBusyRef.current = true;
    setAddBusy(true);

    try {
      await createLabourAccount(username, password, phone);
      if (mountedRef.current) {
        setShowAddModal(false);
        setAddName('');
        setAddPhone('');
        setAddPassword('');
        Alert.alert('Success', `Team member @${username} added.`);
        await loadMembers();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create team account.';
      Alert.alert('Error', msg);
    } finally {
      if (mountedRef.current) {
        setAddBusy(false);
      }
      actionBusyRef.current = false;
    }
  }, [addName, addPhone, addPassword, createLabourAccount, loadMembers]);

  const handleEditSave = useCallback(async () => {
    if (!editingUser) return;
    const name = editName.trim();
    const phone = editPhone.trim();
    if (!name) {
      Alert.alert('Required', 'Please enter a name.');
      return;
    }
    if (actionBusyRef.current) return;
    actionBusyRef.current = true;
    setEditBusy(true);

    try {
      await labourService.updateLabour(editingUser.id, name, phone);
      if (mountedRef.current) {
        setShowEditModal(false);
        setEditingUser(null);
        Alert.alert('Success', 'Team member updated.');
        await loadMembers();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update team member.';
      Alert.alert('Error', msg);
    } finally {
      if (mountedRef.current) {
        setEditBusy(false);
      }
      actionBusyRef.current = false;
    }
  }, [editingUser, editName, editPhone, loadMembers]);

  const handleResetPassword = useCallback(async () => {
    if (!resettingUser) return;
    const pass = resetPassword.trim();
    if (!pass || pass.length < 6) {
      Alert.alert('Required', 'New password must be at least 6 characters.');
      return;
    }
    if (actionBusyRef.current) return;
    actionBusyRef.current = true;
    setResetBusy(true);

    try {
      await resetLabourPassword(resettingUser.id, pass);
      if (mountedRef.current) {
        setShowResetModal(false);
        setResettingUser(null);
        setResetPassword('');
        Alert.alert('Success', `Password reset for ${resettingUser.name || 'team member'}.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password.';
      Alert.alert('Error', msg);
    } finally {
      if (mountedRef.current) {
        setResetBusy(false);
      }
      actionBusyRef.current = false;
    }
  }, [resettingUser, resetPassword, resetLabourPassword]);

  const handleDelete = useCallback(
    (userItem: UserProfile) => {
      Alert.alert(
        'Remove Team Member',
        `Are you sure you want to remove ${userItem.name || 'this member'} from the shop?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              if (actionBusyRef.current) return;
              actionBusyRef.current = true;
              try {
                await labourService.removeLabour(userItem.id);
                if (mountedRef.current) {
                  Alert.alert('Removed', `${userItem.name} has been removed.`);
                  await loadMembers();
                }
              } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Failed to remove.';
                Alert.alert('Error', msg);
              } finally {
                actionBusyRef.current = false;
              }
            },
          },
        ]
      );
    },
    [loadMembers]
  );

  const startEdit = useCallback((item: UserProfile) => {
    setEditingUser(item);
    setEditName(item.name);
    setEditPhone(item.phone);
    setShowEditModal(true);
  }, []);

  const startResetPassword = useCallback((item: UserProfile) => {
    setResettingUser(item);
    setResetPassword('');
    setShowResetModal(true);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Manage Team</Text>
        {profile?.role === 'owner' && (
          <Pressable onPress={() => setShowAddModal(true)} style={styles.addBtn}>
            <UserPlus size={18} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        )}
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
            <MemberCard
              item={item}
              isOwner={profile?.role === 'owner'}
              onEdit={startEdit}
              onResetPassword={startResetPassword}
              onDelete={handleDelete}
              colors={colors}
            />
          )}
        />
      )}

      {/* Add Modal */}
      <AddMemberModal
        visible={showAddModal}
        addName={addName}
        setAddName={setAddName}
        addPhone={addPhone}
        setAddPhone={setAddPhone}
        addPassword={addPassword}
        setAddPassword={setAddPassword}
        addBusy={addBusy}
        onClose={() => setShowAddModal(false)}
        onAdd={() => void handleAdd()}
        colors={colors}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        visible={showResetModal}
        resettingUser={resettingUser}
        resetPassword={resetPassword}
        setResetPassword={setResetPassword}
        resetBusy={resetBusy}
        onClose={() => {
          setShowResetModal(false);
          setResettingUser(null);
        }}
        onReset={() => void handleResetPassword()}
        colors={colors}
      />

      {/* Edit Modal */}
      <EditMemberModal
        visible={showEditModal}
        editName={editName}
        setEditName={setEditName}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editBusy={editBusy}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        onSave={() => void handleEditSave()}
        colors={colors}
      />
    </SafeAreaView>
  );
}
