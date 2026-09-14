import './src/theme/unistyles';

import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BillsScreen } from './src/screens/BillsScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    'ABC Diatype': require('./src/assets/fonts/ABCDiatype-Regular.otf'),
    'ABC Diatype Medium': require('./src/assets/fonts/ABCDiatype-Medium.otf'),
    'ABC Diatype Bold': require('./src/assets/fonts/ABCDiatype-Bold.otf'),
    'ABC Diatype Semi-Mono': require('./src/assets/fonts/ABCDiatypeSemi-Mono-Regular.otf'),
    'ABC Diatype Semi-Mono Medium': require('./src/assets/fonts/ABCDiatypeSemi-Mono-Medium.otf'),
    'ABC Diatype Semi-Mono Bold': require('./src/assets/fonts/ABCDiatypeSemi-Mono-Bold.otf'),
    Fraunces_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BillsScreen />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
