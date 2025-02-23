<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ArrowLeftIcon, PlusCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/vue/24/outline';

const router = useRouter();

interface Friend {
  id: number;
  username: string;
  avatar: string;
  status: string;
  lastActive?: string;
  lastMessage?: string;
}

interface FriendRequest {
  id: number;
  requester: {
    id: number;
    username: string;
    avatar: string;
  };
  status: string;
}

const friends = ref<Friend[]>([]);
const pendingRequests = ref<FriendRequest[]>([]);
const filterStatus = ref('all');
const errorMessage = ref('');

const fetchFriends = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:4000/api/friends', {
      headers: { Authorization: `Bearer ${token}` },
    });
    friends.value = response.data as Friend[];
  } catch (err: any) {
    console.error(err);
    errorMessage.value = 'Erreur lors du chargement des amis';
  }
};

const fetchFriendRequests = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:4000/api/friend-requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    pendingRequests.value = response.data as FriendRequest[];
  } catch (err: any) {
    console.error(err);
    errorMessage.value = 'Erreur lors du chargement des demandes';
  }
};

const acceptRequest = async (requestId: number) => {
  try {
    const token = localStorage.getItem('token');
    await axios.put(`http://localhost:4000/api/friend-requests/${requestId}/accept`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchFriendRequests();
    await fetchFriends();
  } catch (err: any) {
    console.error(err);
    errorMessage.value = 'Erreur lors de l\'acceptation de la demande';
  }
};

const rejectRequest = async (requestId: number) => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:4000/api/friend-requests/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchFriendRequests();
  } catch (err: any) {
    console.error(err);
    errorMessage.value = 'Erreur lors du rejet de la demande';
  }
};

onMounted(() => {
  fetchFriends();
  fetchFriendRequests();
});

// Filtrage simple (à ajuster selon vos besoins)
const filteredFriends = computed(() => {
  if (filterStatus.value === 'all') return friends.value;
  if (filterStatus.value === 'online') {
    return friends.value.filter((f) => f.status.toLowerCase() === 'online');
  }
  if (filterStatus.value === 'pending') {
    // Ici, on pourrait retourner les demandes en attente plutôt que les amis
    return [];
  }
  return friends.value;
});
</script>

<template>
  <div class="min-h-screen bg-chat-dark p-4 sm:p-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div class="flex items-center gap-4">
          <button @click="router.push('/')" class="text-accent hover:text-accent-hover">
            <ArrowLeftIcon class="w-6 h-6" />
          </button>
          <h1 class="text-2xl font-bold gradient-text">Friends</h1>
        </div>
        <router-link to="/add-friend" class="glass-effect px-4 py-2 rounded-xl hover:scale-105 transition-transform flex items-center gap-2 w-full sm:w-auto justify-center">
          <PlusCircleIcon class="w-5 h-5" />
          <span>Add Friend</span>
        </router-link>
      </div>

      <!-- Demandes d'amis en attente -->
      <div v-if="pendingRequests.length > 0" class="mb-6">
        <h2 class="text-xl font-bold text-gray-200 mb-4">Friend Requests</h2>
        <div class="space-y-4">
          <div v-for="req in pendingRequests" :key="req.id" class="glass-effect rounded-xl p-6 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <img :src="req.requester.avatar" alt="avatar" class="w-12 h-12 rounded-xl" />
              <div>
                <h3 class="font-bold">{{ req.requester.username }}</h3>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="acceptRequest(req.id)" class="bg-green-500 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity flex items-center gap-1">
                <CheckCircleIcon class="w-5 h-5" />
                <span>Accept</span>
              </button>
              <button @click="rejectRequest(req.id)" class="bg-red-500 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity flex items-center gap-1">
                <XCircleIcon class="w-5 h-5" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs pour amis -->
      <div class="flex flex-wrap gap-4 mb-6">
        <button @click="filterStatus = 'all'" :class="['px-4 py-2 rounded-xl transition-all duration-300 w-full sm:w-auto', filterStatus === 'all' ? 'glass-effect neon-border' : 'text-gray-400 hover:text-gray-200']">
          All
        </button>
        <button @click="filterStatus = 'online'" :class="['px-4 py-2 rounded-xl transition-all duration-300 w-full sm:w-auto', filterStatus === 'online' ? 'glass-effect neon-border' : 'text-gray-400 hover:text-gray-200']">
          Online
        </button>
      </div>

      <div v-if="errorMessage" class="text-red-500 mb-4">{{ errorMessage }}</div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        <div v-for="friend in filteredFriends" :key="friend.id" @click="router.push(`/messages/${friend.id}`)" class="glass-effect rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform">
          <div class="flex items-center gap-4">
            <div class="relative shrink-0">
              <img :src="friend.avatar" alt="avatar" class="w-12 h-12 rounded-xl" />
              <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-accent border-2 border-chat-dark"></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-bold truncate">{{ friend.username }}</h3>
                  <p class="text-sm text-gray-400 truncate">{{ friend.status }}</p>
                </div>
                <span class="text-sm text-gray-400 shrink-0">{{ friend.lastActive || '' }}</span>
              </div>
              <p class="text-gray-300 mt-2 truncate">{{ friend.lastMessage || '' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
