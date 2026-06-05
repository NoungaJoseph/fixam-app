import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import UserAvatar from './UserAvatar';

const CallModal = () => {
  const { on, emit } = useSocket();
  const { colors } = useTheme();
  const [incomingCall, setIncomingCall] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [activeCall, setActiveCall] = useState(null);

  useEffect(() => {
    const offInvite = on('call:invite', (data) => {
      setIncomingCall(data);
    });

    const offAccepted = on('call:accepted', (data) => {
      setIsCalling(false);
      setActiveCall(data);
    });

    const offRejected = on('call:rejected', () => {
      setIsCalling(false);
      setIncomingCall(null);
      alert('Call rejected');
    });

    const offEnded = on('call:ended', () => {
      setIncomingCall(null);
      setIsCalling(false);
      setActiveCall(null);
    });

    return () => {
      offInvite?.();
      offAccepted?.();
      offRejected?.();
      offEnded?.();
    };
  }, [on]);

  const handleAccept = () => {
    emit('call:accept', { sessionId: incomingCall.sessionId });
    setActiveCall(incomingCall);
    setIncomingCall(null);
  };

  const handleReject = () => {
    emit('call:reject', { sessionId: incomingCall.sessionId });
    setIncomingCall(null);
  };

  const handleEnd = () => {
    emit('call:end', { sessionId: activeCall?.sessionId || incomingCall?.sessionId });
    setActiveCall(null);
    setIncomingCall(null);
    setIsCalling(false);
  };

  if (!incomingCall && !activeCall && !isCalling) return null;

  return (
    <Modal visible={true} transparent animationType="slide">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <MaterialCommunityIcons name={activeCall?.type === 'VIDEO' ? "video" : "phone"} size={24} color={colors.accent} />
          <Text style={[styles.status, { color: colors.textSecondary }]}>
            {incomingCall ? 'Incoming Call...' : activeCall ? 'On Call' : 'Calling...'}
          </Text>
        </View>

        <View style={styles.center}>
          <View style={[styles.avatarWrap, { borderColor: colors.accent }]}>
            <UserAvatar
              uri={incomingCall?.callerAvatar || activeCall?.callerAvatar}
              name={incomingCall?.callerName || activeCall?.callerName || 'Fixam User'}
              size={132}
            />
          </View>
          <Text style={[styles.name, { color: colors.text }]}>
            {incomingCall?.callerName || activeCall?.callerName || 'Fixam User'}
          </Text>
          {activeCall && <Text style={styles.timer}>04:20</Text>}
        </View>

        <View style={styles.actions}>
          {incomingCall ? (
            <>
              <TouchableOpacity style={[styles.btn, styles.decline]} onPress={handleReject}>
                <MaterialCommunityIcons name="phone-hangup" size={32} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.accept]} onPress={handleAccept}>
                <MaterialCommunityIcons name="phone" size={32} color="#FFF" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[styles.btn, styles.decline]} onPress={handleEnd}>
              <MaterialCommunityIcons name="phone-hangup" size={32} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'space-between' },
  header: { alignItems: 'center', marginTop: 40 },
  status: { fontSize: 16, fontWeight: '600', marginTop: 10, letterSpacing: 1 },
  center: { alignItems: 'center' },
  avatarWrap: { width: 150, height: 150, borderRadius: 75, borderWidth: 4, padding: 5, marginBottom: 20 },
  avatar: { width: '100%', height: '100%', borderRadius: 75 },
  name: { fontSize: 28, fontWeight: '800' },
  timer: { fontSize: 18, color: '#9CA3AF', marginTop: 10, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 40, marginBottom: 60 },
  btn: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  decline: { backgroundColor: '#EF4444' },
  accept: { backgroundColor: '#10B981' },
});

export default CallModal;
