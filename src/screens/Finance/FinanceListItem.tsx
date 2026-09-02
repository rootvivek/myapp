import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckCircle, MessageSquare, Pencil, Phone } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import type { Repair } from '../../types/repair';
import { formatCurrency, formatDateDisplay } from '../../utils/format';
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

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        onPress={() => onNavigateDetail(item.id)}
        style={styles.rowMain}
      >
        <View style={styles.rowHeader}>
          <Text style={[styles.custName, { color: colors.text }]} numberOfLines={1}>
            {item.customerName}
          </Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {formatDateDisplay(item.dateReceived)}
          </Text>
        </View>
        <Text style={[styles.device, { color: colors.textMuted }]} numberOfLines={1}>
          {item.deviceModel}
        </Text>
        <View style={styles.amountRow}>
          <Text style={[styles.costBreakdown, { color: colors.textMuted }]}>
            Total: {formatCurrency(cost)} (Adv: {formatCurrency(adv)})
          </Text>
          {subTab === 'dues' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.unpaidBadge}>
                <Text style={[styles.unpaidText, { color: colors.danger }]}>Unpaid</Text>
              </View>
              {item.phone ? (
                <Pressable
                  onPress={() => onSendWhatsAppReminder(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    gap: 4,
                    borderWidth: 1,
                    borderColor: 'rgba(34, 197, 94, 0.25)',
                  }}
                >
                  <MessageSquare size={10} color="#22C55E" fill="#22C55E" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#22C55E' }}>
                    Remind
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.paidBadge}>
              <CheckCircle size={14} color={colors.success} />
              <Text style={[styles.paidText, { color: colors.success }]}>Paid</Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={[styles.rowActions, { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.border }]}>
        {subTab === 'dues' && (
          <Pressable
            onPress={() => onMarkPaid(item)}
            style={[styles.actionIconBtn, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
          >
            <CheckCircle size={15} color={colors.success} />
          </Pressable>
        )}
        <Pressable
          onPress={() => onStartEdit(item)}
          style={[styles.actionIconBtn, item.phone ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border } : {}]}
        >
          <Pencil size={15} color={colors.textMuted} />
        </Pressable>
        {item.phone ? (
          <Pressable
            onPress={() => onCall(item.phone)}
            style={[styles.actionIconBtn, { backgroundColor: colors.surface2 }]}
          >
            <Phone size={15} color={colors.accent} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});
