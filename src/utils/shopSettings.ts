import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { logger } from './logger';

const BASE_SETTINGS_KEY = '@myapp_shop_branding';
const LOGO_BUCKET = 'shop-logos';

/** Last resort when neither the shops row nor the profile has a name. */
const FALLBACK_SHOP_NAME = 'MCA Phone Wala';

/**
 * The hardcoded shop number older builds persisted into AsyncStorage. It is
 * ignored on read so an invoice can never print this instead of the owner's
 * real number.
 */
const LEGACY_DEFAULT_SHOP_PHONE = '8881765192';

export type ShopBranding = {
  shopName: string;
  /** Supabase Storage URL or null if no logo. */
  logoUri: string | null;
  /** Shop contact number, printed on invoices. Empty when unknown. */
  shopPhone: string;
};

/** Normalize a stored phone, discarding the legacy hardcoded default. */
function sanitizePhone(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits || digits === LEGACY_DEFAULT_SHOP_PHONE) return '';
  return trimmed;
}

function getKey(shopOrUserId?: string): string {
  if (shopOrUserId && shopOrUserId.trim()) {
    return `${BASE_SETTINGS_KEY}_${shopOrUserId.trim()}`;
  }
  return BASE_SETTINGS_KEY;
}

function parseBranding(raw: string): ShopBranding {
  try {
    const parsed = JSON.parse(raw) as Partial<ShopBranding>;
    return {
      shopName:
        typeof parsed.shopName === 'string' && parsed.shopName.trim()
          ? parsed.shopName.trim()
          : FALLBACK_SHOP_NAME,
      logoUri:
        typeof parsed.logoUri === 'string' && parsed.logoUri.length > 0
          ? parsed.logoUri
          : null,
      shopPhone: sanitizePhone(parsed.shopPhone),
    };
  } catch {
    return emptyBranding();
  }
}

function emptyBranding(): ShopBranding {
  return { shopName: FALLBACK_SHOP_NAME, logoUri: null, shopPhone: '' };
}

async function readCachedBranding(shopOrUserId?: string): Promise<ShopBranding> {
  try {
    const raw = await AsyncStorage.getItem(getKey(shopOrUserId));
    if (raw) return parseBranding(raw);

    if (shopOrUserId) {
      const baseRaw = await AsyncStorage.getItem(BASE_SETTINGS_KEY);
      if (baseRaw) return parseBranding(baseRaw);
    }
  } catch (err) {
    logger.warn('[shopSettings] branding cache read failed:', err);
  }
  return emptyBranding();
}

type DbBranding = { shopName: string; shopPhone: string; logoUrl: string | null };

/**
 * The source of truth for shop name/phone/logo: the signed-in user's shop row,
 * falling back to their own profile. `shops.phone` may be missing on an older
 * database, so it is queried on its own and tolerated.
 */
async function fetchBrandingFromDb(): Promise<DbBranding | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return null;

    const profileRes = (await supabase
      .from('profiles')
      .select('phone, shop_id, shop_logo_url')
      .eq('id', userId)
      .maybeSingle()) as unknown as {
      data: { phone?: string; shop_id?: string; shop_logo_url?: string } | null;
      error: { message: string } | null;
    };

    if (profileRes.error) {
      logger.warn('[shopSettings] profile lookup failed:', profileRes.error.message);
      return null;
    }

    const profilePhone = sanitizePhone(profileRes.data?.phone);
    const logoUrl = profileRes.data?.shop_logo_url?.trim() || null;
    const shopId = profileRes.data?.shop_id ?? '';
    if (!shopId) {
      return { shopName: '', shopPhone: profilePhone, logoUrl };
    }

    let shopRes = (await supabase
      .from('shops')
      .select('shop_name, phone')
      .eq('id', shopId)
      .maybeSingle()) as unknown as { data: any; error: any };

    // Older databases have no shops.phone column yet; fall back to name only.
    if (shopRes.error && /phone/i.test(String(shopRes.error.message))) {
      shopRes = (await supabase
        .from('shops')
        .select('shop_name')
        .eq('id', shopId)
        .maybeSingle()) as unknown as { data: any; error: any };
    }

    if (shopRes.error) {
      logger.warn('[shopSettings] shop lookup failed:', shopRes.error.message);
      return { shopName: '', shopPhone: profilePhone, logoUrl };
    }

    const row = (shopRes.data ?? {}) as { shop_name?: string; phone?: string };
    return {
      shopName: String(row.shop_name ?? '').trim(),
      // The shop's own number is the shop's contact; the profile phone is the
      // owner's (correct fallback for owners, who have no shop row yet).
      shopPhone: sanitizePhone(row.phone) || profilePhone,
      logoUrl,
    };
  } catch (err) {
    logger.warn('[shopSettings] branding lookup failed:', err);
    return null;
  }
}

/**
 * Shop name, logo and phone used on invoices and in Settings. The database
 * always wins; the local cache supplies the logo instantly and fills in
 * anything the database does not know yet.
 */
export async function getShopBranding(shopOrUserId?: string): Promise<ShopBranding> {
  const cached = await readCachedBranding(shopOrUserId);
  const db = await fetchBrandingFromDb();
  if (!db) return cached;

  const merged: ShopBranding = {
    shopName: db.shopName || cached.shopName || FALLBACK_SHOP_NAME,
    logoUri: db.logoUrl || cached.logoUri,
    shopPhone: db.shopPhone || cached.shopPhone,
  };

  const changed =
    merged.shopName !== cached.shopName ||
    merged.shopPhone !== cached.shopPhone ||
    merged.logoUri !== cached.logoUri;

  if (changed) {
    void saveShopBranding(merged, shopOrUserId).catch((err) =>
      logger.warn('[shopSettings] branding cache write failed:', err)
    );
  }

  return merged;
}

/**
 * Persist branding locally. Deliberately reads only the cache (never the
 * database) so saving can never recurse back into getShopBranding().
 */
export async function saveShopBranding(
  updates: Partial<ShopBranding>,
  shopOrUserId?: string
): Promise<void> {
  const current = await readCachedBranding(shopOrUserId);
  const next: ShopBranding = {
    shopName: updates.shopName ?? current.shopName,
    logoUri: updates.logoUri !== undefined ? updates.logoUri : current.logoUri,
    shopPhone: sanitizePhone(updates.shopPhone ?? current.shopPhone),
  };
  const key = getKey(shopOrUserId);
  await AsyncStorage.setItem(key, JSON.stringify(next));
  if (key !== BASE_SETTINGS_KEY) {
    await AsyncStorage.setItem(BASE_SETTINGS_KEY, JSON.stringify(next));
  }
}

/** Copy a picked image into documents and point branding at it. */
export async function setShopLogoFromPickerUri(
  pickerUri: string,
  shopOrUserId?: string
): Promise<void> {
  await saveShopBranding({ logoUri: pickerUri }, shopOrUserId);
}

async function readUriAsBytes(uri: string): Promise<Uint8Array> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Failed to read logo: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function uploadShopLogoFromPickerUri(pickerUri: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const path = `${user.id}/logo.jpg`;
  const bytes = await readUriAsBytes(pickerUri);
  const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) {
    if (error.message.includes('Bucket not found')) {
      throw new Error('Storage bucket "shop-logos" is missing. Run supabase/schema.sql.');
    }
    throw error;
  }

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function clearShopLogo(shopOrUserId?: string): Promise<void> {
  await saveShopBranding({ logoUri: null }, shopOrUserId);
}
