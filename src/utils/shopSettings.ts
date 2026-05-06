import * as FileSystem from 'expo-file-system/legacy';

const SETTINGS_FILE = 'shop_branding.json';
const LOGO_FILE = 'shop_logo.jpg';

/** Default until the user saves a name in Settings. */
const DEFAULT_SHOP_NAME = 'MCA Phone Wala';

export type ShopBranding = {
  shopName: string;
  /** Persisted `file://` path in app documents, or null if no logo. */
  logoUri: string | null;
};

async function readSettingsFile(): Promise<ShopBranding | null> {
  const root = FileSystem.documentDirectory;
  if (!root) return null;
  const path = `${root}${SETTINGS_FILE}`;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;
  try {
    const raw = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(raw) as Partial<ShopBranding>;
    return {
      shopName: typeof parsed.shopName === 'string' && parsed.shopName.trim()
        ? parsed.shopName.trim()
        : DEFAULT_SHOP_NAME,
      logoUri: typeof parsed.logoUri === 'string' && parsed.logoUri.length > 0 ? parsed.logoUri : null,
    };
  } catch {
    return null;
  }
}

export async function getShopBranding(): Promise<ShopBranding> {
  const parsed = await readSettingsFile();
  const base: ShopBranding = parsed ?? {
    shopName: DEFAULT_SHOP_NAME,
    logoUri: null,
  };
  if (base.logoUri) {
    const logoInfo = await FileSystem.getInfoAsync(base.logoUri);
    if (!logoInfo.exists) {
      return { ...base, logoUri: null };
    }
  }
  return base;
}

export async function saveShopBranding(updates: Partial<ShopBranding>): Promise<void> {
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error('Document directory unavailable');
  const current = await getShopBranding();
  const next: ShopBranding = {
    shopName: updates.shopName ?? current.shopName,
    logoUri: updates.logoUri !== undefined ? updates.logoUri : current.logoUri,
  };
  await FileSystem.writeAsStringAsync(`${root}${SETTINGS_FILE}`, JSON.stringify(next));
}

/** Copy a picked image into documents and point branding at it. */
export async function setShopLogoFromPickerUri(pickerUri: string): Promise<void> {
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error('Document directory unavailable');
  const dest = `${root}${LOGO_FILE}`;
  await FileSystem.copyAsync({ from: pickerUri, to: dest });
  await saveShopBranding({ logoUri: dest });
}

export async function clearShopLogo(): Promise<void> {
  const root = FileSystem.documentDirectory;
  if (!root) return;
  const dest = `${root}${LOGO_FILE}`;
  const info = await FileSystem.getInfoAsync(dest);
  if (info.exists) {
    await FileSystem.deleteAsync(dest, { idempotent: true });
  }
  await saveShopBranding({ logoUri: null });
}
