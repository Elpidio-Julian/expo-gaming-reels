import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as DocumentPicker from 'expo-document-picker';
import { uploadVideo } from '@/services/storage';
import * as FileSystem from 'expo-file-system';

export default function UploadScreen() {
  const colorScheme = useColorScheme();
  const [selectedVideo, setSelectedVideo] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const handleSelectVideo = async () => {
    try {
      setUploadError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      // Check if the file is a video
      const asset = result.assets[0];
      if (!asset.mimeType?.startsWith('video/')) {
        setUploadError('Please select a video file');
        return;
      }

      setSelectedVideo(result);
      console.log('Selected video:', asset.name);
      
      // Start upload automatically after selection
      await handleUpload(result);
    } catch (error) {
      console.error('Error picking video:', error);
      setUploadError('Error selecting video');
    }
  };

  const handleUpload = async (videoResult: DocumentPicker.DocumentPickerResult) => {
    const asset = videoResult?.assets?.[0];
    if (!asset?.uri || !asset.mimeType) {
      setUploadError('No video file selected');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Generate a unique filename
      const timestamp = new Date().getTime();
      const filename = `${timestamp}-${asset.name}`;

      // Upload the video
      await uploadVideo(
        asset.uri,
        filename,
        asset.mimeType,
        {
          onProgress: (progress) => {
            setUploadProgress(progress);
          },
          onComplete: (url) => {
            setUploadedUrl(url);
            setIsUploading(false);
            console.log('Upload complete:', url);
          },
          onError: (error) => {
            setUploadError(error.message);
            setIsUploading(false);
            console.error('Upload error:', error);
          },
        }
      );
    } catch (error) {
      console.error('Error uploading video:', error);
      setUploadError('Error uploading video');
      setIsUploading(false);
    }
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { color: Colors[colorScheme ?? 'light'].text }
        ]}>
          Upload Gaming Video
        </Text>
        <Text style={[
          styles.subtitle,
          { color: Colors[colorScheme ?? 'light'].tabIconDefault }
        ]}>
          Select a 16:9 video to convert to vertical format
        </Text>
        
        <Pressable
          onPress={handleSelectVideo}
          disabled={isUploading}
          style={({ pressed }) => [
            styles.uploadButton,
            {
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              borderColor: Colors[colorScheme ?? 'light'].border,
              opacity: (pressed || isUploading) ? 0.8 : 1
            }
          ]}
        >
          {isUploading ? (
            <>
              <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={[
                styles.buttonText,
                { color: Colors[colorScheme ?? 'light'].text }
              ]}>
                Uploading... {uploadProgress.toFixed(0)}%
              </Text>
            </>
          ) : (
            <>
              <IconSymbol 
                name={selectedVideo ? "checkmark.circle.fill" : "plus.circle.fill"}
                size={48} 
                color={Colors[colorScheme ?? 'light'].tint}
              />
              <Text style={[
                styles.buttonText,
                { color: Colors[colorScheme ?? 'light'].text }
              ]}>
                {selectedVideo ? 'Video Selected' : 'Select Video'}
              </Text>
            </>
          )}
          
          {uploadError ? (
            <Text style={[styles.errorText, { color: Colors[colorScheme ?? 'light'].error }]}>
              {uploadError}
            </Text>
          ) : selectedVideo?.assets?.[0]?.name ? (
            <Text style={[
              styles.supportText,
              { color: Colors[colorScheme ?? 'light'].tabIconDefault }
            ]}>
              {selectedVideo.assets[0].name}
            </Text>
          ) : (
            <Text style={[
              styles.supportText,
              { color: Colors[colorScheme ?? 'light'].tabIconDefault }
            ]}>
              Supports 720p or higher
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  uploadButton: {
    width: '100%',
    aspectRatio: 16/9,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  supportText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
  },
}); 