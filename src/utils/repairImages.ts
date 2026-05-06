import * as FileSystem from 'expo-file-system/legacy';

import type { Repair, RepairImageSlot } from '../types/repair';

const SLOT_FILES: Record<RepairImageSlot, string> = {
  front: 'phone_front.jpg',
  back: 'phone_back.jpg',
  thumb: 'thumbnail.jpg',
  id1: 'identification_1.jpg',
  id2: 'identification_2.jpg',
};

function getRepairMediaDir(repairId: number): string {
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error('Document directory unavailable');
  return `${root}repair_media/${repairId}/`;
}

export function pathForSlot(repairId: number, slot: RepairImageSlot): string {
  return `${getRepairMediaDir(repairId)}${SLOT_FILES[slot]}`;
}

/** True if URI is already a persisted file in this app’s documents. */
export function isPersistedAppPath(uri: string): boolean {
  const root = FileSystem.documentDirectory;
  return !!root && uri.startsWith(root);
}

export function emptyImageState(): Record<RepairImageSlot, string> {
  return { front: '', back: '', thumb: '', id1: '', id2: '' };
}

export function repairToImageState(r: Repair): Record<RepairImageSlot, string> {
  return {
    front: r.imagePhoneFront,
    back: r.imagePhoneBack,
    thumb: r.imageThumbnail,
    id1: r.imageId1,
    id2: r.imageId2,
  };
}
