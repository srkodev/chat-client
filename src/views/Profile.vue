<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { PencilIcon, ArrowLeftIcon, CameraIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const router = useRouter();

// Définition réactive du profil utilisateur, initialement vide
const user = ref({
  username: '', // utilisation de "username" pour être cohérent avec le backend
  status: '',
  bio: '',
  avatar: '',
  email: '',
  joinDate: '',
  friends: 0,
  servers: 0,
  badges: [] as string[],
  id: ''
});

// Variables de contrôle
const isEditing = ref(false);
const showAvatarModal = ref(false);
const previewAvatar = ref('');
const bioLength = ref(0);
const maxBioLength = 160;
const errorMessage = ref('');
const successMessage = ref('');

// Nouvelle variable pour stocker le fichier d'avatar sélectionné
const avatarFile = ref<File | null>(null);

// Fonction pour récupérer le profil depuis le backend
const fetchProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get<{ username: string, status: string, bio: string, avatar: string, email: string, joinDate: string, friends: number, servers: number, badges: string[], id: string }>('http://localhost:4000/api/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const profileData = response.data;
    if (profileData.bio === null) {
      profileData.bio = '';
    }
    // Mapper la réponse du backend dans notre objet "user"
    user.value = {
      username: profileData.username,
      status: profileData.status,
      bio: profileData.bio,
      avatar: profileData.avatar,
      email: profileData.email || '',
      joinDate: profileData.joinDate || '',
      friends: profileData.friends || 0,
      servers: profileData.servers || 0,
      badges: profileData.badges || [],
      id: profileData.id
    };
    bioLength.value = user.value.bio.length;
  } catch (err: any) {
    console.error('Erreur lors du chargement du profil', err);
    errorMessage.value = 'Erreur lors du chargement du profil';
  }
};

onMounted(() => {
  fetchProfile();
});

// Fonction pour sauvegarder les modifications du profil dans la base de données
const saveChanges = async () => {
  try {
    const token = localStorage.getItem('token');
    const payload = {
      username: user.value.username,
      bio: user.value.bio,
      avatar: user.value.avatar,
      status: user.value.status,
    };
    const response = await axios.put<{ user: typeof user.value, message: string }>('http://localhost:4000/api/profile', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.data.user) {
      const updated = response.data.user;
      user.value = {
        username: updated.username,
        status: updated.status,
        bio: updated.bio,
        avatar: updated.avatar,
        email: updated.email || '',
        joinDate: updated.joinDate || '',
        friends: updated.friends || 0,
        servers: updated.servers || 0,
        badges: updated.badges || [],
        id: updated.id
      };
      bioLength.value = user.value.bio.length;
    }
    successMessage.value = response.data.message || 'Profil mis à jour avec succès';
    isEditing.value = false;
  } catch (err: any) {
    console.error('Erreur lors de la mise à jour du profil', err);
    errorMessage.value = 'Erreur lors de la mise à jour du profil';
  }
};

// Gestion du changement d'avatar
const handleAvatarChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (file) {
    if (file.size > 5 * 1024 * 1024) { // Limite 5MB
      alert('La taille de l\'image doit être inférieure à 5MB');
      return;
    }
    avatarFile.value = file; // Stocker le fichier sélectionné
    const reader = new FileReader();
    reader.onload = (e) => {
      previewAvatar.value = e.target?.result as string;
      showAvatarModal.value = true;
    };
    reader.readAsDataURL(file);
  }
};

