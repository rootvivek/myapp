import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@myapp_shop_branding';

/** Default until the user saves a name in Settings. */
const DEFAULT_SHOP_NAME = 'MCA Phone Wala';
const DEFAULT_SHOP_PHONE = '8881765192';

export type ShopBranding = {
  shopName: string;
  /** Persisted `file://` path or null if no logo. */
  logoUri: string | null;
  shopPhone: string;
};

export async function getShopBranding(): Promise<ShopBranding> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { shopName: DEFAULT_SHOP_NAME, logoUri: null, shopPhone: DEFAULT_SHOP_PHONE };
    const parsed = JSON.parse(raw) as Partial<ShopBranding>;
    return {
      shopName:
        typeof parsed.shopName === 'string' && parsed.shopName.trim()
          ? parsed.shopName.trim()
          : DEFAULT_SHOP_NAME,
      logoUri:
        typeof parsed.logoUri === 'string' && parsed.logoUri.length > 0
          ? parsed.logoUri
          : null,
      shopPhone:
        typeof parsed.shopPhone === 'string' && parsed.shopPhone.trim()
          ? parsed.shopPhone.trim()
          : DEFAULT_SHOP_PHONE,
    };
  } catch {
    return { shopName: DEFAULT_SHOP_NAME, logoUri: null, shopPhone: DEFAULT_SHOP_PHONE };
  }
}

export async function saveShopBranding(updates: Partial<ShopBranding>): Promise<void> {
  const current = await getShopBranding();
  const next: ShopBranding = {
    shopName: updates.shopName ?? current.shopName,
    logoUri: updates.logoUri !== undefined ? updates.logoUri : current.logoUri,
    shopPhone: updates.shopPhone ?? current.shopPhone,
  };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

/** Copy a picked image into documents and point branding at it. */
export async function setShopLogoFromPickerUri(pickerUri: string): Promise<void> {
  // For now just store the picker URI directly
  await saveShopBranding({ logoUri: pickerUri });
}

export async function clearShopLogo(): Promise<void> {
  await saveShopBranding({ logoUri: null });
}
