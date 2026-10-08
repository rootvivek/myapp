import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  ChevronRight,
  Phone,
  PlusCircle,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react-native';

import { useTheme } from '../context/ThemeContext';
import { accentAlpha, radius, sizes, spacing } from '../theme';
import type { DirectoryCustomer } from '../types/customer';
import type { Repair } from '../types/repair';
import { REPAIR_STATUSES } from '../types/repair';
import { formatCurrency } from '../utils/format';
import { dialPhone } from '../utils/phone';
import { WhatsAppIcon } from './WhatsAppIcon';
import { AppModal } from './ui/AppModal';
import { AppButton } from './ui/AppButton';
import { AppIconButton } from './ui/AppIconButton';

type Props = {
  visible: boolean;
  customer: DirectoryCustomer | null;
  repairs: Repair[];
  onClose: () => void;
  onSelectRepair: (repairId: number) => void;
  onNewRepair: (customer: DirectoryCustomer) => void;
};

export function getWarrantyInfo(dateReceivedStr: string, warrantyStr: string) {
  const w = (warrantyStr || '').trim().toLowerCase();
  if (!w || w === 'no warranty' || w === 'none') {
    return { isWarranted: false, active: false, daysLeft: 0, label: 'No Warranty' };
  }

  const match = w.match(/\d+/);
  if (!match) {
    return { isWarranted: true, active: true, daysLeft: 0, label: warrantyStr };
  }

  const daysCount = parseInt(match[0], 10);
  if (Number.isNaN(daysCount) || daysCount <= 0) {
    return { isWarranted: false, active: false, daysLeft: 0, label: 'No Warranty' };
  }

  const startDate = new Date(dateReceivedStr + (dateReceivedStr.includes('T') ? '' : 'T12:00:00'));
  if (Number.isNaN(startDate.getTime())) {
    return { isWarranted: true, active: true, daysLeft: 0, label: warrantyStr };
  }

  const expiryDate = new Date(startDate.getTime() + daysCount * 24 * 60 * 60 * 1000);
  const now = new Date();

  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return {
      isWarranted: true,
      active: true,
      daysLeft: diffDays,
      label: `Active (${diffDays} ${diffDays === 1 ? 'day' : 'days'} left)`,
    };
  }

  return {
    isWarranted: true,
    active: false,
    daysLeft: 0,
    label: 'Expired',
  };
}

export function matchPhone(phoneA: string, phoneB: string): boolean {
  const dA = (phoneA || '').replace(/\D/g, '');
  const dB = (phoneB || '').replace(/\D/g, '');
  if (!dA || !dB) return false;
  if (dA === dB) return true;
  const last10A = dA.length >= 10 ? dA.slice(-10) : dA;
  const last10B = dB.length >= 10 ? dB.slice(-10) : dB;
  return last10A === last10B;
}

