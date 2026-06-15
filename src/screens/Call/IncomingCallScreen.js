import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSocket } from '../../context/SocketContext';
import UserAvatar from '../../components/UserAvatar';
import { getMediaUrl } from '../../services/api';
import { Audio } from 'expo-av';

const IncomingCallScreen = ({ route, navigation }) => {
  const { callId, caller, callType } = route.params || {};
  const { emit, on } = useSocket();
  const [sound, setSound] = React.useState();

  useEffect(() => {
    async function playRingtone() {
      // Create a simple looping sound or load an asset
      // For now we try to load a default sound or generic tone
      // Since we don't have an asset, we'll skip actual Audio.Sound creation
      // unless provided, but we set up the skeleton.
      // const { sound } = await Audio.Sound.createAsync(require('../../../assets/ringtone.mp3'));
      // setSound(sound);
      // await sound.setIsLoopingAsync(true);
      // await sound.playAsync();
    }
    playRingtone();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const offEnded = on('call:ended', (data) => {
      if (data.callId === callId) {
        if (sound) sound.unloadAsync();
        navigation.goBack();
      }
    });

    return () => {
      offEnded?.();
    };
  }, [on, callId, navigation, sound]);

  const handleAccept = () => {
    if (sound) sound.unloadAsync();
    emit('call:accept', { callId });
    navigation.replace('Call', {
      callId,
      otherUser: caller,
      isOutgoing: false,
      callType
    });
  };

  const handleDecline = () => {
    if (sound) sound.unloadAsync();
    emit('call:reject', { callId });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <UserAvatar 
          uri={getMediaUrl(caller?.avatar)} 
          name={caller?.name || 'User'} 
          size={140} 
          style={styles.avatar} 
        />
        <Text style={styles.nameText}>{caller?.name || 'User'}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 80,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nameText: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 20,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 40,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EF4444',
    marginBottom: 10,
  },
  acceptBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#10B981',
    marginBottom: 10,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
});

export default IncomingCallScreen;
