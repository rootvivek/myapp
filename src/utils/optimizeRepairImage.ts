import type { RepairImageSlot } from '../types/repair';

/**
 * Stub: without expo-image-manipulator, we just return the original URI.
 * For production, integrate a library like react-native-image-resizer.
 */
export async function optimizeRepairImageForUpload(uri: string, _slot: RepairImageSlot): Promise<string> {
  if (!uri || uri.startsWith('http')) return uri;
  return uri;
}
