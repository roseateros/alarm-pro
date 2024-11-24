import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <LottieView
        source={{ 
          uri: 'https://assets9.lottiefiles.com/packages/lf20_qm8eqzse.json'
        }}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animation: {
    width: 200,
    height: 200,
  },
}); 