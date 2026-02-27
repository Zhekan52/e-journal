import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
export const storage = getStorage(app);

/**
 * Загружает файл в Firebase Storage и возвращает постоянный URL для скачивания
 */
export async function uploadHomeworkFile(file: File): Promise<{ name: string; url: string }> {
  const storageRef = ref(storage, `homework/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return { name: file.name, url: downloadURL };
}
