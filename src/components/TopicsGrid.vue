<script setup lang="ts">
import { ref } from 'vue';
import { HashtagIcon } from '@heroicons/vue/24/outline';

const topics = ref([
  { id: 1, name: 'Brainstorming', members: 12, active: true },
  { id: 2, name: 'Design Reviews', members: 8, active: false },
  { id: 3, name: 'Tech Talks', members: 15, active: true },
  { id: 4, name: 'Project Updates', members: 6, active: true },
]);

const activeTopic = ref(1);
</script>

<template>
  <div class="h-48 p-6 glass-effect m-4 rounded-2xl">
    <h2 class="text-2xl font-bold gradient-text mb-4">Active Topics</h2>
    <div class="grid grid-cols-4 gap-4">
      <div v-for="topic in topics" :key="topic.id"
        @click="activeTopic = topic.id"
        :class="['glass-effect rounded-xl p-4 cursor-pointer hover-effect',
          activeTopic === topic.id ? 'neon-border' : '']">
        <div class="flex items-center gap-2 mb-2">
          <HashtagIcon class="w-5 h-5 text-accent" />
          <span class="font-semibold">{{ topic.name }}</span>
        </div>
        <div class="flex items-center justify-between text-sm text-gray-400">
          <span>{{ topic.members }} members</span>
          <div :class="['w-2 h-2 rounded-full', topic.active ? 'bg-accent' : 'bg-gray-500']"></div>
        </div>
      </div>
    </div>
  </div>
</template>