import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '@/constants/colors';

type Props = {
  type: 'error' | 'success';
  message: string;
};

export function AlertBox({ type, message }: Props) {
  const isError = type === 'error';
  return (
    <View style={[styles.box, isError ? styles.error : styles.success]}>
      <Text style={[styles.prefix, isError ? styles.errorText : styles.successText]}>
        {isError ? '⚠ ' : '✓ '}
      </Text>
      <Text style={[styles.msg, isError ? styles.errorText : styles.successText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  error: {
    backgroundColor: C.errorBg,
    borderColor: 'rgba(220,38,38,0.15)',
  },
  success: {
    backgroundColor: C.successBg,
    borderColor: 'rgba(5,150,105,0.15)',
  },
  prefix: { fontSize: 13, lineHeight: 20 },
  msg: { flex: 1, fontSize: 13, lineHeight: 20 },
  errorText: { color: C.error },
  successText: { color: C.success },
});
