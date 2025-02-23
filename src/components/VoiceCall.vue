<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { MicrophoneIcon, VideoCameraIcon, PhoneXMarkIcon, SpeakerXMarkIcon } from '@heroicons/vue/24/outline';
import io from 'socket.io-client';

// Interfaces pour les types
interface CallData {
  signal: RTCSessionDescriptionInit;
  from: number | string;
  callType: 'audio' | 'video';
}

interface ICECandidateData {
  candidate: RTCIceCandidateInit;
  from: number | string;
}

const isNegotiating = ref(false);
const isClosing = ref(false);
const isWaiting = ref(false);

const props = defineProps<{
  // Les informations du participant distant (user appelé)
  user: { id: string | number; name: string; avatar: string };
  type?: 'audio' | 'video';
  socket?: any;
  incomingCallData?: { signal: any, from: number | string, callType: 'audio' | 'video' };
}>();

const emit = defineEmits(['end']);

// Références pour les éléments vidéo
const localVideo = ref<HTMLVideoElement | null>(null);
const remoteVideo = ref<HTMLVideoElement | null>(null);

// Pour l'avatar et le nom local, on suppose qu'ils sont stockés (par exemple lors de la connexion)
const localAvatar = ref<string>(localStorage.getItem('avatar') || 'https://via.placeholder.com/150?text=Avatar');
const localUsername = ref<string>(localStorage.getItem('username') || 'Moi');

// États de l'appel
const isMuted = ref(false);
const isVideoEnabled = ref(props.type === 'video');
const callDuration = ref(0);
const localAudioLevel = ref(0);
const remoteAudioLevel = ref(0);
const isConnectionClosed = ref(false);

// Détection de la présence du flux distant (l'utilisateur rejoint l'appel)
const remoteJoined = ref(false);

let durationInterval: number;
let localAudioContext: AudioContext | null = null;
let remoteAudioContext: AudioContext | null = null;
let peerConnection: RTCPeerConnection | null = null;
let localStream: MediaStream | null = null;

// Utilisation du socket passé en prop ou création d'un nouveau socket
const socket = props.socket || io("http://localhost:5000", {
  auth: { token: localStorage.getItem("token") }
});
const ownSocket = !props.socket;

// Configuration ICE avec serveur TURN (pour les tests en local, utilisez localhost)
const configuration: RTCConfiguration = {
  iceServers: [
    {
      urls: "turn:localhost:3478",
      username: "username",
      credential: "password"
    },
    {
      urls: "stun:stun.l.google.com:19302"
    }
  ]
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const startAudioAnalysis = (stream: MediaStream, setLevel: (level: number) => void): AudioContext | null => {
  try {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const update = () => {
      if (audioContext.state === 'closed') return;
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      setLevel(average);
      if (!isConnectionClosed.value) {
        requestAnimationFrame(update);
      }
    };
    
    update();
    return audioContext;
  } catch (err) {
    console.error('[DEBUG][VoiceCall] Error in startAudioAnalysis:', err);
    return null;
  }
};

const currentUserId = (): number | null => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id;
  } catch (e) {
    return null;
  }
};

const initSocket = (): void => {
  socket.on("callCandidate", async (data: ICECandidateData) => {
    console.log('[DEBUG][VoiceCall] callCandidate received:', data);
    try {
      if (!peerConnection || peerConnection.signalingState === 'closed' || isConnectionClosed.value) {
        console.log('[DEBUG][VoiceCall] Ignoring ICE candidate - connection is closed');
        return;
      }
      const candidate = new RTCIceCandidate(data.candidate);
      await peerConnection.addIceCandidate(candidate);
      console.log('[DEBUG][VoiceCall] Added ICE candidate');
    } catch (err) {
      console.error('[DEBUG][VoiceCall] Error adding ICE candidate:', err);
    }
  });

  socket.on("endCall", () => {
    console.log('[DEBUG][VoiceCall] endCall received');
    endCall();
  });
};

