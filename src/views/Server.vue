<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  ArrowLeftIcon, 
  PlusCircleIcon,
  ChevronRightIcon,
  HashtagIcon,
  SpeakerWaveIcon,
  XMarkIcon,
  EllipsisHorizontalIcon
} from '@heroicons/vue/24/outline';
import MessageInput from '../components/MessageInput.vue';
import Message from '../components/Message.vue';
import VoiceChannel from '../components/VoiceChannel.vue';
import UserProfilePopup from '../components/UserProfilePopup.vue';
import ServerChannels from '../components/ServerChannels.vue';
import ServerMembers from '../components/ServerMembers.vue';

const route = useRoute();
const router = useRouter();
const serverId = route.params.id;
const messagesContainer = ref<HTMLDivElement | null>(null);
const activeChannelId = ref(1);
const showCreateModal = ref(false);
const showMembersList = ref(true);
const selectedUser = ref(null);
const popupPosition = ref({ x: 0, y: 0 });
const replyTo = ref(null);

interface CreateChannelForm {
  name: string;
  type: 'text' | 'voice';
  categoryId: number;
}

const createChannelForm = ref<CreateChannelForm>({
  name: '',
  type: 'text',
  categoryId: 0
});

interface CreateCategoryForm {
  name: string;
}

const createCategoryForm = ref<CreateCategoryForm>({
  name: ''
});

interface Category {
  id: number;
  name: string;
  channels: Channel[];
}

interface Channel {
  id: number;
  name: string;
  type: 'text' | 'voice';
  messages: any[];
  participants?: { id: number; name: string; avatar: string; speaking?: boolean }[];
}

const server = ref({
  id: serverId,
  name: 'Gaming Hub',
  members: [
    { 
      id: 1, 
      name: 'Alex', 
      status: 'online', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      bio: 'Gamer and developer',
      joinDate: 'January 2024',
      badges: ['Admin', 'Founder'],
      isFriend: true
    },
    { 
      id: 2, 
      name: 'Sarah', 
      status: 'idle', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      bio: 'Artist and gamer',
      joinDate: 'February 2024',
      badges: ['Moderator'],
      isFriend: false
    },
    { 
      id: 3, 
      name: 'Mike', 
      status: 'dnd', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
      bio: 'Just gaming',
      joinDate: 'March 2024',
      isFriend: false
    }
  ],
  categories: [
    {
      id: 1,
      name: 'General',
      channels: [
        { id: 1, name: 'general', type: 'text', messages: [] },
        { id: 2, name: 'voice-chat', type: 'voice', participants: [
          { id: 1, name: 'Alex', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', speaking: true },
          { id: 2, name: 'Sarah', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' }
        ] }
      ]
    },
    {
      id: 2,
      name: 'Gaming',
      channels: [
        { id: 3, name: 'share-games', type: 'text', messages: [] },
        { id: 4, name: 'gaming-voice', type: 'voice', participants: [] }
      ]
    }
  ]
});

const messages = ref([
  { 
    id: 1, 
    user: 'Alex', 
    content: 'Hey @Sarah, check out this code:\n```javascript\nconst hello = "world";\nconsole.log(hello);\n```', 
    timestamp: '12:30', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    reactions: [
      { emoji: '👍', count: 1, users: ['Sarah'] },
      { emoji: '🔥', count: 2, users: ['Sarah', 'Mike'] }
    ]
  },
  { 
    id: 2, 
    user: 'Sarah', 
    content: 'Thanks @Alex! That looks great! 👍', 
    timestamp: '12:31', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    reactions: []
  }
]);

const handleResize = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const sendMessage = ({ content, replyTo: reply }) => {
  messages.value.push({
    id: messages.value.length + 1,
    user: 'You',
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
    reactions: [],
    replyTo: reply
  });
  
  replyTo.value = null;
  
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  }, 100);
};

const handleJoinVoice = (channelId: number) => {
  console.log(`Joined voice channel ${channelId}`);
};

const handleLeaveVoice = (channelId: number) => {
  console.log(`Left voice channel ${channelId}`);
};

const handleReply = (message: any) => {
  replyTo.value = {
    id: message.id,
    user: message.user,
    content: message.content
  };
};

const handleAddReaction = ({ messageId, emoji }: { messageId: number; emoji: string }) => {
  const message = messages.value.find(m => m.id === messageId);
  if (message) {
    if (!message.reactions) {
      message.reactions = [];
    }
    
    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    if (existingReaction) {
      if (!existingReaction.users.includes('You')) {
        existingReaction.count++;
        existingReaction.users.push('You');
      }
    } else {
      message.reactions.push({
        emoji,
        count: 1,
        users: ['You']
      });
    }
  }
};

