import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RepairsProvider } from './src/context/RepairsContext';
import { InventoryProvider } from './src/context/InventoryContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthScreen } from './src/screens/AuthScreen';
import { SplashScreen } from './src/components/SplashScreen';

function AuthenticatedApp() {
  const { configured, loading, session } = useAuth();
  const { colors, mode } = useTheme();

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
    <RepairsProvider>
      <InventoryProvider>
        <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
        <AppNavigator />
      </InventoryProvider>
    </RepairsProvider>
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
