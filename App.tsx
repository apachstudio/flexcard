import './src/theme/unistyles';

import { useState } from 'react';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BillsScreen } from './src/screens/BillsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CardSpecsProvider } from './src/specs/cardSpecs';

export default function App() {
  // Opens on Home; tapping Bills navigates there and remounts its content on
  // every subsequent tap (a "page reload").
  const [tab, setTab] = useState<'home' | 'bills'>('home');
  const [billsRunId, setBillsRunId] = useState(0);

  const goToBills = () => {
    setTab('bills');
    setBillsRunId((r) => r + 1);
  };
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
        <CardSpecsProvider>
          {tab === 'home' ? (
            <HomeScreen onBillsPress={goToBills} />
          ) : (
            <BillsScreen
              reloadId={billsRunId}
              onBillsPress={goToBills}
              onHomePress={() => setTab('home')}
            />
          )}
          <StatusBar style="dark" />
        </CardSpecsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
