<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { createPicker } from 'picmo';

const props = defineProps<{
  position?: { x: number; y: number };
}>();

const emit = defineEmits(['select', 'close']);
const pickerContainer = ref<HTMLDivElement | null>(null);

onMounted(() => {
  if (pickerContainer.value) {
    const picker = createPicker({
      rootElement: pickerContainer.value,
      theme: 'dark',
      showPreview: false,
      showRecents: false,
      className: 'custom-picker',
      i18n: {
        categories: {
          smileys: 'Smileys & Emotion',
          people: 'People & Body',
          animals: 'Animals & Nature',
          food: 'Food & Drink',
          activities: 'Activities',
          travel: 'Travel & Places',
          objects: 'Objects',
          symbols: 'Symbols',
          flags: 'Flags'
        }
      }
    });

    picker.addEventListener('emoji:select', event => {
      emit('select', event.emoji);
    });
  }
});

const handleClickOutside = (event: MouseEvent) => {
  if (pickerContainer.value && !pickerContainer.value.contains(event.target as Node)) {
    emit('close');
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div 
    ref="pickerContainer"
    class="emoji-picker-container"
    :style="{
      position: 'fixed',
      left: `${position?.x || 0}px`,
      top: `${position?.y || 0}px`,
      zIndex: 1000
    }">
  </div>
</template>

<style>
.emoji-picker-container {
  --accent-color: var(--accent);
  --background-color: var(--chat-darker);
  --border-color: var(--chat-light);
  --category-name-background-color: var(--chat-darker);
  --hover-color: var(--chat-light);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  margin-top: -10px;
}

.custom-picker {
  font-family: inherit;
  border-radius: 0.75rem;
  background-color: var(--chat-darker);
  border: 1px solid var(--chat-light);
}

.custom-picker .emoji {
  border-radius: 0.5rem;
}

/* Réduction de la largeur pour afficher 7 colonnes */
.picmo__picker {
  width: 400px !important;
  height: 400px !important;
}

/* Forcer 7 colonnes dans la grille des émojis */
.picmo__emojiGrid {
  grid-template-columns: repeat(7, 1fr) !important;
}

/* Personnalisation de l'aire des émojis et de la scrollbar */
.picmo__emojiArea {
  padding: 0.5rem !important;
  overflow-y: auto;
}

.picmo__emojiArea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.picmo__emojiArea::-webkit-scrollbar-track {
  background: var(--chat-darker);
}

.picmo__emojiArea::-webkit-scrollbar-thumb {
  background-color: var(--chat-light);
  border-radius: 10px;
}

.picmo__categoryTab {
  padding: 0.5rem !important;
}

.picmo__header {
  padding: 0.5rem !important;
}
</style>
