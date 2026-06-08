import ImageResizer from 'react-native-image-resizer';
import type { RepairImageSlot } from '../types/repair';

/**
 * Per-slot compression targets.
 * Thumbnails are smaller; front/back/ID photos get a higher resolution budget.
 */
const SLOT_CONFIG: Record<RepairImageSlot, { maxSize: number; quality: number }> = {
  front: { maxSize: 1200, quality: 70 },
  back:  { maxSize: 1200, quality: 70 },
  id1:   { maxSize: 1000, quality: 70 },
  id2:   { maxSize: 1000, quality: 70 },
};

/**
 * Compress and resize a local image before uploading to Supabase.
 * Skips remote (http) URLs — those are already uploaded.
 * Returns the URI of the compressed image.
 */
export async function optimizeRepairImageForUpload(
  uri: string,
  slot: RepairImageSlot,
): Promise<string> {
  // Skip empty URIs and already-uploaded remote URLs
  if (!uri || uri.startsWith('http')) return uri;

  const { maxSize, quality } = SLOT_CONFIG[slot];

  try {
    const result = await ImageResizer.createResizedImage(
      uri,
      maxSize,    // maxWidth
      maxSize,    // maxHeight
      'JPEG',     // output format
      quality,    // compression quality (0–100)
      0,          // rotation
      undefined,  // output path (undefined = temp directory)
      false,      // keep metadata
      { mode: 'contain', onlyScaleDown: true },
    );
    return result.uri;
  } catch {
    // If compression fails, fall back to the original URI
    // so the upload still works (just uncompressed)
    return uri;
  }
}
