<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { MicrophoneIcon, SpeakerWaveIcon, PhoneXMarkIcon, VideoCameraIcon } from '@heroicons/vue/24/outline';

const props = defineProps<{
  channelName: string;
  participants: { id: number; name: string; avatar: string; speaking?: boolean }[];
}>();

const emit = defineEmits(['join', 'leave']);

const isJoined = ref(false);
const isVideoEnabled = ref(false);
const audioLevel = ref(0);
const localVideo = ref<HTMLVideoElement | null>(null);
const remoteVideos = ref<{ [key: string]: HTMLVideoElement | null }>({});

// Simuler l'activité vocale
const updateAudioLevel = () => {
  if (isJoined.value) {
    audioLevel.value = Math.random() * 100;
  }
};

let audioInterval: number;
let localStream: MediaStream | null = null;

onMounted(() => {
  audioInterval = setInterval(updateAudioLevel, 100) as unknown as number;
});

onUnmounted(() => {
  clearInterval(audioInterval);
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
});

const toggleJoin = async () => {
  if (!isJoined.value) {
    try {
      const constraints = {
        audio: true,
        video: false
      };
      localStream = await navigator.mediaDevices.getUserMedia(constraints);
      isJoined.value = true;
      emit('join');
    } catch (err) {
      console.error('Error accessing media devices:', err);
    }
  } else {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    isJoined.value = false;
    isVideoEnabled.value = false;
    emit('leave');
  }
};

const toggleVideo = async () => {
  if (!isJoined.value) return;

  try {
    if (!isVideoEnabled.value) {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (localStream) {
        videoStream.getVideoTracks().forEach(track => {
          localStream.addTrack(track);
        });
      } else {
        localStream = videoStream;
      }
      
      if (localVideo.value) {
        localVideo.value.srcObject = localStream;
      }
      
      isVideoEnabled.value = true;
    } else {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => {
          track.stop();
          localStream?.removeTrack(track);
        });
      }
      isVideoEnabled.value = false;
    }
  } catch (err) {
    console.error('Error toggling video:', err);
  }
};
</script>

<template>
  <div class="glass-effect rounded-xl p-4">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <SpeakerWaveIcon class="w-5 h-5 text-accent" />
        <h3 class="font-semibold">{{ channelName }}</h3>
      </div>
      <div class="flex gap-2">
        <button 
          v-if="isJoined"
          @click="toggleVideo"
          :class="['p-2 rounded-lg transition-colors touch-button',
            isVideoEnabled ? 'bg-accent text-chat-darker' : 'bg-chat-light text-gray-400']">
          <VideoCameraIcon class="w-5 h-5" />
        </button>
        <button 
          @click="toggleJoin"
          :class="['p-2 rounded-lg transition-colors touch-button',
            isJoined ? 'bg-red-500 hover:bg-red-600' : 'bg-accent hover:bg-accent-hover']">
          <component :is="isJoined ? PhoneXMarkIcon : MicrophoneIcon" 
            :class="['w-5 h-5', isJoined ? 'text-white' : 'text-chat-darker']" />
        </button>
      </div>
    </div>

    <!-- Video Grid -->
    <div v-if="isJoined && isVideoEnabled" class="grid grid-cols-2 gap-4 mb-4">
      <div class="relative aspect-video bg-chat-darker rounded-lg overflow-hidden">
        <video
          ref="localVideo"
          class="w-full h-full object-cover"
          autoplay
          muted
          playsinline
        ></video>
        <div class="absolute bottom-2 left-2 bg-chat-darker bg-opacity-75 px-2 py-1 rounded text-sm">
          You
        </div>
      </div>
      <div v-for="participant in participants" :key="participant.id"
        class="relative aspect-video bg-chat-darker rounded-lg overflow-hidden">
        <video
          :ref="el => remoteVideos[participant.id] = el"
          class="w-full h-full object-cover"
          autoplay
          playsinline
        ></video>
        <div class="absolute bottom-2 left-2 bg-chat-darker bg-opacity-75 px-2 py-1 rounded text-sm">
          {{ participant.name }}
        </div>
      </div>
    </div>

    <!-- Participants List -->
    <div class="space-y-3">
      <div v-for="participant in participants" :key="participant.id"
        class="flex items-center gap-3">
        <div class="relative">
          <img :src="participant.avatar" alt="avatar" class="w-8 h-8 rounded-lg" />
          <div :class="['absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-chat-dark',
            participant.speaking ? 'bg-green-500' : 'bg-accent']"></div>
        </div>
        <span class="text-sm">{{ participant.name }}</span>
        <div v-if="participant.speaking" class="flex-1">
          <div class="h-1 bg-accent/20 rounded-full overflow-hidden">
            <div class="h-full bg-accent transition-all duration-100"
              :style="{ width: `${audioLevel}%` }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>