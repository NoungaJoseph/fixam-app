import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, TouchableOpacity, Vibration } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useSocket } from '../../context/SocketContext';
import UserAvatar from '../../components/UserAvatar';
import { getMediaUrl } from '../../services/api';

const IncomingCallScreen = ({ route, navigation }) => {
  const { callId, caller, callType = 'AUDIO' } = route.params || {};
  const { emit, on } = useSocket();
  const soundRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const stopRinging = async () => {
    Vibration.cancel();
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
  };

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    let hapticInterval;
    let mounted = true;

    const playRingtone = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/ringtone.wav'),
          { isLooping: true, volume: 1.0, shouldPlay: true }
        );

        if (!mounted) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        Vibration.vibrate([0, 900, 500, 900], true);
        hapticInterval = setInterval(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        }, 1200);
      } catch (error) {
        console.warn('[Call] Failed to play ringtone:', error);
        Vibration.vibrate([0, 900, 500, 900], true);
      }
    };

    playRingtone();

    return () => {
      mounted = false;
      if (hapticInterval) clearInterval(hapticInterval);
      stopRinging();
    };
  }, []);

  useEffect(() => {
    const offEnded = on('call:ended', (data) => {
      if (data.callId === callId) {
        stopRinging().finally(() => navigation.goBack());
      }
    });

    return () => offEnded?.();
  }, [callId, navigation, on]);

  const handleAccept = () => {
    stopRinging();
    emit('call:accept', { callId });
    navigation.replace('Call', {
      callId,
      otherUser: caller,
      isOutgoing: false,
      callType,
    });
  };

  const handleDecline = () => {
    stopRinging();
    emit('call:reject', { callId });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
        <UserAvatar
          uri={getMediaUrl(caller?.avatar)}
          name={caller?.name || 'Fixam User'}
          size={140}
          style={styles.avatar}
        />
        <Text style={styles.nameText}>{caller?.name || 'Fixam User'}</Text>
        <Text style={styles.statusText}>Incoming {callType === 'VIDEO' ? 'Video' : 'Audio'} Call</Text>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={handleDecline}>
          <MaterialCommunityIcons name="phone-hangup" size={36} color="#FFF" />
          <Text style={styles.btnText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAccept}>
          <MaterialCommunityIcons name="phone" size={36} color="#FFF" />
          <Text style={styles.btnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', justifyContent: 'space-between', paddingVertical: 80 },
  topSection: { alignItems: 'center', marginTop: 80 },
  pulseRing: {
    position: 'absolute',
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(20,184,166,0.2)',
    top: -18,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  nameText: { color: '#FFF', fontSize: 30, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  statusText: { color: 'rgba(255,255,255,0.75)', fontSize: 18, fontWeight: '600' },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 42,
    marginBottom: 42,
  },
  actionBtn: { alignItems: 'center', justifyContent: 'center' },
  declineBtn: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#EF4444', marginBottom: 10 },
  acceptBtn: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#10B981', marginBottom: 10 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginTop: 8 },
});

export default IncomingCallScreen;