const addCommonPeerListeners = (): void => {
  if (!peerConnection) return;

  peerConnection.oniceconnectionstatechange = () => {
    console.log('[DEBUG][VoiceCall] ICE Connection State:', peerConnection?.iceConnectionState);
    if (peerConnection?.iceConnectionState === 'disconnected' || 
        peerConnection?.iceConnectionState === 'failed') {
      endCall();
    }
  };

  peerConnection.ontrack = async (event: RTCTrackEvent) => {
    console.log('[DEBUG][VoiceCall] ontrack event:', event);
    if (!remoteVideo.value || isConnectionClosed.value) return;
    
    try {
      if (!remoteVideo.value.srcObject) {
        remoteVideo.value.srcObject = new MediaStream();
        remoteAudioContext = startAudioAnalysis(remoteVideo.value.srcObject as MediaStream, (level) => {
          remoteAudioLevel.value = level;
        });
        // Marquer que le participant distant a rejoint l'appel
        remoteJoined.value = true;
      }
      
      event.streams[0].getTracks().forEach((track: MediaStreamTrack) => {
        if (!isConnectionClosed.value && remoteVideo.value?.srcObject) {
          (remoteVideo.value.srcObject as MediaStream).addTrack(track);
        }
      });
      
      await remoteVideo.value.play();
    } catch (err) {
      console.error('[DEBUG][VoiceCall] Error in ontrack:', err);
    }
  };

  peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
    if (event.candidate && !isConnectionClosed.value) {
      const target = props.incomingCallData ? Number(props.incomingCallData.from) : Number(props.user.id);
      socket.emit("callCandidate", {
        to: target,
        candidate: event.candidate
      });
    }
  };
};

const startCall = async (): Promise<void> => {
  console.log('[DEBUG][VoiceCall] startCall initiated');
  if (isWaiting.value) return;
  isWaiting.value = true;
  
  try {
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: isVideoEnabled.value
    });
    
    if (localVideo.value) {
      localVideo.value.srcObject = localStream;
      await localVideo.value.play();
    }
    
    localAudioContext = startAudioAnalysis(localStream, (level) => {
      localAudioLevel.value = level;
    });
    
    peerConnection = new RTCPeerConnection(configuration);

    // Ajouter les tracks avant d'ajouter les listeners
    if (localStream) {
      localStream.getTracks().forEach(track => {
        if (peerConnection) {
          peerConnection.addTrack(track, localStream as MediaStream);
        }
      });
    }

    addCommonPeerListeners();
    
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: isVideoEnabled.value
    });
    
    await peerConnection.setLocalDescription(offer);
    
    socket.emit("callUser", {
      userToCall: Number(props.user.id),
      signalData: offer,
      from: currentUserId(),
      callType: props.type
    });
    
    socket.off("callAnswered").on("callAnswered", async (data: CallData) => {
      try {
        if (!peerConnection || isConnectionClosed.value) return;
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
      } catch (err) {
        console.error('[DEBUG][VoiceCall] Error in callAnswered:', err);
        endCall();
      }
    });

  } catch (err) {
    console.error('[DEBUG][VoiceCall] Error in startCall:', err);
    endCall();
  } finally {
    isWaiting.value = false;
  }
};

const answerCall = async (): Promise<void> => {
  console.log('[DEBUG][VoiceCall] answerCall initiated');
  if (isWaiting.value) return;
  isWaiting.value = true;

  try {
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: isVideoEnabled.value
    });
    
    if (localVideo.value) {
      localVideo.value.srcObject = localStream;
      await localVideo.value.play();
    }
    
    localAudioContext = startAudioAnalysis(localStream, (level) => {
      localAudioLevel.value = level;
    });
    
    peerConnection = new RTCPeerConnection(configuration);

    if (localStream) {
      localStream.getTracks().forEach(track => {
        if (peerConnection) {
          peerConnection.addTrack(track, localStream as MediaStream);
        }
      });
    }

    addCommonPeerListeners();

    if (props.incomingCallData?.signal) {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(props.incomingCallData.signal)
      );
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socket.emit("answerCall", {
        to: Number(props.incomingCallData?.from),
        signal: answer
      });
    }
  } catch (err) {
    console.error('[DEBUG][VoiceCall] Error in answerCall:', err);
    endCall();
  } finally {
    isWaiting.value = false;
  }
};

