<script setup lang="ts">
import { ref } from 'vue';
import { 
  HashtagIcon, 
  SpeakerWaveIcon, 
  EllipsisHorizontalIcon 
} from '@heroicons/vue/24/outline';

const props = defineProps<{
  categories: any[];
  activeChannelId: number;
}>();

const emit = defineEmits(['channelClick', 'showCreateModal', 'moveChannel']);

const showChannelMenu = ref<number | null>(null);

const handleChannelClick = (channel: any, event: MouseEvent) => {
  if (event.target instanceof HTMLElement && event.target.closest('.channel-menu-trigger')) {
    event.stopPropagation();
    showChannelMenu.value = channel.id;
  } else {
    emit('channelClick', channel);
  }
};

const moveChannel = (channel: any, categoryId: number) => {
  emit('moveChannel', { channel, categoryId });
  showChannelMenu.value = null;
};
</script>

<template>
  <div class="space-y-4">
    <div v-for="category in categories" :key="category.id" class="space-y-2">
      <div class="text-sm font-medium text-gray-400 uppercase">{{ category.name }}</div>
      <div v-for="channel in category.channels" :key="channel.id"
        @click="(e) => handleChannelClick(channel, e)"
        class="group relative"
        :class="['flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-300',
          activeChannelId === channel.id ? 'bg-chat-light neon-border' : 'hover:bg-chat-light']">
        <component :is="channel.type === 'voice' ? SpeakerWaveIcon : HashtagIcon" 
          class="w-5 h-5 text-gray-400" />
        <span class="text-gray-300 flex-1">{{ channel.name }}</span>
        
        <!-- Menu Trigger -->
        <button 
          class="channel-menu-trigger opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop="showChannelMenu = channel.id">
          <EllipsisHorizontalIcon class="w-5 h-5 text-gray-400 hover:text-gray-200" />
        </button>
        
        <!-- Channel Menu -->
        <div v-if="showChannelMenu === channel.id"
          class="channel-menu absolute right-0 top-full mt-1 bg-chat-darker rounded-lg shadow-lg py-2 z-50">
          <div class="px-4 py-2 text-sm text-gray-400">Move to category:</div>
          <button v-for="cat in categories" :key="cat.id"
            v-show="!cat.channels.some(c => c.id === channel.id)"
            @click="moveChannel(channel, cat.id)"
            class="w-full px-4 py-2 text-left text-gray-300 hover:bg-chat-light">
            {{ cat.name }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>