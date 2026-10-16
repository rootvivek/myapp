import React, { useEffect, useState, useMemo } from 'react';
import { Image, ImageProps } from 'react-native';
import { supabase } from '../lib/supabase';

const SIGNED_URL_TTL_MS = 15 * 60 * 1000;
// Refresh a little before expiry so an image never renders an expired URL.
const CACHE_SAFETY_MS = 60 * 1000;

type SignedUrlCacheEntry = { url: string; expiresAt: number };

// Module-level cache: without it every mounted thumbnail signs the same object
// again (a network round trip per image per mount).
const signedUrlCache = new Map<string, SignedUrlCacheEntry>();

/** Invalidate cached signed URL(s) when images are updated or re-uploaded. */
export function invalidateSignedUrlCache(imageUrl?: string) {
  if (imageUrl) {
    signedUrlCache.delete(imageUrl);
  } else {
    signedUrlCache.clear();
  }
}

/** Extract the storage object path from a Supabase storage URL. */
function extractRepairImagePath(imageUrl: string): string {
  if (imageUrl.includes('/repair-images/')) {
    const start = imageUrl.indexOf('/repair-images/') + '/repair-images/'.length;
    return decodeURIComponent(imageUrl.substring(start).split('?')[0]);
  }
  return decodeURIComponent(imageUrl);
}

export function useSecureImage(imageUrl: string | null | undefined) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setSignedUrl(null);
      return;
    }

    // Pass through local camera roll files, assets, or non-http paths immediately
    if (!imageUrl.startsWith('http') || imageUrl.includes('file://') || imageUrl.includes('content://')) {
      setSignedUrl(imageUrl);
      return;
    }

    // If it's a Supabase storage URL or path for our private bucket
    const isSupabaseRepairImage =
      imageUrl.includes('/repair-images/') ||
      imageUrl.includes('/storage/v1/object/public/repair-images/') ||
      imageUrl.includes('/storage/v1/object/authenticated/repair-images/') ||
      imageUrl.includes('/storage/v1/object/sign/repair-images/');

    if (isSupabaseRepairImage) {
      const cached = signedUrlCache.get(imageUrl);
      if (cached && cached.expiresAt - Date.now() > CACHE_SAFETY_MS) {
        setSignedUrl(cached.url);
        return;
      }

      let isMounted = true;
      setLoading(true);

      const getSignedUrl = async () => {
        try {
          const path = extractRepairImagePath(imageUrl);

          if (!supabase) {
            if (isMounted) setSignedUrl(imageUrl);
            return;
          }

          const { data, error } = await supabase.storage
            .from('repair-images')
            .createSignedUrl(path, 15 * 60); // 15 minutes expiry

          if (error) throw error;
          if (data?.signedUrl) {
            signedUrlCache.set(imageUrl, {
              url: data.signedUrl,
              expiresAt: Date.now() + SIGNED_URL_TTL_MS,
            });
            if (isMounted) setSignedUrl(data.signedUrl);
          }
        } catch (err) {
          // Failed to sign URL, falling back to original
          if (isMounted) setSignedUrl(imageUrl);
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      void getSignedUrl();
      return () => {
        isMounted = false;
      };
    } else {
      setSignedUrl(imageUrl);
    }
  }, [imageUrl]);

  return { signedUrl, loading };
}

export function SecureImage({ source, ...props }: ImageProps) {
  const uri = useMemo(() => {
    if (source && typeof source === 'object' && 'uri' in source) {
      return source.uri;
    }
    return null;
  }, [source]);

  const { signedUrl } = useSecureImage(uri);

  const resolvedSource = useMemo(() => {
    if (!source) return source;
    if (typeof source === 'object' && 'uri' in source) {
      const finalUri = signedUrl || uri;
      if (!finalUri) return source;
      return { ...source, uri: finalUri };
    }
    return source;
  }, [source, signedUrl, uri]);

  return (
    <Image
      {...props}
      source={resolvedSource!}
      fadeDuration={0}
      progressiveRenderingEnabled={true}
    />
  );
}
