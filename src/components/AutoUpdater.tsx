import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Download } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

export const CURRENT_VERSION_CODE = 5;
export const CURRENT_VERSION_NAME = '1.0.4';

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
      console.warn('[AutoUpdater] checkAppUpdate query error:', error);
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
    console.warn('[AutoUpdater] checkAppUpdate failed:', err);
  }
  return null;
}

export function AutoUpdater() {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);

  const performCheck = useCallback(async () => {
    const info = await checkAppUpdate();
    if (info && info.hasUpdate) {
      setUpdateInfo(info);
      setModalVisible(true);
      void triggerDownload(info.apkUrl);
    }
  }, []);

  useEffect(() => {
    void performCheck();
  }, [performCheck]);

  const triggerDownload = async (url: string) => {
    if (!url) return;

    // Security: validate URL before opening — must use HTTPS
    if (!url.startsWith('https://')) {
      Alert.alert('Security Warning', 'Download URL must use HTTPS. Update rejected.');
      return;
    }

    setDownloading(true);
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.warn('[AutoUpdater] Failed to open download URL:', err);
      Alert.alert(
        'Download Failed',
        'Could not open the download link in your browser. Please try again manually.',
      );
    } finally {
      // Keep downloading status active for 2s to show visual feedback
      setTimeout(() => setDownloading(false), 2000);
    }
  };

  if (!modalVisible || !updateInfo) return null;

  const isForce = updateInfo.isForceUpdate;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!isForce) {
          setModalVisible(false);
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(124, 58, 237, 0.12)' }]}>
              <Download size={24} color={colors.accent} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>New Update Available!</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Version v{updateInfo.versionName} (Build {updateInfo.versionCode}) is ready.
            </Text>
          </View>

          {/* Release Notes */}
          <Text style={[styles.label, { color: colors.textMuted }]}>Changelog</Text>
          <View style={[styles.notesContainer, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <ScrollView style={styles.notesScroll} contentContainerStyle={{ padding: 12 }}>
              <Text style={{ color: colors.text, fontSize: 13, lineHeight: 18 }}>
                {updateInfo.changelog || '• Bug fixes and performance improvements.'}
              </Text>
            </ScrollView>
          </View>

          {downloading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator color={colors.accent} style={{ marginRight: 10 }} />
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                Downloading update in browser...
              </Text>
            </View>
          ) : (
            <View style={styles.statusBox}>
              <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
                Download should start automatically. If it didn't, click "Download Now".
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {!isForce && (
              <Pressable
                onPress={() => setModalVisible(false)}
                style={[styles.btn, styles.btnSecondary, { borderColor: colors.border }]}
              >
                <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 14 }}>Not Now</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => void triggerDownload(updateInfo.apkUrl)}
              style={[styles.btn, { backgroundColor: colors.accent, flex: isForce ? 1 : 1.5 }]}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                {downloading ? 'Downloading...' : 'Download Now'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 22, 0.95)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  notesContainer: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  notesScroll: {
    flex: 1,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSecondary: {
    flex: 1,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
});
