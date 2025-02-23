<script setup lang="ts">
import { ref } from 'vue';
import { ArrowLeftIcon, UserPlusIcon } from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const username = ref('');
const searchResults = ref<any[]>([]);
const errorMessage = ref('');

const searchFriends = async () => {
  try {
    const token = localStorage.getItem('token');
    if (username.value.trim() !== '') {
      const response = await axios.get(`http://localhost:4000/api/search-users?query=${username.value}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      searchResults.value = response.data as any[];
    } else {
      const response = await axios.get(`http://localhost:4000/api/friends/suggestions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      searchResults.value = response.data as any[];
    }
  } catch (err: any) {
    console.error(err);
    errorMessage.value = 'Erreur lors de la recherche';
  }
};

const addFriend = async (friendUsername: string) => {
  try {
    const token = localStorage.getItem('token');
    // Envoie de la demande d'ami via le nouvel endpoint
    await axios.post('http://localhost:4000/api/friend-requests', { friendUsername }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    errorMessage.value = ''; // Effacer les erreurs éventuelles
    alert("Demande d'ami envoyée, en attente d'acceptation");
    await searchFriends();
  } catch (err: any) {
    console.error(err);
    errorMessage.value = 'Erreur lors de l\'envoi de la demande d\'ami';
  }
};
</script>

<template>
  <div class="min-h-screen bg-chat-dark p-8">
    <div class="max-w-2xl mx-auto">
      <div class="flex items-center gap-4 mb-8">
        <button @click="router.push('/friends')" class="text-accent hover:text-accent-hover">
          <ArrowLeftIcon class="w-6 h-6" />
        </button>
        <h1 class="text-2xl font-bold gradient-text">Add Friend</h1>
      </div>
      <div class="glass-effect rounded-xl p-6 mb-8">
        <div class="relative">
          <input
            v-model="username"
            @input="searchFriends"
            type="text"
            placeholder="Enter a username to search..."
            class="w-full bg-chat-light bg-opacity-50 rounded-lg pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-accent"
          />
          <UserPlusIcon class="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
        </div>
      </div>
      <div v-if="errorMessage" class="text-red-500 mb-4 text-center">
        {{ errorMessage }}
      </div>
      <div v-if="searchResults.length > 0" class="space-y-4">
        <div v-for="user in searchResults" :key="user.id"
          class="glass-effect rounded-xl p-6 hover:scale-105 transition-transform flex items-center justify-between">
          <div class="flex items-center gap-4">
            <img :src="user.avatar" alt="avatar" class="w-12 h-12 rounded-xl" />
            <div>
              <h3 class="font-bold">{{ user.username }}</h3>
              <p class="text-sm text-gray-400">
                {{ user.mutualFriends ? user.mutualFriends + ' mutual friends' : 'No mutual friends' }}
              </p>
            </div>
          </div>
          <button @click="addFriend(user.username)" class="bg-gradient-to-r from-accent to-secondary px-4 py-2 rounded-lg text-chat-darker hover:opacity-90 transition-opacity flex items-center gap-2">
            <UserPlusIcon class="w-5 h-5" />
            <span>Add Friend</span>
          </button>
        </div>
      </div>
      <div v-else class="text-center text-gray-400 mt-8">
        <p>No results found. Try a different username!</p>
      </div>
    </div>
  </div>
</template>
