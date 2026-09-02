import React, { useEffect, useState, useMemo } from 'react';
import { Image, ImageProps } from 'react-native';
import { supabase } from '../lib/supabase';

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
      let isMounted = true;
      setLoading(true);

      const getSignedUrl = async () => {
        try {
          let path = '';
          if (imageUrl.includes('/repair-images/')) {
            const pathStart = imageUrl.indexOf('/repair-images/') + '/repair-images/'.length;
            path = decodeURIComponent(imageUrl.substring(pathStart).split('?')[0]);
          } else {
            path = decodeURIComponent(imageUrl);
          }
          
          if (!supabase) {
            if (isMounted) setSignedUrl(imageUrl);
            return;
          }

          const { data, error } = await supabase.storage
            .from('repair-images')
            .createSignedUrl(path, 15 * 60); // 15 minutes expiry
          
          if (error) throw error;
          if (isMounted && data?.signedUrl) {
            setSignedUrl(data.signedUrl);
          }
        } catch (err) {
          console.warn('[useSecureImage] error signing url:', err);
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
      if (!signedUrl) return null;
      return { ...source, uri: signedUrl };
    }
    return source;
  }, [source, signedUrl]);

  if (uri && !resolvedSource) {
    // Show static app logo fallback while fetching the signed URL
    return <Image {...props} source={require('../../assets/app-logo.jpg')} />;
  }

  return <Image {...props} source={resolvedSource!} />;
}
