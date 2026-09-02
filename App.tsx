import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RepairsProvider } from './src/context/RepairsContext';
import { InventoryProvider } from './src/context/InventoryContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthScreen } from './src/screens/AuthScreen';
import { SplashScreen } from './src/components/SplashScreen';

function AuthenticatedApp() {
  const { configured, loading, session } = useAuth();
  const { mode } = useTheme();

  const paperTheme = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;

  if (!configured) {
    return <AuthScreen />;
  }

  if (loading) {
    return <SplashScreen />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <RepairsProvider>
        <InventoryProvider>
          <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
          <AppNavigator />
        </InventoryProvider>
      </RepairsProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