const endCall = (): void => {
  console.log('[DEBUG][VoiceCall] endCall invoked');
  if (isClosing.value) return;
  isClosing.value = true;
  isConnectionClosed.value = true;

  try {
    if (localStream) {
      localStream.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
        console.log('[DEBUG][VoiceCall] Local track stopped:', track.kind);
      });
      localStream = null;
    }

    if (remoteVideo.value?.srcObject) {
      const remoteStream = remoteVideo.value.srcObject as MediaStream;
      remoteStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      remoteVideo.value.srcObject = null;
    }

    if (localVideo.value?.srcObject) {
      localVideo.value.srcObject = null;
    }

    if (peerConnection && peerConnection.signalingState !== 'closed') {
      peerConnection.close();
    }
    peerConnection = null;

    if (localAudioContext && localAudioContext.state !== 'closed') {
      try {
        localAudioContext.close();
      } catch (err) {
        console.log('[DEBUG][VoiceCall] Error closing local audio context:', err);
      }
    }
    localAudioContext = null;

    if (remoteAudioContext && remoteAudioContext.state !== 'closed') {
      try {
        remoteAudioContext.close();
      } catch (err) {
        console.log('[DEBUG][VoiceCall] Error closing remote audio context:', err);
      }
    }
    remoteAudioContext = null;

    if (socket && ownSocket) {
      socket.emit("endCall", { to: Number(props.user.id) });
      socket.disconnect();
    }

    emit('end');
  } catch (err) {
    console.error('[DEBUG][VoiceCall] Error in endCall:', err);
  } finally {
    isClosing.value = false;
  }
};

const toggleMute = (): void => {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    isMuted.value = !isMuted.value;
    console.log('[DEBUG][VoiceCall] Toggle mute:', isMuted.value);
  }
};

const toggleVideo = (): void => {
  if (localStream) {
    localStream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    isVideoEnabled.value = !isVideoEnabled.value;
    console.log('[DEBUG][VoiceCall] Toggle video:', isVideoEnabled.value);
  }
};

const remoteMuted = ref(false);
const remoteVolume = ref(100);

const toggleRemoteMute = (): void => {
  remoteMuted.value = !remoteMuted.value;
  if (remoteVideo.value) {
    remoteVideo.value.volume = remoteMuted.value ? 0 : remoteVolume.value / 100;
  }
  console.log('[DEBUG][VoiceCall] Toggle remote mute:', remoteMuted.value);
};

const updateRemoteVolume = (event: Event): void => {
  const input = event.target as HTMLInputElement;
  remoteVolume.value = Number(input.value);
  if (remoteVideo.value) {
    remoteVideo.value.volume = remoteVolume.value / 100;
    if (remoteVolume.value > 0) {
      remoteMuted.value = false;
    }
  }
  console.log('[DEBUG][VoiceCall] Remote volume updated:', remoteVolume.value);
};

onMounted(async () => {
  initSocket();
  durationInterval = setInterval(() => {
    if (!isConnectionClosed.value) {
      callDuration.value++;
    }
  }, 1000) as unknown as number;

  if (props.incomingCallData) {
    console.log('[DEBUG][VoiceCall] Incoming call detected, answering call');
    await answerCall();
  } else if (props.type) {
    console.log('[DEBUG][VoiceCall] Outgoing call requested, starting call');
    await startCall();
  }
});

onUnmounted(() => {
  clearInterval(durationInterval);
  endCall();
});
</script>

