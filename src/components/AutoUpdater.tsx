import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export const CURRENT_VERSION_CODE = 14;
export const CURRENT_VERSION_NAME = '1.2.2';

export type UpdateInfo = {
  hasUpdate: boolean;
  versionCode: number;
  versionName: string;
  apkUrl: string;
  changelog: string;
  isForceUpdate: boolean;
};

export async function checkAppUpdate(): Promise<UpdateInfo | null> {
  try {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('app_versions')
      .select('version_code, version_name, apk_url, changelog, is_force_update')
      .order('version_code', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return null;
    }

    if (!data) return null;

    const dbVersionCode = data.version_code;
    if (dbVersionCode > CURRENT_VERSION_CODE) {
      return {
        hasUpdate: true,
        versionCode: dbVersionCode,
        versionName: data.version_name,
        apkUrl: data.apk_url,
        changelog: data.changelog || '',
        isForceUpdate: !!data.is_force_update,
      };
    }
  } catch (err) {
    logger.warn('[AutoUpdater] checkAppUpdate failed:', err);
  }
  return null;
}