const saveAvatar = async () => {
  if (!avatarFile.value) {
    alert("Aucun fichier sélectionné");
    return;
  }
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append("avatar", avatarFile.value);
  try {
    const response = await axios.post<{ avatar: string, message: string }>('http://localhost:4000/api/upload-avatar', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    user.value.avatar = response.data.avatar;
    successMessage.value = response.data.message;
  } catch (err: any) {
    console.error('Erreur lors de l\'upload de l\'avatar', err);
    errorMessage.value = 'Erreur lors de l\'upload de l\'avatar';
  }
  showAvatarModal.value = false;
  previewAvatar.value = '';
  avatarFile.value = null;
};

const cancelAvatarChange = () => {
  showAvatarModal.value = false;
  previewAvatar.value = '';
  avatarFile.value = null;
};

const updateBioLength = (event: Event) => {
  const textarea = event.target as HTMLTextAreaElement;
  bioLength.value = textarea.value.length;
};
</script>

<template>
  <div class="min-h-screen bg-chat-dark p-8">
    <div class="max-w-2xl mx-auto">
      <button @click="router.push('/')" 
        class="flex items-center gap-2 text-accent hover:text-accent-hover mb-8">
        <ArrowLeftIcon class="w-5 h-5" />
        <span>Back to Home</span>
      </button>

      <div class="glass-effect rounded-xl p-8">
        <div class="flex items-start gap-8">
          <div class="relative group">
            <!-- Préfixer l'URL de l'avatar pour pointer vers le serveur backend -->
            <img :src="user.avatar ? 'http://localhost:4000' + user.avatar : ''" alt="avatar" class="w-32 h-32 rounded-xl object-cover" />
            <label class="absolute inset-0 bg-black bg-opacity-50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleAvatarChange"
              />
              <CameraIcon class="w-8 h-8 text-white" />
            </label>
          </div>
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h1 class="text-2xl font-bold gradient-text">{{ user.username }}</h1>
                <p class="text-gray-400">{{ user.status }}</p>
              </div>
              <button @click="isEditing = !isEditing"
                class="glass-effect p-2 rounded-lg hover:scale-105 transition-transform">
                <PencilIcon class="w-5 h-5 text-accent" />
              </button>
            </div>

            <!-- Bio -->
            <div class="mt-4 glass-effect rounded-lg p-4">
              <h3 class="text-sm font-medium text-gray-400 mb-2">Bio</h3>
              <p v-if="!isEditing" class="text-gray-300 whitespace-pre-wrap">{{ user.bio }}</p>
              <div v-else class="space-y-2">
                <textarea
                  v-model="user.bio"
                  @input="updateBioLength"
                  rows="3"
                  :maxlength="maxBioLength"
                  class="w-full bg-chat-light bg-opacity-50 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-accent resize-none"
                  placeholder="Tell us about yourself..."
                ></textarea>
                <div class="flex justify-end">
                  <span class="text-sm text-gray-400">
                    {{ bioLength }}/{{ maxBioLength }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Badges -->
            <div class="flex gap-2 mt-4">
              <span v-for="badge in user.badges" :key="badge"
                class="px-3 py-1 rounded-full text-xs glass-effect">
                {{ badge }}
              </span>
            </div>

            <div class="grid grid-cols-3 gap-4 mt-8">
              <div class="glass-effect rounded-lg p-4 text-center hover:scale-105 transition-transform">
                <h3 class="text-2xl font-bold gradient-text">{{ user.friends }}</h3>
                <p class="text-sm text-gray-400">Friends</p>
              </div>
              <div class="glass-effect rounded-lg p-4 text-center hover:scale-105 transition-transform">
                <h3 class="text-2xl font-bold gradient-text">{{ user.servers }}</h3>
                <p class="text-sm text-gray-400">Servers</p>
              </div>
              <div class="glass-effect rounded-lg p-4 text-center hover:scale-105 transition-transform">
                <h3 class="text-sm font-bold">{{ user.joinDate }}</h3>
                <p class="text-sm text-gray-400">Joined</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Bouton pour sauvegarder les modifications en mode édition -->
        <div v-if="isEditing" class="mt-8 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
            <input
              v-model="user.username"
              type="text"
              class="w-full bg-chat-light bg-opacity-50 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Status</label>
            <input
              v-model="user.status"
              type="text"
              class="w-full bg-chat-light bg-opacity-50 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button @click="saveChanges" class="w-full bg-gradient-to-r from-accent to-secondary py-3 rounded-lg text-chat-darker hover:opacity-90 transition-opacity">
            Save Changes
          </button>
          <div v-if="errorMessage" class="text-red-500 text-center">{{ errorMessage }}</div>
          <div v-if="successMessage" class="text-green-500 text-center">{{ successMessage }}</div>
        </div>
      </div>
    </div>

    <!-- Avatar Preview Modal -->
    <div v-if="showAvatarModal" 
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="glass-effect rounded-xl p-6 max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Update Profile Picture</h3>
          <button @click="cancelAvatarChange" class="text-gray-400 hover:text-white">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        
        <div class="aspect-square rounded-xl overflow-hidden mb-6">
          <img :src="previewAvatar" alt="preview" class="w-full h-full object-cover" />
        </div>
        
        <div class="flex gap-4">
          <button @click="cancelAvatarChange"
            class="flex-1 px-4 py-2 glass-effect rounded-lg hover:bg-chat-light transition-colors">
            Cancel
          </button>
          <button @click="saveAvatar"
            class="flex-1 bg-gradient-to-r from-accent to-secondary px-4 py-2 rounded-lg text-chat-darker hover:opacity-90 transition-opacity">
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ajoutez ici des styles personnalisés si nécessaire */
</style>
