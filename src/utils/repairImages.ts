import type { Repair, RepairImageSlot } from '../types/repair';

export function pathForSlot(_repairId: number, _slot: RepairImageSlot): string {
  // No local file persistence — images live as URIs from picker or remote URLs
  return '';
}

/** True if URI is already a persisted file in this app's documents. */
export function isPersistedAppPath(_uri: string): boolean {
  return false;
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
