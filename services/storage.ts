import { storage } from '@/firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import * as FileSystem from 'expo-file-system';

// Create a storage reference for videos
const videosRef = ref(storage, 'videos');

export interface UploadProgressCallback {
  onProgress?: (progress: number) => void;
  onComplete?: (url: string) => void;
  onError?: (error: Error) => void;
}

export const uploadVideo = async (
  fileUri: string,
  filename: string,
  mimeType: string,
  callbacks?: UploadProgressCallback
) => {
  try {
    console.log('File URI:', fileUri);
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    console.log('File exists check:', fileInfo);

    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }

    // Get the Firebase auth token
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    const token = await user.getIdToken();

    // Create the upload URL with the correct path
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/videos%2F${encodeURIComponent(filename)}`;

    // Debug information
    console.log('Debug - Upload URL:', uploadUrl);
    console.log('Debug - Storage Bucket:', storage.app.options.storageBucket);
    console.log('Debug - Token (first 10 chars):', token.substring(0, 10) + '...');
    console.log('Debug - Content Type:', mimeType);
    console.log('Debug - Filename:', filename);

    console.log('Starting upload...');
    const uploadResult = await FileSystem.uploadAsync(uploadUrl, fileUri, {
      headers: {
        'Content-Type': mimeType,
        'Authorization': `Bearer ${token}`,
      },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
      httpMethod: 'POST',
      fieldName: 'file',
    });

    console.log('Upload response:', uploadResult);
    console.log('Debug - Response body:', uploadResult.body);
    console.log('Debug - Response status:', uploadResult.status);
    console.log('Debug - Response headers:', JSON.stringify(uploadResult.headers, null, 2));

    if (uploadResult.status >= 400) {
      throw new Error(`Upload failed with status ${uploadResult.status}: ${uploadResult.body}`);
    }

    // Get the download URL using Firebase SDK
    const videoRef = ref(videosRef, filename);
    const downloadURL = await getDownloadURL(videoRef);
    
    console.log('File available at', downloadURL);
    callbacks?.onComplete?.(downloadURL);
    return downloadURL;

  } catch (error) {
    console.error('Error during upload:', error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

export const getVideoDownloadURL = async (filename: string): Promise<string> => {
  const videoRef = ref(videosRef, filename);
  return await getDownloadURL(videoRef);
}; 

