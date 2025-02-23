<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { 
  PaperAirplaneIcon, 
  PhotoIcon, 
  CodeBracketIcon, 
  FaceSmileIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline';
import EmojiPicker from './EmojiPicker.vue';
import { onClickOutside } from '@vueuse/core';

const props = defineProps<{
  users?: { id: number; name: string }[];
  replyTo?: {
    id: number;
    user: string;
    content: string;
  };
}>();

const emit = defineEmits(['send', 'cancelReply']);

const message = ref('');
const showEmojis = ref(false);
const showMentions = ref(false);
const mentionSearch = ref('');
// Nouvelle variable pour la position du picker
const emojiPickerPosition = ref({ x: 0, y: 0 });
const mentionsRef = ref(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);

// On ne gère plus ici la fermeture du picker via onClickOutside car EmojiPicker s'en charge

const filteredUsers = computed(() => {
  if (!props.users) return [];
  return props.users.filter(user => 
    user.name.toLowerCase().includes(mentionSearch.value.toLowerCase())
  );
});

const insertEmoji = (emoji: string) => {
  message.value += emoji;
  showEmojis.value = false;
};

const insertMention = (user: { id: number; name: string }) => {
  const cursorPos = inputRef.value?.selectionStart || 0;
  const textBeforeCursor = message.value.substring(0, cursorPos);
  const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
  
  if (lastAtSymbol !== -1) {
    message.value = 
      message.value.substring(0, lastAtSymbol) +
      `@${user.name} ` +
      message.value.substring(cursorPos);
  }
  
  showMentions.value = false;
  mentionSearch.value = '';
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  const cursorPos = target.selectionStart;
  const textBeforeCursor = message.value.substring(0, cursorPos);
  
  if (textBeforeCursor.endsWith('@')) {
    showMentions.value = true;
    mentionSearch.value = '';
  } else if (showMentions.value) {
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    if (lastAtSymbol !== -1) {
      mentionSearch.value = textBeforeCursor.substring(lastAtSymbol + 1);
    }
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  } else if (event.key === 'Escape' && props.replyTo) {
    emit('cancelReply');
  }
};

const insertCodeBlock = () => {
  message.value += '\n```\n\n```';
  nextTick(() => {
    if (inputRef.value) {
      const pos = message.value.length - 4;
      inputRef.value.selectionStart = pos;
      inputRef.value.selectionEnd = pos;
      inputRef.value.focus();
    }
  });
};

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = e.target?.result as string;
      message.value += `\n![image](${img})\n`;
    };
    reader.readAsDataURL(file);
  }
};

const sendMessage = () => {
  if (!message.value.trim()) return;
  
  emit('send', {
    content: message.value,
    replyTo: props.replyTo
  });
  message.value = '';
};

const toggleEmojiPicker = (event: MouseEvent) => {
  const button = event.currentTarget as HTMLElement;
  const rect = button.getBoundingClientRect();
  const pickerHeight = 400; // Taille du picker en px
  let x = rect.left; // Position horizontale du bouton
  let y = rect.top - pickerHeight - 10; // Essayer de positionner le picker au-dessus du bouton
  if (y < 0) {
    // Si le picker déborde en haut, le positionner en dessous du bouton
    y = rect.bottom + 10;
  }
  emojiPickerPosition.value = { x, y };
  showEmojis.value = !showEmojis.value;
};

watch(message, () => {
  if (inputRef.value) {
    inputRef.value.style.height = 'auto';
    inputRef.value.style.height = `${inputRef.value.scrollHeight}px`;
  }
});
</script>

<template>
  <div class="p-4 mobile-input slide-up relative">
    <!-- Reply Preview -->
    <div v-if="replyTo" 
      class="glass-effect rounded-xl p-3 mb-2 flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm text-gray-400">
        <span>Replying to {{ replyTo.user }}</span>
        <span class="truncate">{{ replyTo.content }}</span>
      </div>
      <button @click="$emit('cancelReply')" 
        class="text-gray-400 hover:text-gray-200">
        <XMarkIcon class="w-5 h-5" />
      </button>
    </div>

    <div class="glass-effect rounded-xl p-3">
      <div class="flex items-start gap-3">
        <div class="flex gap-2">
          <input
            type="file"
            accept="image/*"
            class="hidden"
            id="image-upload"
            @change="handleImageUpload"
          />
          <label for="image-upload" 
            class="p-2 text-accent hover:text-accent-hover rounded-lg hover:glass-effect cursor-pointer touch-button touch-target">
            <PhotoIcon class="w-6 h-6" />
          </label>
          <button
            @click.stop="toggleEmojiPicker"
            class="p-2 text-accent hover:text-accent-hover rounded-lg hover:glass-effect touch-button touch-target">
            <FaceSmileIcon class="w-6 h-6" />
          </button>
          <button
            @click="insertCodeBlock"
            class="p-2 text-accent hover:text-accent-hover rounded-lg hover:glass-effect touch-button touch-target">
            <CodeBracketIcon class="w-6 h-6" />
          </button>
        </div>
        
        <textarea
          ref="inputRef"
          v-model="message"
          @input="handleInput"
          @keydown="handleKeydown"
          rows="1"
          :placeholder="replyTo ? `Reply to ${replyTo.user}...` : 'Send a message...'"
          class="flex-1 bg-transparent outline-none placeholder-gray-500 min-w-0 resize-none max-h-[200px] py-2"
        ></textarea>
        
        <button
          @click="sendMessage"
          class="p-2 bg-gradient-to-r from-accent to-secondary rounded-lg text-chat-darker hover:opacity-90 transition-opacity shrink-0 touch-button touch-target self-end">
          <PaperAirplaneIcon class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- Emoji Picker Component -->
    <EmojiPicker 
      v-if="showEmojis" 
      :position="emojiPickerPosition" 
      @select="insertEmoji" 
      @close="showEmojis = false" 
    />

    <!-- Mentions Dropdown -->
    <div v-if="showMentions && filteredUsers.length > 0" ref="mentionsRef"
      class="absolute bottom-24 left-4 z-50 glass-effect rounded-xl p-2 max-h-48 overflow-y-auto">
      <div v-for="user in filteredUsers" :key="user.id"
        @click="insertMention(user)"
        class="px-4 py-2 hover:bg-chat-light rounded-lg cursor-pointer">
        @{{ user.name }}
      </div>
    </div>
  </div>
</template>
