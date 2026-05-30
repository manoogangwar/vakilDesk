import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { C } from '@/constants/colors';

type Props = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  show: boolean;
  onToggle: () => void;
  error?: string;
  autoComplete?: 'current-password' | 'new-password' | 'off';
};

export function PasswordInput({
  label,
  value,
  onChangeText,
  placeholder,
  show,
  onToggle,
  error,
  autoComplete,
}: Props) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrapper}>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.border}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
        />
        <TouchableOpacity style={styles.toggle} onPress={onToggle}>
          <Text style={styles.toggleText}>{show ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
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
  wrapper: { position: 'relative' },
  input: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    paddingRight: 60,
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 8,
    fontSize: 14,
    color: C.text,
  },
  inputError: { borderColor: C.error },
  toggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  errorText: {
    fontSize: 11,
    color: C.error,
    marginTop: 3,
  },
});
