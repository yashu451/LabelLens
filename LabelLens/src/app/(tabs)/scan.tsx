import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Scan Screen Placeholder</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, color: Colors.textMain, fontWeight: '600' }
});
