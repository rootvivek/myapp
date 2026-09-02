import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, MessageSquare, Pencil, Phone } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import type { Repair } from '../../types/repair';
import { formatCurrency, formatDateDisplay } from '../../utils/format';
import { calculateDue } from './financeHelpers';
import { styles } from './styles';

type Props = {
  item: Repair;
  subTab: 'dues' | 'paid';
  colors: AppColors;
  onNavigateDetail: (repairId: number) => void;
  onSendWhatsAppReminder: (item: Repair) => void;
  onMarkPaid: (item: Repair) => void;
  onStartEdit: (item: Repair) => void;
  onCall: (phone: string) => void;
};

export const FinanceListItem = React.memo(function FinanceListItem({
  item,
  subTab,
  colors,
  onNavigateDetail,
  onSendWhatsAppReminder,
  onMarkPaid,
  onStartEdit,
  onCall,
}: Props) {
  const cost = Number(item.repairCost || 0);
  const adv = Number(item.advanceAmount || 0);
  const due = calculateDue(cost, adv);

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        onPress={() => onNavigateDetail(item.id)}
        style={styles.rowMain}
        android_ripple={{ color: colors.surface2 }}
      >
        <View style={styles.rowHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.custName, { color: colors.text }]} numberOfLines={1}>
              {item.customerName}
            </Text>
            <Text style={[styles.device, { color: colors.textMuted }]} numberOfLines={1}>
              {item.deviceModel || 'Device repair'}
              {item.orderCode ? ` · ${item.orderCode}` : ''}
            </Text>
          </View>
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {formatDateDisplay(item.dateReceived)}
          </Text>
        </View>

        <View style={[styles.amountRow, { borderTopColor: colors.border }]}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginRight: 6 }}>
            <Text style={[styles.costBreakdown, { color: colors.text }]}>
              Cost: <Text style={{ fontWeight: '700' }}>{formatCurrency(cost)}</Text>
            </Text>
            {adv > 0 ? (
              <Text style={{ fontSize: 11.5, color: colors.textMuted, fontWeight: '600' }}>
                (Adv: {formatCurrency(adv)})
              </Text>
            ) : null}
            {subTab === 'dues' ? (
              <>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>·</Text>
                <Text style={{ fontSize: 12.5, fontWeight: '800', color: colors.danger }}>
                  Due: {formatCurrency(due)}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ color: colors.textMuted, fontSize: 11 }}>·</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>
                  {item.paymentType === 'online' ? 'Online' : 'Cash'}
                </Text>
              </>
            )}
          </View>

          {subTab === 'dues' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {item.phone ? (
                <Pressable
                  onPress={() => onSendWhatsAppReminder(item)}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 'rgba(34, 197, 94, 0.12)',
                      paddingHorizontal: 8,
                      paddingVertical: 5,
                      borderRadius: 6,
                      gap: 4,
                      borderWidth: 1,
                      borderColor: 'rgba(34, 197, 94, 0.25)',
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Send WhatsApp reminder"
                >
                  <MessageSquare size={11} color="#22C55E" />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#22C55E' }}>
                    Remind
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.paidBadge}>
              <CheckCircle2 size={13} color={colors.success} strokeWidth={2.4} />
              <Text style={[styles.paidText, { color: colors.success }]}>Paid</Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={[styles.rowActions, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }]}>
        {subTab === 'dues' && (
          <Pressable
            onPress={() => onMarkPaid(item)}
            style={({ pressed }) => [
              styles.actionIconBtn,
              { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, backgroundColor: 'rgba(34, 197, 94, 0.08)' },
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Mark as Paid"
          >
            <CheckCircle2 size={16} color={colors.success} strokeWidth={2.4} />
          </Pressable>
        )}
        <Pressable
          onPress={() => onStartEdit(item)}
          style={({ pressed }) => [
            styles.actionIconBtn,
            item.phone ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border } : {},
            pressed && { opacity: 0.6 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Edit payment amount"
        >
          <Pencil size={15} color={colors.textMuted} />
        </Pressable>
        {item.phone ? (
          <Pressable
            onPress={() => onCall(item.phone)}
            style={({ pressed }) => [
              styles.actionIconBtn,
              { backgroundColor: colors.surface2 },
              pressed && { opacity: 0.6 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Call customer"
          >
            <Phone size={15} color={colors.accent} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

