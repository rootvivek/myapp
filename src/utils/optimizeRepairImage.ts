import { manipulateAsync, SaveFormat, type Action } from 'expo-image-manipulator';
import { Image } from 'react-native';

import type { RepairImageSlot } from '../types/repair';

/** Long edge cap for phone / ID photos (good balance for screen + print). */
const MAX_LONG_EDGE_MAIN = 1600;
/** Smaller thumbnail for lists. */
const MAX_LONG_EDGE_THUMB = 720;
const COMPRESS_MAIN = 0.82;
const COMPRESS_THUMB = 0.78;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (e) => reject(e)
    );
  });
}

/**
 * Resize (if too large) and JPEG-compress before upload. Skips remote URLs.
 * On failure, returns the original URI so upload can still attempt.
 */
export async function optimizeRepairImageForUpload(uri: string, slot: RepairImageSlot): Promise<string> {
  if (!uri || uri.startsWith('http')) return uri;

  const maxLongEdge = slot === 'thumb' ? MAX_LONG_EDGE_THUMB : MAX_LONG_EDGE_MAIN;
  const compress = slot === 'thumb' ? COMPRESS_THUMB : COMPRESS_MAIN;

  try {
    const { width: w, height: h } = await getImageSize(uri);
    const actions: Action[] = [];
    if (w >= h && w > maxLongEdge) {
      actions.push({ resize: { width: maxLongEdge } });
    } else if (h > w && h > maxLongEdge) {
      actions.push({ resize: { height: maxLongEdge } });
    }

    const { uri: out } = await manipulateAsync(uri, actions, {
      compress,
      format: SaveFormat.JPEG,
    });
    return out;
  } catch {
    return uri;
  }
}
