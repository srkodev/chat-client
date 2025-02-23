<script setup lang="ts">
import { ref } from 'vue';
import { PaperAirplaneIcon, PhotoIcon, LinkIcon } from '@heroicons/vue/24/outline';

interface Message {
  id: number;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
  reactions?: { emoji: string; count: number }[];
}

const messages = ref<Message[]>([
  {
    id: 1,
    user: 'Nova',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova',
    content: 'Just launched our new AI feature! 🚀',
    timestamp: '12:30',
    reactions: [{ emoji: '🎉', count: 3 }, { emoji: '🔥', count: 2 }]
  },
  {
    id: 2,
    user: 'Quantum',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Quantum',
    content: 'The interface looks incredible! Love the new gradient effects.',
    timestamp: '12:31',
    reactions: [{ emoji: '💫', count: 4 }]
  },
  {
    id: 3,
    user: 'Stellar',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Stellar',
    content: 'Can we schedule a design review for tomorrow?',
    timestamp: '12:32'
  }
]);

const newMessage = ref('');

const sendMessage = () => {
  if (!newMessage.value.trim()) return;
  
  messages.value.push({
    id: messages.value.length + 1,
    user: 'You',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
    content: newMessage.value,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });
  
  newMessage.value = '';
};
</script>

<template>
  <div class="flex-1 glass-effect m-4 rounded-2xl flex flex-col">
    <!-- Messages Area -->
    <div class="flex-1 p-6 overflow-y-auto scrollbar-hide space-y-6">
      <div v-for="message in messages" :key="message.id" 
        class="group flex items-start gap-4 p-4 rounded-xl hover:glass-effect transition-all duration-300">
        <img :src="message.avatar" alt="avatar" class="w-12 h-12 rounded-xl" />
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <span class="font-bold gradient-text">{{ message.user }}</span>
            <span class="text-xs text-gray-400">{{ message.timestamp }}</span>
          </div>
          <p class="text-gray-200">{{ message.content }}</p>
          <div v-if="message.reactions" class="flex gap-2 mt-2">
            <div v-for="(reaction, index) in message.reactions" :key="index"
              class="flex items-center gap-1 px-2 py-1 rounded-full glass-effect text-sm">
              <span>{{ reaction.emoji }}</span>
              <span class="text-gray-400">{{ reaction.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-4">
      <div class="glass-effect rounded-xl p-3 flex items-center gap-3">
        <button class="p-2 text-accent hover:text-accent-hover rounded-lg hover:glass-effect">
          <PhotoIcon class="w-6 h-6" />
        </button>
        <button class="p-2 text-accent hover:text-accent-hover rounded-lg hover:glass-effect">
          <LinkIcon class="w-6 h-6" />
        </button>
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          type="text"
          placeholder="Share your thoughts..."
          class="flex-1 bg-transparent outline-none placeholder-gray-500"
        />
        <button
          @click="sendMessage"
          class="p-2 bg-gradient-to-r from-accent to-secondary rounded-lg text-chat-darker hover:opacity-90"
        >
          <PaperAirplaneIcon class="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>
</template>