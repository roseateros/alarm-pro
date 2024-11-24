import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

export default function GradientBackground({ children }) {
  return (
    <LinearGradient
      colors={['#F7F7FF', '#E6E6FF']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
}); 