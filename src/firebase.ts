import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const firebaseConfig = {
  apiKey: "AIzaSyDVRCxHtphiiu2wcuyn0R5VaWe3L5RJoHE",
  authDomain: "my-proekt-5b93e.firebaseapp.com",
  projectId: "my-proekt-5b93e",
  storageBucket: "my-proekt-5b93e.firebasestorage.app",
  messagingSenderId: "256313167879",
  appId: "1:256313167879:web:8e646f553adbd9cd671aa2",
  measurementId: "G-XQMCQEQYWH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Supabase
const supabaseUrl = 'https://fdianjqnmkskuzqlhevo.supabase.co';
const supabaseKey = 'sb_secret_ZlNmGRSLGFHRUG_0b815jw_KvpCJmWq';
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

/**
 * Загружает файл в Supabase Storage
 * Возвращает постоянный URL для скачивания
 */
export async function uploadHomeworkFile(file: File): Promise<{ name: string; url: string }> {
  const fileName = `${Date.now()}_${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('homework')
    .upload(fileName, file);

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Upload failed');
  }

  const { data: urlData } = supabase.storage
    .from('homework')
    .getPublicUrl(fileName);

  return { name: file.name, url: urlData.publicUrl };
}
