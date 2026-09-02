import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowUpRight, CheckCircle, ChevronDown, ChevronUp, Wallet } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { formatCurrency } from '../../utils/format';
import { styles } from './styles';

type StatsData = {
  totalPaid: number;
  totalDues: number;
  totalValue: number;
  totalExpense: number;
  netProfit: number;
  cashPaid: number;
  onlinePaid: number;
};

type Props = {
  stats: StatsData;
  colors: AppColors;
};

export const FinanceStats = React.memo(function FinanceStats({ stats, colors }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Total Received — always visible */}
      <View style={[styles.fullStatCard, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 8 }]}>
        <View style={styles.fullStatHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Wallet size={22} color={colors.success} />
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Received</Text>
          </View>
          <CheckCircle size={16} color={colors.success} />
        </View>
        <Text style={[styles.fullStatValue, { color: colors.success }]}>
          {formatCurrency(stats.totalPaid)}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 }}>
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
            💵 Cash: <Text style={{ color: colors.text, fontWeight: '700' }}>{formatCurrency(stats.cashPaid)}</Text>
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
            📱 Online: <Text style={{ color: colors.text, fontWeight: '700' }}>{formatCurrency(stats.onlinePaid)}</Text>
          </Text>
        </View>

        {/* Accordion toggle */}
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            marginTop: 10,
            paddingTop: 8,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Hide details' : 'Show expense and profit details'}
        >
          <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>
            {expanded ? 'Hide details' : 'Show expense & profit'}
          </Text>
          {expanded
            ? <ChevronUp size={13} color={colors.textMuted} />
            : <ChevronDown size={13} color={colors.textMuted} />
          }
        </Pressable>
      </View>

      {/* Accordion content — hidden by default */}
      {expanded && (
        <>
          {/* Expense and Net Profit */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Expense</Text>
              <Text style={[styles.statValue, { color: colors.danger }]}>
                {formatCurrency(stats.totalExpense)}
              </Text>
              <Text style={[styles.statSubText, { color: colors.textMuted }]}>Out of pocket</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Net Profit</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {formatCurrency(stats.netProfit)}
              </Text>
              <Text style={[styles.statSubText, { color: colors.textMuted }]}>Business - Expense</Text>
            </View>
          </View>

          {/* Grand Total Business */}
          <View style={[styles.fullStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.fullStatHeader}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Grand Total Business</Text>
              <ArrowUpRight size={16} color={colors.accent} />
            </View>
            <Text style={[styles.fullStatValue, { color: colors.text }]}>
              {formatCurrency(stats.totalValue)}
            </Text>
          </View>
        </>
      )}
    </>
  );
});