const handleRemoveReaction = ({ messageId, emoji }: { messageId: number; emoji: string }) => {
  const message = messages.value.find(m => m.id === messageId);
  if (message && message.reactions) {
    const reaction = message.reactions.find(r => r.emoji === emoji);
    if (reaction && reaction.users.includes('You')) {
      reaction.count--;
      reaction.users = reaction.users.filter(u => u !== 'You');
      if (reaction.count === 0) {
        message.reactions = message.reactions.filter(r => r.emoji !== emoji);
      }
    }
  }
};

const handleEdit = ({ id, content }: { id: number; content: string }) => {
  const msg = messages.value.find(m => m.id === id);
  if (msg) {
    msg.content = content;
  }
};

const showUserProfile = (user: any, event: MouseEvent) => {
  selectedUser.value = user;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const popupWidth = 340;
  let x = rect.left + rect.width + 10;
  if (x + popupWidth > window.innerWidth) {
    x = rect.left - popupWidth - 10;
  }
  const y = Math.min(rect.top, window.innerHeight - 400);
  popupPosition.value = { x, y };
};

const handleAddFriend = (user: any) => {
  const member = server.value.members.find(m => m.id === user.id);
  if (member) {
    member.isFriend = true;
  }
  selectedUser.value = null;
};

const handleRemoveFriend = (user: any) => {
  const member = server.value.members.find(m => m.id === user.id);
  if (member) {
    member.isFriend = false;
  }
  selectedUser.value = null;
};

const activeChannel = computed(() => {
  for (const category of server.value.categories) {
    const channel = category.channels.find(c => c.id === activeChannelId.value);
    if (channel) return channel;
  }
  return null;
});

const moveChannel = (channel: Channel, targetCategoryId: number) => {
  const sourceCategory = server.value.categories.find(category => 
    category.channels.some(c => c.id === channel.id)
  );
  
  const targetCategory = server.value.categories.find(c => c.id === targetCategoryId);
  
  if (sourceCategory && targetCategory) {
    sourceCategory.channels = sourceCategory.channels.filter(c => c.id !== channel.id);
    targetCategory.channels.push(channel);
  }
};

const createChannel = () => {
  const form = createChannelForm.value;
  const category = server.value.categories.find(c => c.id === form.categoryId);
  
  if (category) {
    const newChannel = {
      id: Math.max(0, ...server.value.categories.flatMap(c => c.channels.map(ch => ch.id))) + 1,
      name: form.name.toLowerCase().replace(/\s+/g, '-'),
      type: form.type,
      messages: [],
      participants: form.type === 'voice' ? [] : undefined
    };
    
    category.channels.push(newChannel);
    createChannelForm.value = {
      name: '',
      type: 'text',
      categoryId: 0
    };
    showCreateModal.value = false;
  }
};

const createCategory = () => {
  const newCategory = {
    id: Math.max(0, ...server.value.categories.map(c => c.id)) + 1,
    name: createCategoryForm.value.name,
    channels: []
  };
  
  server.value.categories.push(newCategory);
  createCategoryForm.value.name = '';
  showCreateModal.value = false;
};

onMounted(() => {
  document.addEventListener('click', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-profile') && !target.closest('.member-item')) {
      selectedUser.value = null;
    }
  });
});
</script>

