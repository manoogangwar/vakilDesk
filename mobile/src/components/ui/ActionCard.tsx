import React from 'react';
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { C } from '@/constants/colors';

type Props = TouchableOpacityProps & {
  icon: string;
  label: string;
  description: string;
};

export function ActionCard({ icon, label, description, ...props }: Props) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.75} {...props}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.desc}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    minWidth: 140,
  },
  icon: { fontSize: 28, marginBottom: 8 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
    marginBottom: 3,
  },
  desc: {
    fontSize: 11.5,
    color: C.textMuted,
    textAlign: 'center',
  },
});
