/**
 * Safe clipboard helper for Web and React Native.
 * Uses navigator.clipboard when available (web) without attempting
 * to load missing native modules that cause errors in development builds.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