<template>
  <div class="min-h-screen bg-chat-dark flex">
    <!-- Channels Sidebar -->
    <div class="w-64 bg-chat-darker p-4">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <button @click="router.push('/')" class="text-accent hover:text-accent-hover">
            <ArrowLeftIcon class="w-5 h-5" />
          </button>
          <h2 class="text-xl font-bold gradient-text">{{ server.name }}</h2>
        </div>
        <button @click="showCreateModal = true" 
          class="p-2 text-accent hover:text-accent-hover rounded-lg">
          <PlusCircleIcon class="w-5 h-5" />
        </button>
      </div>
      
      <ServerChannels 
        :categories="server.categories"
        :activeChannelId="activeChannelId"
        @channelClick="channel => activeChannelId = channel.id"
        @showCreateModal="showCreateModal = true"
        @moveChannel="({ channel, categoryId }) => moveChannel(channel, categoryId)"
      />
    </div>

    <!-- Chat Area -->
    <div class="flex-1 flex flex-col">
      <!-- Channel Header -->
      <div class="glass-effect p-4 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <component :is="activeChannel?.type === 'voice' ? SpeakerWaveIcon : HashtagIcon" 
            class="w-6 h-6 text-gray-400" />
          <h3 class="font-bold">{{ activeChannel?.name }}</h3>
        </div>
        <button @click="showMembersList = !showMembersList"
          class="p-2 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-chat-light">
          <ChevronRightIcon class="w-5 h-5" :class="{ 'rotate-180': showMembersList }" />
        </button>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex">
        <div class="flex-1 p-6 overflow-y-auto scrollbar-hide">
          <template v-if="activeChannel?.type === 'text'">
            <div class="space-y-6" ref="messagesContainer">
              <Message 
                v-for="message in messages" 
                :key="message.id"
                :message="message"
                :currentUser="'You'"
                @reply="handleReply"
                @edit="handleEdit"
                @addReaction="handleAddReaction"
                @removeReaction="handleRemoveReaction"
              />
            </div>
          </template>
          <template v-else-if="activeChannel?.type === 'voice'">
            <VoiceChannel
              :channelName="activeChannel.name"
              :participants="activeChannel.participants || []"
              @join="handleJoinVoice(activeChannel.id)"
              @leave="handleLeaveVoice(activeChannel.id)"
            />
          </template>
        </div>

        <!-- Members List -->
        <ServerMembers 
          v-if="showMembersList"
          :members="server.members"
          @showProfile="showUserProfile"
          class="member-item"
        />
      </div>

      <!-- Input Area -->
      <MessageInput 
        v-if="activeChannel?.type === 'text'"
        :users="server.members"
        :replyTo="replyTo"
        @send="sendMessage"
        @cancelReply="replyTo = null"
      />
    </div>

    <!-- Create Channel/Category Modal -->
    <div v-if="showCreateModal" 
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="glass-effect rounded-xl p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold gradient-text">Create New</h3>
          <button @click="showCreateModal = false" class="text-gray-400 hover:text-white">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-4 mb-6">
          <button 
            @click="createChannelForm.type = 'text'"
            :class="['px-4 py-2 rounded-lg transition-colors',
              createChannelForm.type === 'text' ? 'bg-accent text-chat-darker' : 'glass-effect']">
            Text Channel
          </button>
          <button 
            @click="createChannelForm.type = 'voice'"
            :class="['px-4 py-2 rounded-lg transition-colors',
              createChannelForm.type === 'voice' ? 'bg-accent text-chat-darker' : 'glass-effect']">
            Voice Channel
          </button>
          <button 
            @click="createChannelForm.type = undefined"
            :class="['px-4 py-2 rounded-lg transition-colors',
              !createChannelForm.type ? 'bg-accent text-chat-darker' : 'glass-effect']">
            Category
          </button>
        </div>

        <!-- Channel Form -->
        <form v-if="createChannelForm.type" @submit.prevent="createChannel" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Channel Name</label>
            <input
              v-model="createChannelForm.name"
              type="text"
              class="w-full bg-chat-light bg-opacity-50 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
              placeholder="new-channel"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Category</label>
            <select
              v-model="createChannelForm.categoryId"
              class="w-full bg-chat-light bg-opacity-50 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
              required
            >
              <option value="" disabled>Select a category</option>
              <option v-for="category in server.categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>

          <button type="submit"
            class="w-full bg-gradient-to-r from-accent to-secondary py-3 rounded-lg text-chat-darker hover:opacity-90 transition-opacity">
            Create Channel
          </button>
        </form>

        <!-- Category Form -->
        <form v-else @submit.prevent="createCategory" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Category Name</label>
            <input
              v-model="createCategoryForm.name"
              type="text"
              class="w-full bg-chat-light bg-opacity-50 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
              placeholder="New Category"
              required
            />
          </div>

          <button type="submit"
            class="w-full bg-gradient-to-r from-accent to-secondary py-3 rounded-lg text-chat-darker hover:opacity-90 transition-opacity">
            Create Category
          </button>
        </form>
      </div>
    </div>

    <!-- User Profile Popup -->
    <UserProfilePopup
      v-if="selectedUser"
      :user="selectedUser"
      :position="popupPosition"
      @close="selectedUser = null"
      @addFriend="handleAddFriend"
      @removeFriend="handleRemoveFriend"
      class="user-profile"
    />
  </div>
</template>