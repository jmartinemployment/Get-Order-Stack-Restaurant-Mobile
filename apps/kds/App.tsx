import { StatusBar } from 'expo-status-bar';
import { KitchenDisplayScreen } from './src/screens/KitchenDisplayScreen';

export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <KitchenDisplayScreen />
    </>
  );
}
