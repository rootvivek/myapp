/**
 * Embeds EXPO_PUBLIC_* into the native manifest so the client can read them via
 * expo-constants even if Metro's dev env polyfill misses a variable.
 */
const path = require('path');
const { loadDotenv } = require('./scripts/load-dotenv');
loadDotenv(__dirname);

module.exports = ({ config }) => ({
  ...config,
  ios: {
    ...config.ios,
    infoPlist: {
      ...(config.ios?.infoPlist ?? {}),
      // Required on iOS for Linking.canOpenURL / opening whatsapp:// URLs reliably
      LSApplicationQueriesSchemes: [
        ...(config.ios?.infoPlist?.LSApplicationQueriesSchemes ?? []),
        'whatsapp',
        'whatsapp-smb',
      ],
    },
  },
  extra: {
    ...(config.extra ?? {}),
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
});
