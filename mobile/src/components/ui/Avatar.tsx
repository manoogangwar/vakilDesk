import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { C } from '@/constants/colors';

type Props = {
  initials: string;
  size?: number;
  style?: ViewStyle;
};

export function Avatar({ initials, size = 44, style }: Props) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: C.accent,
    fontWeight: '700',
  },
});
