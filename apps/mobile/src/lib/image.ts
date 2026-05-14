import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

const attachmentsBucket = 'service-attachments';

const extractStoragePath = (value: string): string | null => {
  if (!value) {
    return null;
  }

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return value;
  }

  try {
    const parsed = new URL(value);
    const publicMarker = `/storage/v1/object/public/${attachmentsBucket}/`;
    const signedMarker = `/storage/v1/object/sign/${attachmentsBucket}/`;

    if (parsed.pathname.includes(publicMarker)) {
      return parsed.pathname.split(publicMarker)[1] || null;
    }

    if (parsed.pathname.includes(signedMarker)) {
      return parsed.pathname.split(signedMarker)[1] || null;
    }

    return null;
  } catch {
    return null;
  }
};

export const pickImageAsync = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error('Photo library permission is required to attach receipts.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
};

export const uploadReceipt = async (userId: string, localUri: string) => {
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const filePath = `${userId}/${fileName}`;

  const response = await fetch(localUri);
  const arrayBuffer = await response.arrayBuffer();

  const { error } = await supabase.storage.from(attachmentsBucket).upload(filePath, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return filePath;
};

export const resolveReceiptUrl = async (
  receiptRef: string | null | undefined,
  expiresInSeconds = 3600,
): Promise<string | null> => {
  if (!receiptRef) {
    return null;
  }

  const path = extractStoragePath(receiptRef);
  if (!path) {
    return receiptRef;
  }

  const { data, error } = await supabase.storage
    .from(attachmentsBucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw error;
  }

  return data.signedUrl;
};
