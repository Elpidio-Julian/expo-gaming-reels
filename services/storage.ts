import { storage } from '@/firebaseConfig';
import { ref, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';

// Create a storage reference for videos
const videosRef = ref(storage, 'videos');
const db = getFirestore();

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

    // Generate a more explicit videoId
    const timestamp = new Date().getTime();
    const videoId = `${user.uid}_${timestamp}_${filename.split('.')[0]}`;
    const storageFilename = `${videoId}${filename.substring(filename.lastIndexOf('.'))}`;

    // Create the upload URL with the correct path
    const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/videos%2F${encodeURIComponent(storageFilename)}`;

    // Debug information
    console.log('Debug - Upload URL:', uploadUrl);
    console.log('Debug - Storage Bucket:', storage.app.options.storageBucket);
    console.log('Debug - Token (first 10 chars):', token.substring(0, 10) + '...');
    console.log('Debug - Content Type:', mimeType);
    console.log('Debug - VideoId:', videoId);
    console.log('Debug - Storage Filename:', storageFilename);
    console.log('Debug - File size:', fileInfo.size);

    // Create upload task
    const uploadTask = FileSystem.createUploadTask(
      uploadUrl,
      fileUri,
      {
        headers: {
          'Content-Type': mimeType,
          'Authorization': `Bearer ${token}`,
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        sessionType: FileSystem.FileSystemSessionType.BACKGROUND,
        httpMethod: 'POST',
        fieldName: 'file',
      },
      (progress) => {
        const percentProgress = (progress.totalBytesSent / progress.totalBytesExpectedToSend) * 100;
        console.log(`Upload progress: ${percentProgress.toFixed(2)}% (${progress.totalBytesSent}/${progress.totalBytesExpectedToSend} bytes)`);
        callbacks?.onProgress?.(percentProgress);
      }
    );

    console.log('Starting upload...');
    const uploadResult = await uploadTask.uploadAsync();

    if (!uploadResult) {
      throw new Error('Upload failed - no response received');
    }

    console.log('Upload response:', uploadResult);
    console.log('Debug - Response body:', uploadResult.body);
    console.log('Debug - Response status:', uploadResult.status);
    console.log('Debug - Response headers:', JSON.stringify(uploadResult.headers, null, 2));

    if (uploadResult.status >= 400) {
      throw new Error(`Upload failed with status ${uploadResult.status}: ${uploadResult.body}`);
    }

    // Get the download URL using Firebase SDK
    const videoRef = ref(videosRef, storageFilename);
    const downloadURL = await getDownloadURL(videoRef);
    
    // Create video document in Firestore
    await setDoc(doc(db, 'videos', videoId), {
      videoId,
      userId: user.uid,
      originalUrl: downloadURL,
      status: 'uploaded',
      createdAt: Timestamp.now(),
      filename: storageFilename
    });
    
    console.log('File available at', downloadURL);
    callbacks?.onComplete?.(downloadURL);
    return downloadURL;

  } catch (error) {
    console.error('Error during upload:', error);
    callbacks?.onError?.(error as Error);
    throw error;
  }
};

export const getVideoDownloadURL = async (videoId: string): Promise<string> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  const videoRef = ref(videosRef, videoId);
  return await getDownloadURL(videoRef);
}; 

