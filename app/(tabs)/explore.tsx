import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, FlatList, Text, ViewToken } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEvent } from 'expo';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useFocusEffect } from 'expo-router';

interface ProcessedVideo {
  id: string;
  processedUrl: string;
  title?: string;
  userId: string;
  filename: string;
  createdAt: any;
}

const VideoItem = ({ item, isVisible, isFocused }: { 
  item: ProcessedVideo; 
  isVisible: boolean;
  isFocused: boolean;
}) => {
  const colorScheme = useColorScheme();
  const player = useVideoPlayer(item.processedUrl, player => {
    player.loop = true;
    if (isVisible && isFocused) {
      player.play();
    }
  });

  useEffect(() => {
    if (isVisible && isFocused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isVisible, isFocused, player]);

  return (
    <View style={styles.videoContainer}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          {item.filename}
        </Text>
      </View>
    </View>
  );
};

function ExploreScreen() {
  const [videos, setVideos] = useState<ProcessedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScreenFocused, setIsScreenFocused] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();

  useFocusEffect(
    React.useCallback(() => {
      setIsScreenFocused(true);
      return () => {
        setIsScreenFocused(false);
      };
    }, [])
  );

  useEffect(() => {
    const fetchProcessedVideos = async () => {
      try {
        const videosRef = collection(db, 'videos');
        const q = query(videosRef, where('processedUrl', '!=', null));
        const querySnapshot = await getDocs(q);
        
        const processedVideos: ProcessedVideo[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.processedUrl) {
            processedVideos.push({
              id: doc.id,
              processedUrl: data.processedUrl,
              title: data.title,
              userId: data.userId,
              filename: data.filename,
              createdAt: data.createdAt,
            });
          }
        });

        // Sort by most recent
        processedVideos.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setVideos(processedVideos);
      } catch (error) {
        console.error('Error fetching processed videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProcessedVideos();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  const renderItem = ({ item, index }: { item: ProcessedVideo; index: number }) => (
    <VideoItem 
      item={item} 
      isVisible={index === currentIndex} 
      isFocused={isScreenFocused}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
          Loading videos...
        </Text>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
          No processed videos available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        getItemLayout={(data, index) => ({
          length: Dimensions.get('window').height,
          offset: Dimensions.get('window').height * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    height: Dimensions.get('window').height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});


export default ExploreScreen;