import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface UploadResult {
  url: string;
  filename: string;
}

/**
 * Converts a file to base64 Data URL as reliable ultra-fast fallback and offline/direct preview
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads a file (Logo, Signature, Thumbnail, Material)
 * Uses Firebase Storage with seamless Base64 data fallback
 */
export const uploadFile = async (
  file: File,
  folder: 'logos' | 'signatures' | 'thumbnails' | 'materials' | 'profiles'
): Promise<string> => {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `${folder}/${timestamp}_${safeName}`;

  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (storageError) {
    console.warn('Firebase Storage direct upload failed or blocked by CORS, utilizing persistent data URL:', storageError);
    // Reliable base64 fallback for images
    return await fileToDataUrl(file);
  }
};