<template>
  <div class="fixed inset-0 bg-chat-darker bg-opacity-90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
    <!-- En-tête avec titre et bouton de fin d'appel -->
    <div class="mb-4 flex items-center justify-between w-full px-4">
      <h3 class="text-white font-bold">Appel Vocal</h3>
      <button @click="endCall" class="p-2 bg-red-500 hover:bg-red-600 rounded">
        <PhoneXMarkIcon class="w-6 h-6" />
      </button>
    </div>
    <!-- Grille des participants (style "Discord") -->
    <div class="participants-grid w-full max-w-4xl grid grid-cols-2 gap-4 mb-6">
      <!-- Participant local -->
      <div class="participant-card" :class="{'speaking-border': localAudioLevel > 30}">
        <video v-if="isVideoEnabled" ref="localVideo" class="w-full h-48 object-cover" autoplay playsinline muted></video>
        <img v-else :src="localAvatar" alt="Mon Avatar" class="w-full h-48 object-cover" />
        <div class="participant-name">{{ localUsername }}</div>
      </div>
      <!-- Participant distant -->
      <div v-if="remoteJoined" class="participant-card" :class="{'speaking-border': remoteAudioLevel > 30}">
        <video v-if="isVideoEnabled" ref="remoteVideo" class="w-full h-48 object-cover" autoplay playsinline></video>
        <img v-else :src="props.user.avatar" alt="Avatar utilisateur" class="w-full h-48 object-cover" />
        <div class="participant-name">{{ props.user.name }}</div>
      </div>
      <div v-else class="participant-card waiting">
        <img :src="props.user.avatar" alt="Avatar utilisateur" class="w-full h-48 object-cover opacity-50" />
        <div class="participant-name">{{ props.user.name }} (en attente)</div>
      </div>
    </div>
    <!-- Commandes de l'appel -->
    <div class="flex items-center justify-center gap-4">
      <button
        @click="toggleMute"
        :disabled="isConnectionClosed"
        :class="[ 
          'p-4 rounded-xl transition-colors',
          isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-chat-light hover:bg-chat-light/80',
          isConnectionClosed ? 'opacity-50 cursor-not-allowed' : ''
        ]"
      >
        <MicrophoneIcon class="w-6 h-6" />
      </button>

      <button
        @click="toggleVideo"
        :disabled="isConnectionClosed"
        :class="[ 
          'p-4 rounded-xl transition-colors',
          isVideoEnabled ? 'bg-accent hover:bg-accent-hover' : 'bg-chat-light hover:bg-chat-light/80',
          isConnectionClosed ? 'opacity-50 cursor-not-allowed' : ''
        ]"
      >
        <VideoCameraIcon class="w-6 h-6" />
      </button>

      <button
        @click="toggleRemoteMute"
        :disabled="isConnectionClosed"
        :class="[ 
          'p-4 rounded-xl transition-colors',
          remoteMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-chat-light hover:bg-chat-light/80',
          isConnectionClosed ? 'opacity-50 cursor-not-allowed' : ''
        ]"
      >
        <SpeakerXMarkIcon class="w-6 h-6" />
      </button>

      <input
        type="range"
        min="0"
        max="100"
        step="1"
        v-model="remoteVolume"
        @input="updateRemoteVolume"
        :disabled="isConnectionClosed"
        class="w-24"
        :class="{ 'opacity-50 cursor-not-allowed': isConnectionClosed }"
      />
    </div>
  </div>
</template>

<style scoped>
/* Indicateur visuel lors de la parole */
.speaking-border {
  box-shadow: 0 0 15px 5px #4ade80;
  border: 2px solid #4ade80;
}

/* Grille des participants */
.participants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

/* Carte d'un participant */
.participant-card {
  position: relative;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
}

/* Carte d'attente */
.participant-card.waiting {
  opacity: 0.7;
  border: 2px dashed #ccc;
}

/* Nom affiché en bas de chaque carte */
.participant-card .participant-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 0.5rem;
  text-align: center;
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  height: 8px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #4ade80;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #4ade80;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
