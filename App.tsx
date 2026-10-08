import { useEffect } from 'react';
import { Linking, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

// Polyfill URL for Supabase (must be before supabase import)
import './src/polyfills/url';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { TabProvider } from './src/context/TabContext';
import { RepairsProvider } from './src/context/RepairsContext';
import { InventoryProvider } from './src/context/InventoryContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SplashScreen } from './src/components/SplashScreen';
import { AutoUpdateInitializer } from './src/components/AutoUpdateInitializer';
import { handleAuthDeepLink } from './src/auth/deepLink';
import { supabase } from './src/lib/supabase';
import { createPaperTheme } from './src/theme/paperTheme';

function AuthenticatedApp() {
  const { loading } = useAuth();
  const { mode } = useTheme();

  // Single Paper provider for the whole app: all Paper primitives read the
  // design-system theme from here.
  const paperTheme = createPaperTheme(mode);

  // The app always opens on the home dashboard — login / sign-up is reachable
  // from the "User" tab in the bottom navigation.
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <RepairsProvider>
        <InventoryProvider>
          <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
          <AutoUpdateInitializer />
          <TabProvider>
            <AppNavigator />
          </TabProvider>
        </InventoryProvider>
      </RepairsProvider>
    </PaperProvider>
  );
}

export default function App() {
  useEffect(() => {
    const handleUrl = (url?: string | null) => {
      void handleAuthDeepLink(supabase, url).catch((err) => {
        console.warn('[App] Failed to handle auth deep link:', err);
      });
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    void Linking.getInitialURL().then(handleUrl);

    return () => {
      subscription.remove();
    };
  }, []);

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
