import * as FileSystem from 'expo-file-system/legacy';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tyiecstaywsocmqsabhg.supabase.co';
const STORAGE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_STORAGE_KEY || '';
const BUCKET_NAME = 'IMAGES';

export type StorageFolder = 'users' | 'receipts' | 'kyc' | 'campaigns' | 'gallery' | 'communities';

/**
 * Uploads a local image (file:///...) directly to Supabase Storage bucket 'IMAGES'.
 * Returns the public HTTPS URL identical to the website format.
 */
export async function uploadImageToSupabase(
  localUri: string | null | undefined,
  folder: StorageFolder = 'users'
): Promise<string> {
  if (!localUri || typeof localUri !== 'string') {
    return '';
  }

  const trimmed = localUri.trim();
  // If already an HTTP(S) URL or base64 data URL, no need to re-upload
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  try {
    // Determine file extension and MIME type
    const cleanPath = trimmed.split('?')[0];
    const extMatch = cleanPath.match(/\.([a-zA-Z0-9]+)$/);
    let ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    if (ext === 'jpeg') ext = 'jpg';

    let mimeType = 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    else if (ext === 'webp') mimeType = 'image/webp';
    else if (ext === 'pdf') mimeType = 'application/pdf';

    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${filename}`;

    const headers: Record<string, string> = {
      apikey: STORAGE_KEY,
      Authorization: `Bearer ${STORAGE_KEY}`,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    };

    // Primary: Native binary upload using Expo FileSystem
    const result = await FileSystem.uploadAsync(uploadUrl, trimmed, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers,
    });

    if (result.status === 200 || result.status === 201) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filename}`;
      return publicUrl;
    }

    console.warn(`[Storage] Binary upload returned status ${result.status}: ${result.body}`);

    // Fallback: Read as base64 and upload via REST
    const base64Data = await FileSystem.readAsStringAsync(trimmed, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 string to Uint8Array for raw upload
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const fallbackRes = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: byteNumbers,
    });

    if (fallbackRes.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filename}`;
    }

    console.error('[Storage] Fallback upload failed with status:', fallbackRes.status);
    return trimmed;
  } catch (err: any) {
    console.error('[Storage] Upload exception for URI:', localUri, err?.message || err);
    return trimmed;
  }
}

/**
 * Upload multiple local URIs concurrently.
 */
export async function uploadMultipleImagesToSupabase(
  uris: string[],
  folder: StorageFolder = 'campaigns'
): Promise<string[]> {
  if (!Array.isArray(uris) || uris.length === 0) return [];
  return Promise.all(uris.map((u) => uploadImageToSupabase(u, folder)));
}
