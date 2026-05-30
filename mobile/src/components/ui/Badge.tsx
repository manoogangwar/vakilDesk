import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '@/constants/colors';

type Role = 'admin' | 'lawyer' | 'client' | 'active' | 'inactive';

const STYLES: Record<Role, { bg: string; color: string }> = {
  admin: { bg: 'rgba(26,39,68,0.1)', color: C.primary },
  lawyer: { bg: 'rgba(201,168,71,0.15)', color: '#856d12' },
  client: { bg: 'rgba(5,150,105,0.1)', color: C.success },
  active: { bg: 'rgba(5,150,105,0.1)', color: C.success },
  inactive: { bg: 'rgba(220,38,38,0.08)', color: C.error },
};

type Props = {
  value: Role | string;
};

export function Badge({ value }: Props) {
  const s = STYLES[value as Role] ?? { bg: C.border, color: C.textMuted };
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
