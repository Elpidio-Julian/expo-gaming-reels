import { Image, StyleSheet, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <IconSymbol 
          name="play.circle.fill" 
          size={120} 
          color="#ffffff" 
          style={styles.appLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome{user?.displayName ? `, ${user.displayName}` : ''}!</ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">About Video Processing App</ThemedText>
        <ThemedText>
          Transform and enhance your videos with our powerful AI-driven processing tools. Upload, process, and share your creative content all in one place.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.featureContainer}>
        <ThemedText type="subtitle">Key Features</ThemedText>
        
        <ThemedView style={styles.feature}>
          <IconSymbol name="arrow.up.circle.fill" size={24} color="#A1CEDC" />
          <ThemedText type="defaultSemiBold">Upload Videos</ThemedText>
          <ThemedText>
            Easily upload your videos from your device in the Upload tab.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.feature}>
          <IconSymbol name="wand.and.stars" size={24} color="#A1CEDC" />
          <ThemedText type="defaultSemiBold">Process with AI</ThemedText>
          <ThemedText>
            Apply AI-powered processing to your videos with custom instructions or use our default processing.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.feature}>
          <IconSymbol name="person.crop.circle" size={24} color="#A1CEDC" />
          <ThemedText type="defaultSemiBold">Manage Your Content</ThemedText>
          <ThemedText>
            View and manage your videos in the Profile tab. Toggle between original and processed versions.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.feature}>
          <IconSymbol name="safari" size={24} color="#A1CEDC" />
          <ThemedText type="defaultSemiBold">Explore</ThemedText>
          <ThemedText>
            Discover processed videos from the community in a TikTok-style feed in the Explore tab.
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.getStartedContainer}>
        <ThemedText type="subtitle">Get Started</ThemedText>
        <ThemedText>
          Head to the Upload tab to start processing your first video, or check out the Explore tab to see what others have created!
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionContainer: {
    gap: 12,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff10',
  },
  featureContainer: {
    gap: 16,
    marginBottom: 24,
  },
  feature: {
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff10',
  },
  getStartedContainer: {
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff10',
    marginBottom: 24,
  },
  appLogo: {
    height: 120,
    width: 120,
    bottom: 20,
    alignSelf: 'center',
    position: 'absolute',
  },
});
