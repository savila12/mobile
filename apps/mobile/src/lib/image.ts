import * as ImagePicker from 'expo-image-picker';

import { supabase } from './supabase';

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

  const { error } = await supabase.storage.from('service-attachments').upload(filePath, arrayBuffer, {
    contentType: 'image/jpeg',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from('service-attachments').getPublicUrl(filePath);
  return data.publicUrl;
};
