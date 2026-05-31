import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '@/constants/colors';

type BadgeValue =
  | 'admin' | 'lawyer' | 'client'
  | 'active' | 'inactive'
  | 'pending' | 'partial' | 'paid'
  | 'open' | 'adjourned' | 'disposed' | 'on_hold';

const STYLES: Record<BadgeValue, { bg: string; color: string }> = {
  // roles
  admin:    { bg: 'rgba(26,39,68,0.1)',    color: C.primary },
  lawyer:   { bg: 'rgba(201,168,71,0.15)', color: '#856d12' },
  client:   { bg: 'rgba(5,150,105,0.1)',   color: C.success },
  // user status
  active:   { bg: 'rgba(5,150,105,0.1)',   color: C.success },
  inactive: { bg: 'rgba(220,38,38,0.08)',  color: C.error },
  // payment status
  pending:  { bg: 'rgba(220,38,38,0.08)',  color: C.error },
  partial:  { bg: 'rgba(217,119,6,0.1)',   color: '#b45309' },
  paid:     { bg: 'rgba(5,150,105,0.1)',   color: C.success },
  // case status
  open:     { bg: 'rgba(26,39,68,0.1)',    color: C.primary },
  adjourned:{ bg: 'rgba(217,119,6,0.1)',   color: '#b45309' },
  disposed: { bg: 'rgba(5,150,105,0.1)',   color: C.success },
  on_hold:  { bg: 'rgba(107,114,128,0.1)', color: C.textMuted },
};

type Props = {
  value: BadgeValue | string;
};

export function Badge({ value }: Props) {
  const s = STYLES[value as BadgeValue] ?? { bg: C.border, color: C.textMuted };
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
