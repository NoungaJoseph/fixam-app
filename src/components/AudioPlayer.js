import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

// Global reference to ensure only one audio plays at a time
let activeSoundInstance = null;
let activeSetPlaybackState = null;

const formatTime = (millis) => {
  if (isNaN(millis) || millis < 0) return '0:00';
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function AudioPlayer({ uri, color = '#333' }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef(null);
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  // Unload sound when URI changes or component unmounts
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      if (activeSoundInstance === soundRef.current) {
        activeSoundInstance = null;
        activeSetPlaybackState = null;
      }
    };
  }, [uri]);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        if (soundRef.current) {
          soundRef.current.setPositionAsync(0).catch(() => {});
        }
      }
    } else if (status.error) {
      console.log('[AudioPlayer] playback error:', status.error);
    }
  };

  const loadSound = async () => {
    setLoading(true);
    try {
      // Configure audio session to enable playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldRouteThroughReceiverIOS: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
    } catch (error) {
      console.log('[AudioPlayer] Error loading sound:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = async () => {
    try {
      if (!soundRef.current) {
        await loadSound();
      }

      if (!soundRef.current) return;

      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        // Pause any other active audio player
        if (activeSoundInstance && activeSoundInstance !== soundRef.current) {
          await activeSoundInstance.pauseAsync().catch(() => {});
          if (activeSetPlaybackState) {
            activeSetPlaybackState(false);
          }
        }

        // Set this audio player as the active one
        activeSoundInstance = soundRef.current;
        activeSetPlaybackState = setIsPlaying;

        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('[AudioPlayer] Play/Pause Error:', error);
    }
  };

  const handleSeek = async (event) => {
    if (!soundRef.current || duration === 0 || progressBarWidth === 0) return;
    const clickX = event.nativeEvent.locationX;
    const seekPercentage = clickX / progressBarWidth;
    const seekPosition = seekPercentage * duration;
    
    try {
      await soundRef.current.setPositionAsync(seekPosition);
      setPosition(seekPosition);
    } catch (err) {
      console.log('[AudioPlayer] Seek Error:', err);
    }
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <MaterialCommunityIcons name={isPlaying ? 'pause' : 'play'} size={24} color={color} />
        )}
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        {/* Clickable Progress bar */}
        <TouchableOpacity
          style={styles.progressBarBg}
          onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
          onPress={handleSeek}
          activeOpacity={1}
        >
          <View style={[styles.progressBarFill, { width: `${progress * 100}%`, backgroundColor: color }]} />
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <Text style={[styles.timeText, { color }]}>{formatTime(position)}</Text>
          <Text style={[styles.timeText, { color }]}>
            {duration > 0 ? formatTime(duration) : '--:--'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 180,
    maxWidth: 240,
    gap: 10,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.8,
  },
});
