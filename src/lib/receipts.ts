import { supabase } from '@/lib/supabase';

export const RECEIPTS_BUCKET = 'receipts';
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
export const RECEIPT_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

export function isInlineReceipt(url?: string | null): boolean {
  if (!url) return false;
  return url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://');
}

export function isStoredReceiptPath(url?: string | null): boolean {
  if (!url) return false;
  return !isInlineReceipt(url);
}

export async function uploadReceiptFile(
  file: File,
  userId: string,
  storagePath: string
): Promise<string> {
  if (file.size > RECEIPT_MAX_BYTES) {
    throw new Error('Receipt must be smaller than 5MB');
  }
  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(storagePath, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return storagePath;
}

export async function fileToDataUrl(file: File): Promise<string> {
  if (file.size > RECEIPT_MAX_BYTES) {
    throw new Error('Receipt must be smaller than 5MB');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read receipt file'));
    reader.readAsDataURL(file);
  });
}

export async function resolveReceiptForSave(
  file: File | null | undefined,
  existingUrl: string | undefined,
  options: { userId: string | null; storagePath: string }
): Promise<string | undefined> {
  if (!file) return existingUrl;
  if (!options.userId) {
    return fileToDataUrl(file);
  }
  return uploadReceiptFile(file, options.userId, options.storagePath);
}

export async function getReceiptDisplayUrl(stored: string | undefined | null): Promise<string | null> {
  if (!stored) return null;
  if (isInlineReceipt(stored)) return stored;
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(stored, 3600);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export function receiptStoragePath(
  userId: string,
  kind: 'transactions' | 'settlements' | 'settlement-payments',
  entityId: string,
  fileName: string
): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'bin';
  return `${userId}/${kind}/${entityId}.${ext}`;
}
