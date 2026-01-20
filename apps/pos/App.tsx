import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { CartProvider } from './src/context/CartContext';
import { MenuScreen } from './src/screens/MenuScreen';

export default function App() {
  return (
    <CartProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <MenuScreen />
      </SafeAreaView>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
