import { useEffect } from 'react';
import { Linking, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RepairsProvider } from './src/context/RepairsContext';
import { InventoryProvider } from './src/context/InventoryContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthScreen } from './src/screens/AuthScreen';
import { SplashScreen } from './src/components/SplashScreen';
import { supabase } from './src/lib/supabase';

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
  useEffect(() => {
    const handleUrl = async (url?: string | null) => {
      if (!url || !supabase) return;

      try {
        const { data, error } = await supabase.auth.getSessionFromUrl({ url });
        if (error) {
          return;
        }

        if (data?.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }
      } catch {}
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
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
