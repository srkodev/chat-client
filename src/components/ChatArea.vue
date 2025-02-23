<script setup lang="ts">
import { ref } from 'vue';
import { PaperAirplaneIcon, PlusCircleIcon, FaceSmileIcon } from '@heroicons/vue/24/outline';

interface Message {
  id: number;
  user: string;
  avatar: string;
  content: string;
  timestamp: string;
}

const messages = ref<Message[]>([
  {
    id: 1,
    user: 'Alex',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    content: 'Hey everyone! 👋',
    timestamp: '12:30'
  },
  {
    id: 2,
    user: 'Sarah',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'Welcome to the new chat interface!',
    timestamp: '12:31'
  },
  {
    id: 3,
    user: 'Mike',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    content: 'This looks amazing! 🚀',
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
  <div class="flex-1 flex flex-col h-screen bg-chat-dark">
    <!-- Chat Header avec effet glass -->
    <div class="h-16 flex items-center px-6 glass-effect">
      <div class="flex items-center gap-2">
        <h2 class="text-xl font-bold"># general</h2>
        <span class="text-sm text-gray-400">3 online</span>
      </div>
    </div>

    <!-- Messages Area -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
      <div v-for="message in messages" :key="message.id" class="flex items-start gap-4 hover-effect p-2 rounded-lg">
        <img :src="message.avatar" alt="avatar" class="w-10 h-10 rounded-full" />
        <div>
          <div class="flex items-center gap-2">
            <span class="font-semibold">{{ message.user }}</span>
            <span class="text-xs text-gray-400">{{ message.timestamp }}</span>
          </div>
          <p class="text-gray-300">{{ message.content }}</p>
        </div>
      </div>
    </div>

    <!-- Input Area avec effet glass identique -->
    <div class="p-4">
      <div class="glass-effect rounded-lg p-2 flex items-center gap-2">
        <button class="p-2 text-gray-400 hover:text-gray-200">
          <PlusCircleIcon class="w-6 h-6" />
        </button>
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          type="text"
          placeholder="Send a message..."
          class="flex-1 bg-transparent outline-none"
        />
        <button class="p-2 text-gray-400 hover:text-gray-200">
          <FaceSmileIcon class="w-6 h-6" />
        </button>
        <button
          @click="sendMessage"
          class="p-2 text-gray-400 hover:text-gray-200"
          :class="{ 'text-accent': newMessage.trim() }"
        >
          <PaperAirplaneIcon class="w-6 h-6" />
        </button>
      </div>
    </div>
  </div>
</template>

<style>
/* Effet glass */
.glass-effect {
  background: rgba(24, 24, 27, 0.5);
  backdrop-filter: blur(8px);
  border-radius: 0.75rem;
  padding: 0.5rem;
}

/* Effet hover pour les messages */
.hover-effect {
  transition: background-color 0.3s ease;
}
.hover-effect:hover {
  background-color: rgba(26, 31, 61, 0.2);
}

/* Masquer la scrollbar */
.scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
