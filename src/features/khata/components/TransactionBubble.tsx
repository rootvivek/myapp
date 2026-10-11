import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

import { formatPaise } from '../utils/ledger';
import type { KhataTransaction } from '../types';

export function TransactionBubble({ transaction }: {
  transaction: KhataTransaction;
}) {
  const { colors } = useTheme();
  const isGiven = transaction.transactionType === 'payment_given';
  const isLeft = isGiven || transaction.transactionType === 'purchase' || transaction.transactionType === 'opening_balance';
  const bubbleColor = isGiven ? colors.surface2 : colors.accent;
  const textColor = isGiven ? colors.text : '#FFFFFF';
  const note = transaction.note.replace(/^(increase|decrease):/i, '').trim();

  return (
    <View style={{ width: '100%', alignItems: isLeft ? 'flex-start' : 'flex-end', marginBottom: 10 }}>
      <View style={{ maxWidth: '82%', minWidth: 110, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, backgroundColor: bubbleColor }}>
        <Text style={{ color: textColor, fontSize: 16, fontWeight: '800' }}>
          {formatPaise(transaction.amountPaise)}
        </Text>
        {note ? (
          <Text style={{ color: textColor, fontSize: 13, marginTop: 3 }}>
            {note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
