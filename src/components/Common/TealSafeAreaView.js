import React from 'react';
import { View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function TealSafeAreaView({ children, edges, style, ...props }) {
  const { colors } = useTheme();
  
  // Forces the top padding area to be teal, while the inner content area uses the normal background
  return (
    <RNSafeAreaView 
      style={[style, { flex: 1, backgroundColor: '#14B8A6' }]} 
      edges={edges || ['top']} 
      {...props}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {children}
      </View>
    </RNSafeAreaView>
  );
}
