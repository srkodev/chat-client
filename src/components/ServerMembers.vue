<script setup lang="ts">
const props = defineProps<{
  members: {
    id: number;
    name: string;
    status: string;
    avatar: string;
    bio?: string;
    joinDate?: string;
    badges?: string[];
    isFriend?: boolean;
  }[];
}>();

const emit = defineEmits(['showProfile']);
</script>

<template>
  <div class="w-60 bg-chat-darker p-4 overflow-y-auto scrollbar-hide">
    <div class="mb-4">
      <h3 class="text-sm font-medium text-gray-400 uppercase">Members - {{ members.length }}</h3>
    </div>
    <div class="space-y-2">
      <div v-for="member in members" :key="member.id"
        @click.stop="$emit('showProfile', member, $event)"
        class="flex items-center gap-3 p-2 rounded-lg hover:bg-chat-light cursor-pointer">
        <div class="relative">
          <img :src="member.avatar" alt="avatar" class="w-8 h-8 rounded-lg" />
          <div :class="['absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-chat-darker',
            member.status === 'online' ? 'bg-green-500' :
            member.status === 'idle' ? 'bg-yellow-500' :
            member.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500']">
          </div>
        </div>
        <span class="text-sm">{{ member.name }}</span>
      </div>
    </div>
  </div>
</template>
