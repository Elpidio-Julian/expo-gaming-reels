import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button, Pressable, Image, Dimensions } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol';

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
  console.log('Video source:', videoSource);

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

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
        </View>
      </View>
    </View>
  );
};

const VideoThumbnail = ({ item, onSelect, colorScheme }: { 
  item: VideoItem; 
  onSelect: () => void;
  colorScheme: ColorScheme;
}) => (
  <Pressable onPress={onSelect} style={styles.thumbnailContainer}>
    <View style={styles.thumbnail}>
      <IconSymbol name="play.circle.fill" size={32} color={Colors[colorScheme].text} />
    </View>
    <Text 
      numberOfLines={1} 
      style={[styles.thumbnailTitle, { color: Colors[colorScheme].text }]}
    >
      {item.filename}
    </Text>
  </Pressable>
);

export default function ProfileScreen() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const colorScheme = useColorScheme() as ColorScheme;

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
        <Text style={[styles.header, { color: Colors[colorScheme].text }]}>
          Profile Section
        </Text>
        {/* Add profile content here */}
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
    alignItems: 'center',
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
}); 