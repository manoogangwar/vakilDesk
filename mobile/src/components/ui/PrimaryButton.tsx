import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { C } from '@/constants/colors';

type Props = TouchableOpacityProps & {
  title: string;
  loading?: boolean;
};

export function PrimaryButton({ title, loading, disabled, style, ...props }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, (disabled || loading) ? styles.btnDisabled : null, style]}
      disabled={disabled || loading}
      activeOpacity={0.82}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={C.white} />
      ) : (
        <Text style={styles.label}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    paddingVertical: 13,
    backgroundColor: C.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.6 },
  label: {
    color: C.white,
    fontSize: 14.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
