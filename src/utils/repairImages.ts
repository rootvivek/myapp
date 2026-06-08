import type { Repair, RepairImageSlot } from '../types/repair';

export function emptyImageState(): Record<RepairImageSlot, string> {
  return { front: '', back: '', id1: '', id2: '' };
}

export function repairToImageState(r: Repair): Record<RepairImageSlot, string> {
  return {
    front: r.imagePhoneFront,
    back: r.imagePhoneBack,
    id1: r.imageId1,
    id2: r.imageId2,
  };
}
