<script setup lang="ts">
import { ref } from 'vue';
import { BeakerIcon, SparklesIcon, RocketLaunchIcon, CommandLineIcon } from '@heroicons/vue/24/outline';

const spaces = ref([
  { id: 1, name: 'Innovation Lab', icon: BeakerIcon, color: 'from-[#00f5d4] to-[#4264fb]' },
  { id: 2, name: 'Creative Hub', icon: SparklesIcon, color: 'from-[#FF3366] to-[#CB5EEE]' },
  { id: 3, name: 'Launch Pad', icon: RocketLaunchIcon, color: 'from-[#FFA63D] to-[#FF3366]' },
  { id: 4, name: 'Tech Core', icon: CommandLineIcon, color: 'from-[#4264fb] to-[#00f5d4]' },
]);

const activeSpace = ref(1);
</script>

<template>
  <div class="w-24 h-screen bg-chat-darker p-4 flex flex-col items-center gap-6">
    <div class="w-14 h-14 rounded-2xl glass-effect flex items-center justify-center">
      <SparklesIcon class="w-8 h-8 text-accent" />
    </div>
    <div class="flex-1 flex flex-col gap-4">
      <div v-for="space in spaces" :key="space.id"
        @click="activeSpace = space.id"
        :class="['w-16 h-16 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-110',
          activeSpace === space.id ? 'neon-border' : '']">
        <div class="w-full h-full glass-effect rounded-2xl flex items-center justify-center relative overflow-hidden">
          <div :class="['absolute inset-0 opacity-20 bg-gradient-to-br', space.color]"></div>
          <component :is="space.icon" class="w-8 h-8 text-white relative z-10" />
        </div>
      </div>
    </div>
  </div>
</template>