export function CustomerHistoryModal({
  visible,
  customer,
  repairs,
  onClose,
  onSelectRepair,
  onNewRepair,
}: Props) {
  const { colors } = useTheme();

  // Filter repairs belonging to this customer by matching phone number or customer name
  const customerRepairs = useMemo(() => {
    if (!customer) return [];
    const phone = customer.phone || '';
    const name = (customer.customerName || '').trim().toLowerCase();

    return repairs
      .filter((r) => {
        if (phone && matchPhone(r.phone, phone)) return true;
        if (name && r.customerName.trim().toLowerCase() === name) return true;
        return false;
      })
      .sort((a, b) => b.id - a.id);
  }, [customer, repairs]);

  // Aggregate Stats
  const stats = useMemo(() => {
    let totalSpent = 0;
    let totalDues = 0;
    let activeWarrantiesCount = 0;

    customerRepairs.forEach((r) => {
      const cost = r.repairCost || 0;
      const adv = r.advanceAmount || 0;
      if (r.isPaid) {
        totalSpent += cost;
      } else {
        totalSpent += adv;
        totalDues += Math.max(0, cost - adv);
      }

      const wInfo = getWarrantyInfo(r.dateReceived, r.warranty);
      if (wInfo.active) {
        activeWarrantiesCount += 1;
      }
    });

    return {
      totalJobs: customerRepairs.length,
      totalSpent,
      totalDues,
      activeWarrantiesCount,
    };
  }, [customerRepairs]);

  const handleCall = useCallback(() => {
    if (!customer?.phone) return;
    void dialPhone(customer.phone);
  }, [customer?.phone]);

  const handleWhatsApp = useCallback(() => {
    if (!customer?.phone) return;
    const digits = customer.phone.replace(/\D/g, '');
    const fullPhone = digits.length === 10 ? `91${digits}` : digits;
    const url = `whatsapp://send?phone=${fullPhone}`;
    void Linking.openURL(url);
  }, [customer?.phone]);

  if (!customer) return null;

  const initial = (customer.customerName.trim() || '?').slice(0, 1).toUpperCase();

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      size="full"
      showCloseButton={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: accentAlpha(colors.accent, 0.12), borderColor: colors.border }]}>
              <Text style={[styles.avatarText, { color: colors.accent }]}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {customer.customerName || 'Customer Details'}
              </Text>
              <Text style={[styles.phone, { color: colors.textMuted }]}>{customer.phone}</Text>
            </View>
          </View>
          <AppIconButton
            variant="ghost"
            size={32}
            icon={<X size={18} color={colors.textMuted} strokeWidth={2.2} />}
            onPress={onClose}
            accessibilityLabel="Close profile"
            style={styles.closeBtn}
          />
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalJobs}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Jobs</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {formatCurrency(stats.totalSpent)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Spent</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Text
              style={[
                styles.statValue,
                { color: stats.activeWarrantiesCount > 0 ? colors.accent : colors.textMuted },
              ]}
            >
              {stats.activeWarrantiesCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Warranties</Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionsRow}>
          <AppButton
            variant="outline"
            leftIcon={<Phone size={15} color={colors.accent} />}
            onPress={handleCall}
            style={styles.actionBtn}
          >
            Call
          </AppButton>

          <AppButton
            variant="secondary"
            leftIcon={<WhatsAppIcon size={15} />}
            onPress={handleWhatsApp}
            style={styles.actionBtn}
          >
            WhatsApp
          </AppButton>

          <AppButton
            variant="primary"
            leftIcon={<PlusCircle size={15} color="#FFFFFF" />}
            onPress={() => {
              onClose();
              onNewRepair(customer);
            }}
            style={styles.newJobBtn}
          >
            New Job
          </AppButton>
        </View>

        {/* Past Repairs Timeline Section */}
        <View style={styles.timelineTitleRow}>
          <Wrench size={14} color={colors.accent} />
          <Text style={[styles.timelineTitle, { color: colors.text }]}>
            REPAIR HISTORY ({customerRepairs.length})
          </Text>
        </View>

        <FlatList
          data={customerRepairs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No repair records found for this customer.
            </Text>
          }
          renderItem={({ item }) => {
            const statusItem = REPAIR_STATUSES.find((s) => s.value === item.status);
            const statusLabel = statusItem?.label || item.status;
            const wInfo = getWarrantyInfo(item.dateReceived, item.warranty);
            const isPaid = item.isPaid;
            const due = Math.max(0, item.repairCost - item.advanceAmount);

            return (
              <Pressable
                onPress={() => {
                  onClose();
                  onSelectRepair(item.id);
                }}
                style={[styles.jobCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                android_ripple={{ color: colors.border }}
              >
                <View style={styles.jobCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.orderCode, { color: colors.accent }]}>
                      {item.orderCode || `ord#${item.id}`}
                    </Text>
                    <Text style={[styles.jobDate, { color: colors.textMuted }]}>
                      • {item.dateReceived}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          item.status === 'completed' || item.status === 'delivered'
                            ? accentAlpha(colors.success, 0.15)
                            : accentAlpha(colors.accent, 0.15),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            item.status === 'completed' || item.status === 'delivered'
                              ? colors.success
                              : colors.accent,
                        },
                      ]}
                    >
                      {statusLabel}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.deviceModel, { color: colors.text }]} numberOfLines={1}>
                  {item.deviceModel}
                </Text>
                <Text style={[styles.problemText, { color: colors.textMuted }]} numberOfLines={2}>
                  {item.problem || 'No problem notes'}
                </Text>

                <View style={styles.jobCardFooter}>
                  {/* Payment Info */}
                  <Text style={[styles.costText, { color: isPaid ? colors.success : due > 0 ? colors.danger : colors.text }]}>
                    {isPaid
                      ? `Paid ${formatCurrency(item.repairCost)}`
                      : due > 0
                      ? `Due ${formatCurrency(due)}`
                      : formatCurrency(item.repairCost)}
                  </Text>

                  {/* Warranty Indicator */}
                  <View
                    style={[
                      styles.warrantyBadge,
                      {
                        backgroundColor: wInfo.active
                          ? accentAlpha(colors.success, 0.12)
                          : accentAlpha(colors.text, 0.05),
                      },
                    ]}
                  >
                    {wInfo.active ? (
                      <ShieldCheck size={12} color={colors.success} />
                    ) : (
                      <ShieldAlert size={12} color={colors.textMuted} />
                    )}
                    <Text
                      style={[
                        styles.warrantyText,
                        { color: wInfo.active ? colors.success : colors.textMuted },
                      ]}
                    >
                      {wInfo.label}
                    </Text>
                  </View>

                  <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: sizes.hairline,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: sizes.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  phone: {
    fontSize: 13,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 14,
  },
  statBox: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: sizes.hairline,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: radius.md,
    borderWidth: sizes.hairline,
  },
  newJobBtn: {
    flex: 1.2,
    height: 36,
    borderRadius: radius.md,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    marginBottom: 10,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: 30,
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 13,
  },
  jobCard: {
    borderRadius: radius.lg,
    borderWidth: sizes.hairline,
    padding: 12,
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderCode: {
    fontSize: 13,
    fontWeight: '800',
  },
  jobDate: {
    fontSize: 12,
  },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deviceModel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  problemText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  jobCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  costText: {
    fontSize: 13,
    fontWeight: '800',
  },
  warrantyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  warrantyText: {
    fontSize: 11,
    fontWeight: '600',
  },
});