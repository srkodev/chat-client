<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { 
  ChatBubbleLeftIcon, 
  UserPlusIcon, 
  XMarkIcon,
  UserMinusIcon
} from '@heroicons/vue/24/outline';

const router = useRouter();

const props = defineProps<{
  user: {
    id: number;
    name: string;
    avatar: string;
    status: string;
    bio?: string;
    joinDate?: string;
    badges?: string[];
    isFriend?: boolean;
  };
  position?: { x: number; y: number };
}>();

const emit = defineEmits(['close', 'addFriend', 'removeFriend', 'message']);

// Création d'une variable locale pour stocker le profil (pour permettre de le mettre à jour)
const profile = ref({ ...props.user });

// Fonction pour charger les données complètes du profil depuis le backend
const fetchUserProfile = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.get(`http://localhost:4000/api/users/${props.user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    profile.value = response.data as typeof props.user;
  } catch (error) {
    console.error("Erreur lors du chargement du profil de l'utilisateur", error);
  }
};

const popupRef = ref<HTMLDivElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (popupRef.value && !popupRef.value.contains(event.target as Node)) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  fetchUserProfile();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const sendMessage = () => {
  emit('close');
  router.push(`/messages/${profile.value.id}`);
};
</script>

<template>
  <div 
    ref="popupRef"
    class="fixed z-50"
    :style="position ? { left: `${position.x}px`, top: `${position.y}px` } : {}">
    <div class="glass-effect rounded-xl w-80 overflow-hidden shadow-xl">
      <!-- Header avec avatar et nom -->
      <div class="relative">
        <div class="h-20 bg-gradient-to-r from-accent to-secondary opacity-20"></div>
        <div class="absolute -bottom-10 left-4">
          <div class="relative">
            <img :src="profile.avatar" alt="avatar" class="w-20 h-20 rounded-xl border-4 border-chat-darker" />
            <div :class="['absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-chat-darker',
              profile.status === 'online' ? 'bg-green-500' :
              profile.status === 'idle' ? 'bg-yellow-500' :
              profile.status === 'dnd' ? 'bg-red-500' : 'bg-gray-500']">
            </div>
          </div>
        </div>
        <button @click="$emit('close')" 
          class="absolute top-2 right-2 text-gray-400 hover:text-white">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Informations de l'utilisateur -->
      <div class="pt-12 p-4">
        <div class="mb-4">
          <h3 class="text-xl font-bold">{{ profile.name }}</h3>
          <p class="text-sm text-gray-400">{{ profile.status }}</p>
        </div>

        <!-- Bio -->
        <div v-if="profile.bio" class="mb-4">
          <p class="text-sm text-gray-300">{{ profile.bio }}</p>
        </div>

        <!-- Badges -->
        <div v-if="profile.badges?.length" class="flex flex-wrap gap-2 mb-4">
          <span v-for="badge in profile.badges" :key="badge"
            class="px-2 py-1 text-xs rounded-full glass-effect">
            {{ badge }}
          </span>
        </div>

        <!-- Date d'arrivée -->
        <div v-if="profile.joinDate" class="text-sm text-gray-400 mb-4">
          Member since {{ profile.joinDate }}
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button @click="sendMessage"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-chat-darker rounded-lg hover:bg-accent-hover transition-colors">
            <ChatBubbleLeftIcon class="w-5 h-5" />
            <span>Message</span>
          </button>
          <button v-if="!profile.isFriend" 
            @click="$emit('addFriend')"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 glass-effect rounded-lg hover:bg-chat-light transition-colors">
            <UserPlusIcon class="w-5 h-5" />
            <span>Add Friend</span>
          </button>
          <button v-else 
            @click="$emit('removeFriend')"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 glass-effect rounded-lg hover:bg-red-500 hover:text-white transition-colors">
            <UserMinusIcon class="w-5 h-5" />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
