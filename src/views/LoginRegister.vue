<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';

const router = useRouter();

const isRegisterMode = ref(false);

const formData = ref({
  username: '',
  password: '',
  confirmPassword: '',
});

const errorMessage = ref('');
const successMessage = ref('');

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value;
  errorMessage.value = '';
  successMessage.value = '';
  formData.value = { username: '', password: '', confirmPassword: '' };
};

const handleSubmit = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    if (isRegisterMode.value) {
      // Vérification des mots de passe pour l'inscription
      if (formData.value.password !== formData.value.confirmPassword) {
        errorMessage.value = 'Les mots de passe ne correspondent pas.';
        return;
      }
      const response = await axios.post('http://localhost:4000/api/register', {
        username: formData.value.username,
        password: formData.value.password,
      });
      successMessage.value = (response.data as { message: string }).message || 'Inscription réussie.';
      // On passe en mode connexion après une inscription réussie
      isRegisterMode.value = false;
    } else {
      // Connexion
      const response = await axios.post('http://localhost:4000/api/login', {
        username: formData.value.username,
        password: formData.value.password,
      });
      const token = (response.data as { token: string }).token;
      if (token) {
        localStorage.setItem('token', token);
        router.push('/');
      } else {
        errorMessage.value = 'Connexion échouée.';
      }
    }
  } catch (error: any) {
    errorMessage.value =
      error.response?.data?.error || 'Erreur lors de l\'opération.';
  }
};
</script>

<template>
  <div class="min-h-screen bg-chat-dark flex items-center justify-center p-4">
    <div class="glass-effect rounded-2xl p-8 max-w-md w-full">
      <button @click="router.back()" class="flex items-center gap-2 text-accent hover:text-accent-hover mb-6">
        <ArrowLeftIcon class="w-5 h-5" />
        <span>Retour</span>
      </button>

      <h1 class="text-3xl font-bold gradient-text mb-6 text-center">
        {{ isRegisterMode ? 'Inscription' : 'Connexion' }}
      </h1>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="username" class="block text-sm text-gray-300 mb-1">
            Nom d'utilisateur
          </label>
          <input
            id="username"
            type="text"
            v-model="formData.username"
            required
            placeholder="Votre nom d'utilisateur"
            class="w-full bg-chat-light bg-opacity-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
          />
        </div>

        <div>
          <label for="password" class="block text-sm text-gray-300 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            v-model="formData.password"
            required
            placeholder="Votre mot de passe"
            class="w-full bg-chat-light bg-opacity-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
          />
        </div>

        <div v-if="isRegisterMode">
          <label for="confirmPassword" class="block text-sm text-gray-300 mb-1">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            v-model="formData.confirmPassword"
            required
            placeholder="Confirmez votre mot de passe"
            class="w-full bg-chat-light bg-opacity-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
          />
        </div>

        <div v-if="errorMessage" class="text-red-500 text-center">
          {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="text-green-500 text-center">
          {{ successMessage }}
        </div>

        <button
          type="submit"
          class="w-full bg-gradient-to-r from-accent to-secondary py-4 rounded-xl text-chat-darker font-bold hover:opacity-90 transition-opacity"
        >
          {{ isRegisterMode ? 'S\'inscrire' : 'Se connecter' }}
        </button>
      </form>

      <div class="mt-4 text-center">
        <button @click="toggleMode" class="text-accent hover:underline">
          {{ isRegisterMode ? 'Vous avez déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Vous pouvez ajouter des styles spécifiques ici si besoin */
</style>
