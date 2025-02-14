import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button, Pressable, Image, Dimensions, TextInput, Modal, Alert } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { updateProfile, signOut, getIdToken } from 'firebase/auth';
import { router } from 'expo-router';
import Constants from 'expo-constants';

interface VideoItem {
  id: string;
  title?: string;
  originalUrl: string;
  timestamp?: any;
  status: string;
  videoId: string;
  userId: string;
  filename: string;
  createdAt: any;
}

type ColorScheme = 'light' | 'dark';

const VideoPlayer = ({ item, colorScheme, onClose }: { 
  item: VideoItem; 
  colorScheme: ColorScheme;
  onClose: () => void;
}) => {
  const videoSource = item.originalUrl;
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  console.log('Video source:', videoSource);

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  const handleDefaultProcessing = async () => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      const idToken = await getIdToken(user);
      const apiUrl = process.env.EXPO_PUBLIC_FASTAPI_URL;
      
      console.log('Attempting to connect to:', `${apiUrl}/api/v1/videos/process`);
      console.log('With token:', idToken.substring(0, 10) + '...');
      
      const response = await fetch(`${apiUrl}/api/v1/videos/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          videoUrl: item.originalUrl,
          videoId: item.videoId,
          userId: user.uid
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Processing request sent successfully:', result);
      Alert.alert('Success', 'Video has been sent for processing');
      
    } catch (error) {
      console.error('Error sending processing request:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        Alert.alert('Error', `Failed to send video for processing: ${error.message}`);
      } else {
        Alert.alert('Error', 'Failed to send video for processing');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomProcessing = async (prompt: string) => {
    if (!user) return;
    
    try {
      setIsProcessing(true);
      const idToken = await getIdToken(user);
      const apiUrl = process.env.EXPO_PUBLIC_FASTAPI_URL;
      
      console.log('Attempting to connect to:', `${apiUrl}/api/v1/videos/process`);
      console.log('With token:', idToken.substring(0, 10) + '...');

      const response = await fetch(`${apiUrl}/api/v1/videos/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          videoUrl: item.originalUrl,
          videoId: item.videoId,
          userId: user.uid,
          prompt
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Custom processing request sent successfully:', result);
      Alert.alert('Success', 'Video has been sent for processing with custom instructions');
      
    } catch (error) {
      console.error('Error sending custom processing request:', error);
      Alert.alert('Error', 'Failed to send video for custom processing');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.videoPlayerOverlay}>
      <View style={styles.videoPlayerContainer}>
        <View style={styles.videoPlayerHeader}>
          <Text style={[styles.videoTitle, { color: Colors[colorScheme].text }]}>
            {item.filename}
          </Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="xmark.circle.fill" size={24} color={Colors[colorScheme].text} />
          </Pressable>
        </View>
        <VideoView
          player={player}
          style={styles.videoPlayer}
          nativeControls
          contentFit="contain"
          allowsFullscreen
          allowsPictureInPicture
        />
        <View style={styles.videoControls}>
          <Button
            title={isPlaying ? 'Pause' : 'Play'}
            onPress={() => {
              if (isPlaying) {
                player.pause();
              } else {
                player.play();
              }
            }}
          />
          <View style={styles.processingControls}>
            <Pressable
              style={[
                styles.actionButton,
                { 
                  backgroundColor: Colors[colorScheme].tint,
                  opacity: isProcessing ? 0.5 : 1 
                }
              ]}
              onPress={handleDefaultProcessing}
              disabled={isProcessing}
            >
              <Text style={styles.actionButtonText}>
                {isProcessing ? 'Processing...' : 'Process'}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionButton,
                { 
                  backgroundColor: Colors[colorScheme].tint,
                  opacity: isProcessing ? 0.5 : 1 
                }
              ]}
              onPress={() => setShowProcessingModal(true)}
              disabled={isProcessing}
            >
              <Text style={styles.actionButtonText}>
                {isProcessing ? 'Processing...' : 'Custom Process'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
      <VideoProcessingModal
        isVisible={showProcessingModal}
        onClose={() => setShowProcessingModal(false)}
        onSubmit={handleCustomProcessing}
        colorScheme={colorScheme}
      />
    </View>
  );
};

interface VideoProcessingModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  colorScheme: ColorScheme;
}

