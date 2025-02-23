<script setup lang="ts">
import { ref } from 'vue';
import { HashtagIcon } from '@heroicons/vue/24/outline';

const channels = ref([
  { id: 1, name: 'general', unread: true },
  { id: 2, name: 'announcements', unread: false },
  { id: 3, name: 'gaming', unread: true },
  { id: 4, name: 'music', unread: false },
  { id: 5, name: 'development', unread: false },
]);

const activeChannel = ref(1);
</script>

<template>
  <div class="w-64 h-screen bg-chat-dark flex flex-col">
    <div class="p-4 border-b border-gray-700">
      <h2 class="text-xl font-bold">Channels</h2>
    </div>
    <div class="flex-1 overflow-y-auto scrollbar-hide">
      <div v-for="channel in channels" :key="channel.id"
        @click="activeChannel = channel.id"
        :class="['flex items-center gap-2 p-3 cursor-pointer hover-effect',
          activeChannel === channel.id ? 'bg-chat-light' : '']">
        <HashtagIcon class="w-5 h-5 text-gray-400" />
        <span :class="['text-gray-300', channel.unread ? 'font-semibold' : '']">
          {{ channel.name }}
        </span>
        <div v-if="channel.unread" class="w-2 h-2 rounded-full bg-accent ml-auto"></div>
      </div>
    </div>
  </div>
</template>