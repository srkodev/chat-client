<script setup lang="ts">
import { ref } from 'vue';
import { HomeIcon, UsersIcon, HashtagIcon, CogIcon } from '@heroicons/vue/24/outline';

const servers = ref([
  { id: 1, name: 'Home', icon: HomeIcon },
  { id: 2, name: 'General', icon: HashtagIcon },
  { id: 3, name: 'Gaming', icon: UsersIcon },
  { id: 4, name: 'Settings', icon: CogIcon },
]);

const activeServer = ref(1);
</script>

<template>
  <div class="w-20 h-screen bg-chat-darker flex flex-col items-center py-4 gap-4">
    <div v-for="server in servers" :key="server.id"
      @click="activeServer = server.id"
      :class="['w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer hover-effect',
        activeServer === server.id ? 'bg-accent' : 'bg-chat-light']">
      <component :is="server.icon" class="w-6 h-6 text-gray-200" />
    </div>
  </div>
</template>