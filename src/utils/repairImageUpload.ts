import { supabase } from '../lib/supabase';
import type { Repair, RepairImageSlot } from '../types/repair';
import { optimizeRepairImageForUpload } from './optimizeRepairImage';

const SLOT_FILE: Record<RepairImageSlot, string> = {
  front: 'front.jpg',
  back: 'back.jpg',
  id1: 'id1.jpg',
  id2: 'id2.jpg',
};

const BUCKET = 'repair-images';

function storageObjectPath(userId: string, repairId: number, slot: RepairImageSlot): string {
  return `${userId}/${repairId}/${SLOT_FILE[slot]}`;
}

function rethrowStorageError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('Bucket not found')) {
    throw new Error(
      `Storage bucket "${BUCKET}" is missing. In Supabase: SQL Editor → run supabase/schema.sql (bucket insert), or Storage → New bucket → name ${BUCKET}, Public.`
    );
  }
  throw err;
}

async function readUriAsBytes(uri: string): Promise<{ bytes: Uint8Array; contentType: string }> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buf = await res.arrayBuffer();
  const ct = res.headers.get('content-type') ?? 'image/jpeg';
  return { bytes: new Uint8Array(buf), contentType: ct.startsWith('image/') ? ct : 'image/jpeg' };
}

async function uploadSlot(userId: string, repairId: number, slot: RepairImageSlot, uri: string): Promise<string> {
  const path = storageObjectPath(userId, repairId, slot);
  const optimizedUri = await optimizeRepairImageForUpload(uri, slot);
  const { bytes } = await readUriAsBytes(optimizedUri);
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: true,
  });
  if (error) rethrowStorageError(error);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function removeSlot(userId: string, repairId: number, slot: RepairImageSlot): Promise<void> {
  const path = storageObjectPath(userId, repairId, slot);
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) rethrowStorageError(error);
}

/** Remove all images for a repair from Supabase Storage (used when deleting a repair). */
export async function removeAllRepairImages(userId: string, repairId: number): Promise<void> {
  const files = ['front.jpg', 'back.jpg', 'thumb.jpg', 'id1.jpg', 'id2.jpg'];
  const paths = files.map((file) => `${userId}/${repairId}/${file}`);
  try {
    await supabase.storage.from(BUCKET).remove(paths);
  } catch {
    // ignore unlinking errors for missing objects
  }
}

/** Sync local / remote image picks to Supabase Storage; returns HTTPS URLs for the repair row. */
export async function resolveImagesForSaveCloud(
  repairId: number,
  current: Record<RepairImageSlot, string>,
  initial: Record<RepairImageSlot, string>
): Promise<Pick<Repair, 'imagePhoneFront' | 'imagePhoneBack' | 'imageThumbnail' | 'imageId1' | 'imageId2'>> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const uid = user.id;
  const slots: RepairImageSlot[] = ['front', 'back', 'id1', 'id2'];
  const out: Record<RepairImageSlot, string> = {
    front: '',
    back: '',
    id1: '',
    id2: '',
  };

  for (const slot of slots) {
    const cur = current[slot]?.trim() ?? '';
    const prev = initial[slot]?.trim() ?? '';

    if (!cur) {
      if (prev) await removeSlot(uid, repairId, slot).catch(() => {});
      out[slot] = '';
      continue;
    }

    if (cur === prev) {
      out[slot] = cur;
      continue;
    }

    if (cur.startsWith('http')) {
      out[slot] = cur;
      continue;
    }

    out[slot] = await uploadSlot(uid, repairId, slot, cur);
  }

  return {
    imagePhoneFront: out.front,
    imagePhoneBack: out.back,
    imageThumbnail: out.front,
    imageId1: out.id1,
    imageId2: out.id2,
  };
}
