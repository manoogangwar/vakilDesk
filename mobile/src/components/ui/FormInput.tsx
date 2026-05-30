import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { C } from '@/constants/colors';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export function FormInput({ label, error, style, ...props }: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={C.border}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 8,
    fontSize: 14,
    color: C.text,
  },
  inputError: {
    borderColor: C.error,
  },
  errorText: {
    fontSize: 11,
    color: C.error,
    marginTop: 3,
  },
});
