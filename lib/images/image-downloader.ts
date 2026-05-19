import { supabaseAdmin } from '@/lib/supabase/client';

const BUCKET_NAME = 'lead-images';

/**
 * Downloads images from remote URLs and uploads them to Supabase Storage.
 * Returns the list of storage paths that were successfully saved.
 */
export async function downloadAndStoreImages(
  leadId: string,
  imageUrls: string[]
): Promise<string[]> {
  if (!imageUrls || imageUrls.length === 0) return [];

  const storedPaths: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      // Fetch the image
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        console.warn(`Skipping image ${i + 1}: HTTP ${response.status}`);
        continue;
      }

      const contentType = response.headers.get('content-type') ?? 'image/jpeg';
      const buffer = await response.arrayBuffer();

      if (buffer.byteLength === 0) {
        console.warn(`Skipping image ${i + 1}: empty body`);
        continue;
      }

      // Build a safe storage path
      const ext = contentType.includes('png')
        ? 'png'
        : contentType.includes('webp')
        ? 'webp'
        : 'jpg';
      const path = `${leadId}/image_${i + 1}.${ext}`;

      const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(path, buffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        console.error(`Failed to upload image ${i + 1} for lead ${leadId}:`, error.message);
        continue;
      }

      storedPaths.push(path);
    } catch (err) {
      console.error(`Error processing image ${i + 1} for lead ${leadId}:`, err);
    }
  }

  return storedPaths;
}

/**
 * Returns a signed URL (valid 1 hour) for a storage path, or null on failure.
 */
export async function getSignedImageUrl(path: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 3600);

  if (error || !data) return null;
  return data.signedUrl;
}