const VideoProcessingModal = ({ isVisible, onClose, onSubmit, colorScheme }: VideoProcessingModalProps) => {
  const [prompt, setPrompt] = useState('');

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme].background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
              Enter Processing Instructions
            </Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={24} color={Colors[colorScheme].text} />
            </Pressable>
          </View>
          <TextInput
            style={[
              styles.promptInput,
              {
                color: Colors[colorScheme].text,
                borderColor: Colors[colorScheme].border,
                backgroundColor: Colors[colorScheme].background
              }
            ]}
            placeholder="Enter your instructions for the video processing agent..."
            placeholderTextColor={Colors[colorScheme].tabIconDefault}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
          />
          <View style={styles.modalActions}>
            <Button title="Cancel" onPress={onClose} />
            <Button
              title="Submit"
              onPress={() => {
                onSubmit(prompt);
                setPrompt('');
                onClose();
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const VideoThumbnail = ({ item, onSelect, colorScheme }: { 
  item: VideoItem; 
  onSelect: () => void;
  colorScheme: ColorScheme;
}) => {
  return (
    <View style={styles.thumbnailContainer}>
      <Pressable onPress={onSelect} style={styles.thumbnail}>
        <IconSymbol name="play.circle.fill" size={32} color={Colors[colorScheme].text} />
      </Pressable>
      <Text 
        numberOfLines={1} 
        style={[styles.thumbnailTitle, { color: Colors[colorScheme].text }]}
      >
        {item.filename}
      </Text>
    </View>
  );
};

export default function ProfileScreen() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const { user } = useAuth();
  const colorScheme = useColorScheme() as ColorScheme;

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  useEffect(() => {
    const fetchUserVideos = async () => {
      if (!user) return;

      try {
        const videosRef = collection(db, 'videos');
        const q = query(videosRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const userVideos: VideoItem[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Raw Firestore doc data:', data); // More detailed logging
          console.log('Video URL from doc:', data.originalUrl); // Specifically log the URL
          userVideos.push({
            id: doc.id,
            ...data,
          } as VideoItem);
        });

        console.log('Final processed videos:', userVideos); // Log the final array
        userVideos.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
        setVideos(userVideos);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserVideos();
  }, [user]);

  const handleUpdateDisplayName = async () => {
    if (!user) return;
    
    try {
      setUpdateError(null);
      await updateProfile(user, { displayName });
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating display name:', error);
      setUpdateError('Failed to update display name');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const renderVideoThumbnail = ({ item }: { item: VideoItem }) => (
    <VideoThumbnail
      item={item}
      onSelect={() => setSelectedVideo(item)}
      colorScheme={colorScheme}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: Colors[colorScheme].text }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <IconSymbol 
              name="person.crop.circle.fill" 
              size={80} 
              color={Colors[colorScheme].text} 
            />
          </View>
          
          <View style={styles.nameSection}>
            {isEditingName ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={[styles.nameInput, { 
                    color: Colors[colorScheme].text,
                    borderColor: Colors[colorScheme].border 
                  }]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter display name"
                  placeholderTextColor={Colors[colorScheme].tabIconDefault}
                  autoFocus
                />
                <View style={styles.editNameButtons}>
                  <Button 
                    title="Save" 
                    onPress={handleUpdateDisplayName} 
                  />
                  <Button 
                    title="Cancel" 
                    onPress={() => {
                      setIsEditingName(false);
                      setDisplayName(user?.displayName || '');
                    }} 
                  />
                </View>
              </View>
            ) : (
              <Pressable 
                style={styles.displayNameContainer} 
                onPress={() => setIsEditingName(true)}
              >
                <Text style={[styles.displayName, { color: Colors[colorScheme].text }]}>
                  {user?.displayName || 'Set display name'}
                </Text>
                <IconSymbol 
                  name="pencil.circle.fill" 
                  size={24} 
                  color={Colors[colorScheme].text} 
                />
              </Pressable>
            )}
            
            {updateError && (
              <Text style={[styles.errorText, { color: Colors[colorScheme].error }]}>
                {updateError}
              </Text>
            )}
            
            <Text style={[styles.email, { color: Colors[colorScheme].tabIconDefault }]}>
              {user?.email}
            </Text>
          </View>
        </View>

        <View style={styles.profileActions}>
          <Button 
            title="Sign Out" 
            onPress={handleSignOut}
          />
        </View>
      </View>
      
      <View style={styles.videosSection}>
        <Text style={[styles.subheader, { color: Colors[colorScheme].text }]}>
          My Videos ({videos.length})
        </Text>
        <FlatList
          data={videos}
          renderItem={renderVideoThumbnail}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContainer}
        />
      </View>

      {selectedVideo && (
        <VideoPlayer
          item={selectedVideo}
          colorScheme={colorScheme}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </View>
  );
}

const { width } = Dimensions.get('window');
const THUMBNAIL_SPACING = 12;
const THUMBNAIL_WIDTH = (width - (THUMBNAIL_SPACING * 3)) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  profileSection: {
    padding: 16,
    flex: 1,
  },
  videosSection: {
    flex: 2,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subheader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  gridContainer: {
    paddingHorizontal: THUMBNAIL_SPACING / 2,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: THUMBNAIL_SPACING,
  },
  thumbnailContainer: {
    width: THUMBNAIL_WIDTH,
    marginHorizontal: THUMBNAIL_SPACING / 2,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16/9,
    backgroundColor: '#ffffff10',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailTitle: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  videoPlayerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 16,
  },
  videoPlayerContainer: {
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  videoPlayer: {
    width: '100%',
    aspectRatio: 16/9,
  },
  videoControls: {
    padding: 12,
    gap: 12,
  },
  closeButton: {
    padding: 4,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginRight: 16,
  },
  nameSection: {
    flex: 1,
  },
  displayNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 8,
  },
  email: {
    fontSize: 16,
  },
  editNameContainer: {
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  editNameButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  profileActions: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  promptInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  processingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 