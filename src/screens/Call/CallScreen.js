import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, SafeAreaView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/UserAvatar';
import { getMediaUrl } from '../../services/api';
import { WebView } from 'react-native-webview';
import { Audio } from 'expo-av';

const CallScreen = ({ route, navigation }) => {
  const { callId: initialCallId, otherUser, isOutgoing, callType } = route.params || {};
  const { emit, on } = useSocket();
  const { user } = useAuth();
  
  const [callId, setCallId] = useState(initialCallId);
  const [status, setStatus] = useState(isOutgoing ? 'Calling...' : 'Connecting...');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [duration, setDuration] = useState(0);
  const [hasPermissions, setHasPermissions] = useState(false);
  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      try {
        const audioStatus = await Audio.requestPermissionsAsync();
        setHasPermissions(audioStatus.status === 'granted');
      } catch (e) {
        console.warn('Failed to get audio permissions', e);
      }
    })();
  }, []);

  useEffect(() => {
    // Pulse animation
    if (status === 'Calling...' || status === 'RINGING') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [status, pulseAnim]);

  useEffect(() => {
    const offInitiated = on('call:initiated', (data) => {
      setCallId(data.callId);
      setStatus(data.status);
    });

    const offAccepted = on('call:accepted', () => {
      setStatus('Connected');
      startTimer();
    });

    const offRejected = on('call:rejected', () => {
      setStatus('Call Declined');
      setTimeout(() => navigation.goBack(), 2000);
    });

    const offEnded = on('call:ended', () => {
      setStatus('Call Ended');
      stopTimer();
      setTimeout(() => navigation.goBack(), 2000);
    });

    return () => {
      offInitiated?.();
      offAccepted?.();
      offRejected?.();
      offEnded?.();
      stopTimer();
    };
  }, [on, navigation]);

  useEffect(() => {
    if (!isOutgoing && status === 'Connecting...') {
      setStatus('Connected');
      startTimer();
    }
  }, [isOutgoing, status]);

  const startTimer = () => {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleEndCall = () => {
    if (callId) {
      emit('call:end', { callId });
    }
    stopTimer();
    setStatus('Call Ended');
    setTimeout(() => navigation.goBack(), 1000);
  };

  if (status === 'Connected') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <WebView
            source={{ uri: 'https://whereby.com/fixam-demo' }}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            style={{ flex: 1 }}
          />
          <TouchableOpacity 
            style={styles.floatingEndBtn} 
            onPress={handleEndCall}
          >
            <MaterialCommunityIcons name="phone-hangup" size={32} color="#FFF" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
        <UserAvatar 
          uri={getMediaUrl(otherUser?.avatar)} 
          name={otherUser?.fullName || 'User'} 
          size={120} 
          style={styles.avatar} 
        />
        <Text style={styles.nameText}>{otherUser?.fullName || 'User'}</Text>
        <Text style={styles.statusText}>
          {status === 'Connected' ? formatDuration(duration) : status}
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity 
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]} 
          onPress={() => setIsMuted(!isMuted)}
        >
          <MaterialCommunityIcons 
            name={isMuted ? "microphone-off" : "microphone"} 
            size={28} 
            color="#FFF" 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.endCallBtn]} 
          onPress={handleEndCall}
        >
          <MaterialCommunityIcons name="phone-hangup" size={36} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]} 
          onPress={() => setIsSpeaker(!isSpeaker)}
        >
          <MaterialCommunityIcons 
            name={isSpeaker ? "volume-high" : "volume-medium"} 
            size={28} 
            color="#FFF" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 60,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nameText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  endCallBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingEndBtn: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 10,
  }
});

export default CallScreen;
