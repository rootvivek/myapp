/**
 * Type declarations for react-native-dotenv's `@env` module.
 *
 * Values are injected at bundle time from the project `.env` file via the
 * `react-native-dotenv` Babel plugin (see babel.config.js).
 */
declare module '@env' {
  export const EXPO_PUBLIC_SUPABASE_URL: string;
  export const EXPO_PUBLIC_SUPABASE_ANON_KEY: string;

  export const EXPO_PUBLIC_MSG91_TOKEN_AUTH: string;
  export const EXPO_PUBLIC_MSG91_WIDGET_ID: string;

  export const UPDATE_API_URL: string;
  export const UPDATE_CHECK_INTERVAL: string;
  export const ENABLE_CODE_PUSH: string;
  export const ENABLE_APK_UPDATE: string;
  export const AUTO_DOWNLOAD_APK: string;
  export const SHOW_RELEASE_NOTES: string;

  export const APP_VERSION_NAME: string;
  export const APP_VERSION_CODE: string;
}
