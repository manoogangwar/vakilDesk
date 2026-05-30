import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '@/constants/colors';

type Variant = 'navy' | 'gold' | 'green' | 'purple';

const BG: Record<Variant, string> = {
  navy: 'rgba(26,39,68,0.08)',
  gold: 'rgba(201,168,71,0.13)',
  green: 'rgba(5,150,105,0.09)',
  purple: 'rgba(124,58,237,0.08)',
};

type Props = {
  icon: string;
  value: string | number;
  label: string;
  variant: Variant;
};

export function StatCard({ icon, value, label, variant }: Props) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: BG[variant] }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  value: {
    fontSize: 26,
    fontWeight: '700',
    color: C.primary,
    lineHeight: 30,
  },
  label: { fontSize: 12.5, color: C.textMuted, fontWeight: '500', marginTop: 2 },
});
