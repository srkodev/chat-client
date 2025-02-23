<template>
  <div class="min-h-screen bg-chat-dark">
    <!-- Navigation Bar -->
    <nav class="bg-chat-darker p-4">
      <div class="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 class="text-2xl font-bold gradient-text">NeoChat</h1>
        <div class="flex gap-4">
          <router-link to="/friends" class="glass-effect px-4 py-2 rounded-xl hover:scale-105 transition-transform">
            Friends
          </router-link>
          <router-link to="/profile" class="glass-effect px-4 py-2 rounded-xl hover:scale-105 transition-transform">
            Profile
          </router-link>
        </div>
      </div>
    </nav>

    <div class="container mx-auto p-4 sm:p-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Section Serveurs auto-hébergés -->
        <div class="lg:col-span-2">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h2 class="text-xl font-bold gradient-text">Mes Serveurs Auto-Hébergés</h2>
            <router-link to="/add-server" 
              class="glass-effect px-4 py-2 rounded-xl hover:scale-105 transition-transform flex items-center gap-2 w-full sm:w-auto justify-center">
              <PlusCircleIcon class="w-5 h-5" />
              <span>Ajouter un serveur</span>
            </router-link>
          </div>
          <div v-if="loading" class="text-white">Chargement...</div>
          <div v-else-if="servers.length === 0" class="text-gray-400">
            Vous n'avez pas encore ajouté de serveur.
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6" v-else>
            <div v-for="server in servers" :key="server.id"
              @click="navigateToServer(server.id)"
              class="glass-effect rounded-xl p-6 cursor-pointer hover:scale-105 transition-transform">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-accent to-secondary">
                  <!-- Vous pouvez ajouter une icône ici -->
                  <HashtagIcon class="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 class="font-bold">{{ server.domain }}</h3>
                  <!-- D'autres infos peuvent être affichées ici -->
                </div>
              </div>
              <div class="h-2 rounded-full bg-gradient-to-r from-accent to-secondary"></div>
            </div>
          </div>
        </div>

        <!-- Section Online Friends -->
        <div>
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <h2 class="text-xl font-bold gradient-text">Online Friends</h2>
            <router-link to="/add-friend" 
              class="glass-effect px-4 py-2 rounded-xl hover:scale-105 transition-transform flex items-center gap-2 w-full sm:w-auto justify-center">
              <PlusCircleIcon class="w-5 h-5" />
              <span>Add Friend</span>
            </router-link>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div v-for="friend in onlineFriends" :key="friend.id"
              @click="router.push(`/messages/${friend.id}`)"
              class="glass-effect rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform">
              <div class="flex items-center gap-3">
                <img :src="friend.avatar" alt="avatar" class="w-10 h-10 rounded-lg" />
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold truncate">{{ friend.username }}</h4>
                  <p class="text-sm text-gray-400 truncate">{{ friend.status }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { HashtagIcon, PlusCircleIcon } from '@heroicons/vue/24/outline';
import { useServerStore } from '../stores/serverStore';

const router = useRouter();
const serverStore = useServerStore();
const { servers, loading, fetchServers } = serverStore;

const friends = ref<any[]>([]);
const onlineFriends = computed(() => {
  return friends.value.filter(friend => friend.status && friend.status.toLowerCase() === 'online');
});

async function fetchFriends() {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get('http://localhost:4000/api/friends', {
      headers: { Authorization: `Bearer ${token}` },
    });
    friends.value = response.data as any[];
  } catch (err) {
    console.error(err);
  }
}

function navigateToServer(id: number) {
  router.push(`/server/${id}`);
}

onMounted(() => {
  fetchServers();
  fetchFriends();
});
</script>
