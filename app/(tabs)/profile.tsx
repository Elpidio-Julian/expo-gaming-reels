import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

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

const VideoItemComponent = ({ item, colorScheme }: { item: VideoItem; colorScheme: ColorScheme }) => {
  // Add detailed logging
  console.log('VideoItemComponent - Full item:', item);
  console.log('VideoItemComponent - URL:', item.originalUrl);
  
  // Create a video source from the URL
  const videoSource = item.originalUrl;
  console.log('Video source:', videoSource); // Debug log

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  return (
    <View style={styles.videoContainer}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
        allowsFullscreen
        allowsPictureInPicture
      />
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: Colors[colorScheme].text }]}>
          {item.title}
        </Text>
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
  );
};

export default function ProfileScreen() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
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

  const renderVideo = ({ item }: { item: VideoItem }) => (
    <VideoItemComponent item={item} colorScheme={colorScheme} />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: Colors[colorScheme].text }]}>Loading...</Text>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, { color: Colors[colorScheme].text }]}>
          No videos uploaded yet
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: Colors[colorScheme].text }]}>
        My Videos ({videos.length})
      </Text>
      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'transparent',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContainer: {
    gap: 16,
  },
  videoContainer: {
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  video: {
    width: '100%',
    height: 200,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '500',
    padding: 12,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
  videoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
}); 