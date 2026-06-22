import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RTCView } from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import { useSocket } from '../../context/SocketContext';
import UserAvatar from '../../components/UserAvatar';
import { getMediaUrl } from '../../services/api';
import {
  attachLocalStream,
  createPeerConnection,
  getLocalStream,
  toIceCandidate,
  toSessionDescription,
} from '../../services/webrtc.service';

const getDisplayName = (person) => person?.fullName || person?.name || person?.phone || 'Fixam User';

const CallScreen = ({ route, navigation }) => {
  const { callId: initialCallId, otherUser = {}, isOutgoing = false, callType = 'AUDIO' } = route.params || {};
  const { emit, on } = useSocket();
  const [callId, setCallId] = useState(initialCallId || null);
  const [status, setStatus] = useState(isOutgoing ? 'Calling...' : 'Connecting...');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(callType === 'VIDEO');
  const [duration, setDuration] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [hasConnectedMedia, setHasConnectedMedia] = useState(false);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const callIdRef = useRef(initialCallId || null);
  const isMutedRef = useRef(false);
  const isSpeakerRef = useRef(callType === 'VIDEO');
  const timerRef = useRef(null);
  const hasStartedRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const targetUserId = otherUser?.id;
  const isVideoCall = callType === 'VIDEO';

  useEffect(() => {
    callIdRef.current = callId;
  }, [callId]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isSpeakerRef.current = isSpeaker;
  }, [isSpeaker]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (!timerRef.current) {
      timerRef.current = setInterval(() => setDuration((prev) => prev + 1), 1000);
    }
  }, []);

  const cleanupMedia = useCallback(() => {
    stopTimer();
    InCallManager.stop();
    pcRef.current?.close?.();
    pcRef.current = null;
    pendingCandidatesRef.current = [];
    localStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  }, [stopTimer]);

  const sendSignal = useCallback((signal) => {
    if (!targetUserId) return;
    emit('call:signal', {
      callId: callIdRef.current,
      targetUserId,
      signal,
    });
  }, [emit, targetUserId]);

  const flushPendingCandidates = useCallback(async (pc) => {
    while (pendingCandidatesRef.current.length) {
      const candidate = pendingCandidatesRef.current.shift();
      await pc.addIceCandidate(toIceCandidate(candidate));
    }
  }, []);

  const ensurePeerConnection = useCallback(async () => {
    if (pcRef.current) return pcRef.current;

    const pc = createPeerConnection(sendSignal, (stream) => {
      setRemoteStream(stream);
      setHasConnectedMedia(true);
      setStatus('Connected');
      startTimer();
    });
    pcRef.current = pc;

    const stream = await getLocalStream(isVideoCall);
    localStreamRef.current = stream;
    setLocalStream(stream);
    attachLocalStream(pc, stream);
    InCallManager.start({ media: isVideoCall ? 'video' : 'audio' });
    InCallManager.setSpeakerphoneOn(isSpeakerRef.current);
    InCallManager.setMicrophoneMute(isMutedRef.current);

    return pc;
  }, [isVideoCall, sendSignal, startTimer]);

  const startOutgoingMedia = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    try {
      setStatus('Connecting...');
      const pc = await ensurePeerConnection();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal({ type: 'offer', sdp: offer });
    } catch (error) {
      console.error('[Call] Failed to start outgoing media:', error);
      Alert.alert('Call failed', 'Could not start your microphone or camera.');
      cleanupMedia();
      navigation.goBack();
    }
  }, [cleanupMedia, ensurePeerConnection, navigation, sendSignal]);

  const handleSignal = useCallback(async ({ callId: signalCallId, signal }) => {
    if (!signal) return;
    if (signalCallId && callIdRef.current && signalCallId !== callIdRef.current) return;

    try {
      const pc = await ensurePeerConnection();

      if (signal.type === 'offer') {
        await pc.setRemoteDescription(toSessionDescription(signal.sdp));
        await flushPendingCandidates(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal({ type: 'answer', sdp: answer });
        setStatus('Connected');
        startTimer();
        return;
      }

      if (signal.type === 'answer') {
        await pc.setRemoteDescription(toSessionDescription(signal.sdp));
        await flushPendingCandidates(pc);
        setStatus('Connected');
        startTimer();
        return;
      }

      if (signal.type === 'ice-candidate' && signal.candidate) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(toIceCandidate(signal.candidate));
        } else {
          pendingCandidatesRef.current.push(signal.candidate);
        }
      }
    } catch (error) {
      console.error('[Call] Signal handling failed:', error);
    }
  }, [ensurePeerConnection, flushPendingCandidates, sendSignal, startTimer]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.16, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );

    if (status !== 'Connected') loop.start();
    return () => loop.stop();
  }, [pulseAnim, status]);

  useEffect(() => {
    if (!isOutgoing) {
      ensurePeerConnection().catch((error) => {
        console.error('[Call] Failed to prepare receiver media:', error);
        Alert.alert('Call failed', 'Could not start your microphone or camera.');
        navigation.goBack();
      });
    }
  }, [ensurePeerConnection, isOutgoing, navigation]);

  useEffect(() => {
    const offInitiated = on('call:initiated', (data) => {
      setCallId(data.callId);
      setStatus(data.status || 'RINGING');
    });

    const offAccepted = on('call:accepted', (data) => {
      if (data?.callId && callIdRef.current && data.callId !== callIdRef.current) return;
      startOutgoingMedia();
    });

    const offRejected = on('call:rejected', (data) => {
      if (data?.callId && callIdRef.current && data.callId !== callIdRef.current) return;
      setStatus('Call Declined');
      cleanupMedia();
      setTimeout(() => navigation.goBack(), 900);
    });

    const offEnded = on('call:ended', (data) => {
      if (data?.callId && callIdRef.current && data.callId !== callIdRef.current) return;
      setStatus('Call Ended');
      cleanupMedia();
      setTimeout(() => navigation.goBack(), 900);
    });

    const offSignal = on('call:signal', handleSignal);

    return () => {
      offInitiated?.();
      offAccepted?.();
      offRejected?.();
      offEnded?.();
      offSignal?.();
      cleanupMedia();
    };
  }, [cleanupMedia, handleSignal, navigation, on, startOutgoingMedia]);

  useEffect(() => {
    InCallManager.setMicrophoneMute(isMuted);
  }, [isMuted]);

  useEffect(() => {
    InCallManager.setSpeakerphoneOn(isSpeaker);
  }, [isSpeaker]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleEndCall = () => {
    if (callIdRef.current) emit('call:end', { callId: callIdRef.current });
    setStatus('Call Ended');
    cleanupMedia();
    navigation.goBack();
  };

  const remoteUrl = remoteStream?.toURL?.();
  const localUrl = localStream?.toURL?.();
  const name = getDisplayName(otherUser);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {isVideoCall && remoteUrl ? (
          <RTCView streamURL={remoteUrl} style={styles.remoteVideo} objectFit="cover" />
        ) : (
          <View style={styles.audioStage}>
            <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
            <UserAvatar uri={getMediaUrl(otherUser?.avatar)} name={name} size={132} style={styles.avatar} />
            <Text style={styles.nameText}>{name}</Text>
            <Text style={styles.statusText}>{status === 'Connected' ? formatDuration(duration) : status}</Text>
          </View>
        )}

        {isVideoCall && localUrl ? (
          <RTCView streamURL={localUrl} style={styles.localVideo} objectFit="cover" mirror />
        ) : null}

        {isVideoCall ? (
          <View style={styles.videoOverlay}>
            <Text style={styles.videoName}>{name}</Text>
            <Text style={styles.videoStatus}>{status === 'Connected' ? formatDuration(duration) : status}</Text>
          </View>
        ) : null}

        {!hasConnectedMedia && status === 'Connected' ? (
          <Text style={styles.connectingHint}>Waiting for media...</Text>
        ) : null}

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={() => setIsMuted((value) => !value)}
          >
            <MaterialCommunityIcons name={isMuted ? 'microphone-off' : 'microphone'} size={28} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
            <MaterialCommunityIcons name="phone-hangup" size={34} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isSpeaker && styles.controlBtnActive]}
            onPress={() => setIsSpeaker((value) => !value)}
          >
            <MaterialCommunityIcons name={isSpeaker ? 'volume-high' : 'volume-medium'} size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  safeArea: { flex: 1 },
  audioStage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  pulseRing: {
    position: 'absolute',
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: 'rgba(20, 184, 166, 0.2)',
  },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: 66,
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  nameText: { color: '#FFF', fontSize: 28, fontWeight: '800', textAlign: 'center' },
  statusText: { color: 'rgba(255,255,255,0.72)', fontSize: 18, marginTop: 10, fontWeight: '600' },
  remoteVideo: { ...StyleSheet.absoluteFillObject },
  localVideo: {
    position: 'absolute',
    top: 64,
    right: 18,
    width: 112,
    height: 156,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  videoOverlay: { position: 'absolute', top: 64, left: 20, right: 150 },
  videoName: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  videoStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4, fontWeight: '600' },
  connectingHint: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: { backgroundColor: 'rgba(20,184,166,0.72)' },
  endCallBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CallScreen;
