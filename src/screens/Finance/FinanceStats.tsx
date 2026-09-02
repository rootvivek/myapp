import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowUpRight, CheckCircle2, ChevronDown, ChevronUp, TrendingUp, Wallet } from 'lucide-react-native';
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
      {/* Total Received — Main Hero Card */}
      <View style={[styles.fullStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.fullStatHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(34, 197, 94, 0.25)',
              }}
            >
              <Wallet size={18} color={colors.success} />
            </View>
            <View>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Received</Text>
              <Text style={[styles.fullStatValue, { color: colors.success, marginTop: 0 }]}>
                {formatCurrency(stats.totalPaid)}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}
            >
              <CheckCircle2 size={12} color={colors.success} strokeWidth={2.5} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.success }}>Collected</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            paddingTop: 8,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface2,
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 8,
              marginRight: 6,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 10.5, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>
              💵 Cash
            </Text>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginTop: 1 }}>
              {formatCurrency(stats.cashPaid)}
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.surface2,
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 8,
              marginLeft: 6,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 10.5, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' }}>
              📱 Online
            </Text>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, marginTop: 1 }}>
              {formatCurrency(stats.onlinePaid)}
            </Text>
          </View>
        </View>

        {/* Accordion toggle */}
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              marginTop: 10,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            },
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Hide details' : 'Show expense and profit details'}
        >
          <Text style={{ fontSize: 11.5, color: colors.accent, fontWeight: '700' }}>
            {expanded ? 'Hide Breakdown' : 'Show Expense & Profit'}
          </Text>
          {expanded ? (
            <ChevronUp size={14} color={colors.accent} />
          ) : (
            <ChevronDown size={14} color={colors.accent} />
          )}
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
              <Text style={[styles.statSubText, { color: colors.textMuted }]}>Parts & costs</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Net Profit</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {formatCurrency(stats.netProfit)}
              </Text>
              <Text style={[styles.statSubText, { color: colors.textMuted }]}>Revenue - Expense</Text>
            </View>
          </View>

          {/* Grand Total Business */}
          <View style={[styles.fullStatCard, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 8 }]}>
            <View style={styles.fullStatHeader}>
              <View>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Grand Total Business</Text>
                <Text style={[styles.fullStatValue, { color: colors.text, marginTop: 2, fontSize: 20 }]}>
                  {formatCurrency(stats.totalValue)}
                </Text>
              </View>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: 'rgba(139, 92, 246, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(139, 92, 246, 0.25)',
                }}
              >
                <TrendingUp size={16} color={colors.accent} />
              </View>
            </View>
          </View>
        </>
      )}
    </>
  );
});

