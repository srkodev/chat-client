<template>
  <div class="min-h-screen bg-chat-dark p-8">
    <div class="max-w-2xl mx-auto">
      <button @click="router.back()" 
        class="flex items-center gap-2 text-accent hover:text-accent-hover mb-8">
        <ArrowLeftIcon class="w-5 h-5" />
        <span>Retour</span>
      </button>

      <div class="glass-effect rounded-2xl p-8">
        <h1 class="text-3xl font-bold gradient-text mb-8">Ajouter votre serveur auto-hébergé</h1>

        <div class="space-y-6">
          <!-- Icon Upload (facultatif) -->
          <div class="flex justify-center">
            <div class="w-32 h-32 glass-effect rounded-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
              <PhotoIcon class="w-12 h-12 text-accent" />
            </div>
          </div>

          <!-- Domain / IP -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Nom de domaine ou IP</label>
            <input
              v-model="serverData.domain"
              type="text"
              class="w-full bg-chat-light bg-opacity-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
              placeholder="exemple.com ou 192.168.0.1"
            />
          </div>

          <!-- Description / Config optionnelle (facultatif) -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Configuration (optionnelle)</label>
            <textarea
              v-model="serverData.config"
              rows="3"
              class="w-full bg-chat-light bg-opacity-50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-accent placeholder-gray-500"
              placeholder="Vous pouvez ajouter des options supplémentaires au format JSON"
            ></textarea>
          </div>

          <button @click="addServer"
            class="w-full bg-gradient-to-r from-accent to-secondary py-4 rounded-xl text-chat-darker font-bold hover:opacity-90 transition-opacity">
            Ajouter le serveur
          </button>
          <p v-if="error" class="text-red-500 mt-4">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { PhotoIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline';
import { useServerStore } from '../stores/serverStore';

const router = useRouter();

const serverData = ref({
  domain: '',
  config: '' // ici, on attend une chaîne JSON optionnelle (ou vide)
});

const error = ref('');

const serverStore = useServerStore();

async function addServer() {
  try {
    // Si le champ config n'est pas vide, on peut le parser en objet JSON
    let configObj = {};
    if (serverData.value.config.trim() !== '') {
      try {
        configObj = JSON.parse(serverData.value.config);
      } catch (e) {
        error.value = 'Le champ configuration doit être un JSON valide.';
        return;
      }
    }
    await serverStore.addServer(serverData.value.domain, serverData.value.domain, configObj);
    router.push('/'); // redirige vers la page d'accueil après ajout
  } catch (err: any) {
    error.value = err.message || 'Erreur lors de l’ajout du serveur';
  }
}
</script>
