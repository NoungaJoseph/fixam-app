import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
} from 'react-native-webrtc';

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const createPeerConnection = (onSignal, onRemoteStream) => {
  const pc = new RTCPeerConnection(configuration);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onSignal({ type: 'ice-candidate', candidate: event.candidate });
    }
  };

  pc.ontrack = (event) => {
    const [stream] = event.streams || [];
    if (stream) onRemoteStream(stream);
  };

  pc.onaddstream = (event) => {
    if (event.stream) onRemoteStream(event.stream);
  };

  return pc;
};

export const getLocalStream = async (video = false) => {
  return mediaDevices.getUserMedia({
    audio: true,
    video: video ? { facingMode: 'user' } : false,
  });
};

export const attachLocalStream = (pc, stream) => {
  if (!pc || !stream) return;

  if (pc.addTrack && stream.getTracks) {
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    return;
  }

  if (pc.addStream) {
    pc.addStream(stream);
  }
};

export const toSessionDescription = (description) => (
  description instanceof RTCSessionDescription
    ? description
    : new RTCSessionDescription(description)
);

export const toIceCandidate = (candidate) => (
  candidate instanceof RTCIceCandidate
    ? candidate
    : new RTCIceCandidate(candidate)
);
